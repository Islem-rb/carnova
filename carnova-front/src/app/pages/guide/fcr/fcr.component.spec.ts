import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FcrComponent } from './fcr.component';

describe('FcrComponent', () => {
  let component: FcrComponent;
  let fixture: ComponentFixture<FcrComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FcrComponent]
    });
    fixture = TestBed.createComponent(FcrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
