import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisiteTechniqueComponent } from './visite-technique.component';

describe('VisiteTechniqueComponent', () => {
  let component: VisiteTechniqueComponent;
  let fixture: ComponentFixture<VisiteTechniqueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisiteTechniqueComponent]
    });
    fixture = TestBed.createComponent(VisiteTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
