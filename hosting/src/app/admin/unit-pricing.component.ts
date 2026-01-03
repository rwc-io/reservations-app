import {Component, computed, inject, OnDestroy, OnInit, signal, Signal} from '@angular/core';
import {DataService} from '../data-service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {map, Subscription} from 'rxjs';
import {Storage} from '@angular/fire/storage';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from "@angular/material/dialog";
import {PricingTier, UnitPricing, UnitPricingMap} from '../types';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatDivider} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {ErrorDialog} from '../utility/error-dialog.component';
import {CopyPricingDialog} from './copy-pricing-dialog.component';

interface UnitPricingRow {
  unitName: string;
  prices: Record<string, number>;
}

@Component({
  selector: 'app-unit-pricing',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    MatSelect,
    MatOption,
    FormsModule,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatCardActions,
    MatButton,
    MatTableModule,
    MatDivider,
    MatExpansionModule,
  ],
  templateUrl: './unit-pricing.component.html',
  host: {
    'class': 'admin-component-contents'
  }
})
export class UnitPricingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);

  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);

  year = this.dataService.activeYear
  availableYears = this.dataService.availableYearsSig;
  selectedUnitId = signal('');
  units = this.dataService.units;
  allPricings = toSignal(this.dataService.unitPricing$, {initialValue: {} as UnitPricingMap});
  tiers = toSignal(this.dataService.pricingTiers$, {initialValue: [] as PricingTier[]});
  tierIds = computed(() => this.tiers().map(t => t.id))

  dataSource = computed(() => {
    const units = this.units();
    const allPricings = this.allPricings();
    const tiers = this.tiers();

    return units.map(unit => {
      const pricing = allPricings[unit.id] || [];
      const row: UnitPricingRow = {
        unitName: unit.name,
        prices: {}
      };

      tiers.forEach(tier => {
        const p = pricing.find(x => x.tierId === tier.id);
        row.prices[tier.id] = p?.weeklyPrice ?? p?.dailyPrice ?? 0;
      });

      return row;
    });
  });

  displayedColumns = computed(() => {
    return ['unitName', ...this.tierIds()];
  });

  unit = computed(() => {
    return this.units().find(unit => unit.id === this.selectedUnitId())
  });

  unitPricing = computed(() => {
    return this.allPricings()[this.selectedUnitId()] || [];
  })

  form: Signal<FormGroup> = computed(() => {
    const unitPricing = this.unitPricing();

    const group: Record<string, FormControl> = {};

    this.tierIds().forEach(tierId => {
      const tieredPrice = unitPricing.find(p => p.tierId === tierId);
      group[`${tierId}_id`] = new FormControl(tieredPrice?.id || "");
      group[`${tierId}_dailyPrice`] = new FormControl(tieredPrice?.dailyPrice || 0);
      group[`${tierId}_weeklyPrice`] = new FormControl(tieredPrice?.weeklyPrice || 0);
    });

    return new FormGroup(group);
  });

  private paramSubscription?: Subscription;

  ngOnInit() {
    this.paramSubscription = this.route.paramMap.pipe(
      map(params => {
        return params.get('unitId');
      })
    ).subscribe(unitId => {
      this.selectedUnitId.set(unitId || "");
    });

  }

  ngOnDestroy() {
    this.paramSubscription?.unsubscribe();
  }

  onCopyFrom() {
    const availableYears = this.availableYears().filter(y => y !== this.year());

    const dialogRef = this.dialog.open(CopyPricingDialog, {
      data: {
        activeYear: this.year(),
        availableYears,
      }
    });

    dialogRef.afterClosed().subscribe(fromYear => {
      if (fromYear) {
        this.dataService.copyUnitPricing(fromYear, this.year()).then(() => {
          this.snackBar.open('Pricing copied', 'Ok', {
            duration: 3000
          });
        }).catch(error => {
          this.dialog.open(ErrorDialog, {data: `Couldn't copy pricing: ${error.message}`});
        });
      }
    });
  }

  onSubmit() {
    const formValue = this.form().getRawValue();

    const unitPricings = this.tierIds().map(tierId => {
      const existingId = formValue[`${tierId}_id`] || "";
      const dailyPrice = formValue[`${tierId}_dailyPrice`] || 0;
      const weeklyPrice = formValue[`${tierId}_weeklyPrice`] || 0;

      return {
        id: existingId,
        year: this.year(),
        tierId,
        unitId: this.selectedUnitId(),
        dailyPrice,
        weeklyPrice,
      } as UnitPricing;
    });

    this.dataService.setUnitPricing(unitPricings).then(
      () => {
        this.snackBar.open('Pricing updated', 'Ok', {
          duration: 3000
        });
      }
    ).catch(error => {
      this.dialog.open(ErrorDialog, {data: `Couldn't update pricing: ${error.message}`});
    });
  }
}
