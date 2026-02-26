import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {Title} from '@angular/platform-browser';
import reservationsAppConfig from './reservations-app.config.json';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the title from config`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toEqual(reservationsAppConfig.applicationTitle);
  });

  it('should render nothing in the template (only router-outlet)', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
