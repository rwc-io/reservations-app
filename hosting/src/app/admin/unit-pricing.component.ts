import {Component, computed, inject, OnDestroy, OnInit, signal, Signal} from '@angular/core';
import {DataService} from '../data-service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {map, Subscription} from 'rxjs';
import {Storage} from '@angular/fire/storage';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from "@angular/material/dialog";
import {PricingTierMap, UnitPricing, UnitPricingMap} from '../types';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {ErrorDialog} from '../utility/error-dialog.component';

@Component({
  selector: 'unit-pricing',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    MatSelect,
    MatOption,
    NgForOf,
    FormsModule,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatCardActions,
    MatButton,
  ],
  templateUrl: './unit-pricing.component.html',
})
export class UnitPricingComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);

  year: Signal<number>
  selectedUnitId = signal('');
  units = this.dataService.units;
  allPricings = toSignal(this.dataService.unitPricing$, {initialValue: {} as UnitPricingMap});
  tiers = toSignal(this.dataService.pricingTiers$, {initialValue: {} as PricingTierMap});
  tierIds = computed(() => Object.keys(this.tiers()))

  unit = computed(() => {
    return this.units().find(unit => unit.id === this.selectedUnitId())
  });

  unitPricing = computed(() => {
    return this.allPricings()[this.selectedUnitId()] || [];
  })

  form: Signal<FormGroup> = computed(() => {
    const unitPricing = this.unitPricing();

    const group: any = {};

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

  constructor(private route: ActivatedRoute) {
    this.year = toSignal(this.dataService.activeYear, {initialValue: 0});
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
