import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Info3dComponent } from './info3d.component';

describe('Info3dComponent', () => {
  let component: Info3dComponent;
  let fixture: ComponentFixture<Info3dComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Info3dComponent]
    });
    fixture = TestBed.createComponent(Info3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
