import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuideLayoutComponent } from './guide-layout.component';

describe('GuideLayoutComponent', () => {
  let component: GuideLayoutComponent;
  let fixture: ComponentFixture<GuideLayoutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuideLayoutComponent]
    });
    fixture = TestBed.createComponent(GuideLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
