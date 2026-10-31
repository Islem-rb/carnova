import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DouanesComponent } from './douanes.component';

describe('DouanesComponent', () => {
  let component: DouanesComponent;
  let fixture: ComponentFixture<DouanesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DouanesComponent]
    });
    fixture = TestBed.createComponent(DouanesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
