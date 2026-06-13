import { Component, Input, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { AutoAssistantService, AssistantResponse } from '../../services/assistant.service';

@Component({
  selector: 'app-assistant-bubble',
  templateUrl: './assistant-bubble.component.html',
  styleUrls: ['./assistant-bubble.component.css']
})
export class AssistantBubbleComponent implements AfterViewChecked {
  @Input() annonceId?: number;
  @Input() context: any;

  open = false;
  sending = false;
  input = '';

  messages: { role: 'user' | 'assistant'; text: string }[] = [
    { role: 'assistant', text: 'Bonjour 👋 Je suis l’assistant CarNova. Posez vos questions sur cette voiture, la négociation ou les démarches.' }
  ];

  followUps: string[] = [
    'Peux-tu estimer un prix de négociation pour ce modèle ?',
    'Quels documents dois-je vérifier avant d’acheter ?',
    'Est-ce adapté pour 50 km/jour ?'
  ];

  @ViewChild('msgEnd') msgEnd?: ElementRef;

  constructor(private ai: AutoAssistantService) {}

  ngAfterViewChecked(): void { this.scrollToBottom(); }

  toggle() {
    this.open = !this.open;
    setTimeout(() => this.scrollToBottom(), 0);
  }

  send(msg?: string) {
    const text = (msg || this.input || '').trim();
    if (!text || this.sending) return;

    this.messages.push({ role: 'user', text });
    this.input = '';
    this.sending = true;

    this.ai.chat(text, this.context, this.annonceId).subscribe({
      next: (res: AssistantResponse) => {
        this.sending = false;
const fullText = res.answer || '—';
this.typeMessage(fullText);        if (res.followUps?.length) {
          this.followUps = res.followUps.map(f => f.text);
        }
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
        this.messages.push({ role: 'assistant', text: "Désolé, je n’ai pas pu répondre. Réessaie plus tard." });
        this.scrollToBottom();
      }
    });
  }
private typeMessage(fullText: string, delay: number = 25) {
  const index = this.messages.length;
  this.messages.push({ role: 'assistant', text: '' });

  let i = 0;
  const interval = setInterval(() => {
    if (i < fullText.length) {
      this.messages[index].text += fullText[i];
      this.scrollToBottom();
      i++;
    } else {
      clearInterval(interval);
    }
  }, delay);
}
  quickAsk(t: string) {
    this.send(t);
  }

  private scrollToBottom() {
    try { this.msgEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }
}
