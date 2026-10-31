import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantBubbleComponent } from './assistant-bubble.component';

describe('AssistantBubbleComponent', () => {
  let component: AssistantBubbleComponent;
  let fixture: ComponentFixture<AssistantBubbleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantBubbleComponent]
    });
    fixture = TestBed.createComponent(AssistantBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
