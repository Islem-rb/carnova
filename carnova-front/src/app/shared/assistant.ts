import { Component, inject, signal, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { ChatResponse, errorMessage } from '../core/models';
import { Icon } from './icon';
@Component({
  selector: 'app-assistant',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './assistant.html',
})
export class Assistant {
  readonly ui = inject(Ui);
  private readonly api = inject(Api);
  readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');
  readonly messages = viewChild.required<ElementRef<HTMLElement>>('messages');
  readonly history = signal<{ role: string; text: string }[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly provider = signal('offline');
  readonly suggestions = signal(['Quels documents vérifier ?', 'Comment comparer les prix ?']);
  readonly message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });
  constructor() {
    afterNextRender(() => this.panel().nativeElement.showModal());
  }
  backdrop(e: MouseEvent) {
    if (e.target === this.panel().nativeElement) this.ui.assistant.set(false);
  }
  send(s?: string) {
    const text = (s ?? this.message.value).trim();
    if (!text || this.busy()) return;
    this.history.update((h) => [...h, { role: 'user', text }]);
    this.message.reset();
    this.busy.set(true);
    this.error.set('');
    this.scroll();
    this.api
      .post<ChatResponse>('/assistant/chat', {
        message: text,
        annonceId: this.ui.assistantListing(),
      })
      .subscribe({
        next: (r) => {
          this.history.update((h) => [...h, { role: 'assistant', text: r.answer }]);
          this.provider.set(r.provider);
          this.suggestions.set(r.followUps.map((x) => x.text).slice(0, 2));
          this.busy.set(false);
          this.scroll();
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.busy.set(false);
        },
      });
  }
  private scroll() {
    setTimeout(() => {
      const el = this.messages().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
