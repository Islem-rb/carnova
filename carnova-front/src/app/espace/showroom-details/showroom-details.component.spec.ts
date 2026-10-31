import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowroomDetailsComponent } from './showroom-details.component';

describe('ShowroomDetailsComponent', () => {
  let component: ShowroomDetailsComponent;
  let fixture: ComponentFixture<ShowroomDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShowroomDetailsComponent]
    });
    fixture = TestBed.createComponent(ShowroomDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
