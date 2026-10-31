import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const root = this.el.nativeElement;
    const targets = root.querySelectorAll<HTMLElement>('.reveal, .reveal-stagger');

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-visible');
          io.unobserve(e.target); // déclenche une seule fois
        }
      }
    }, { threshold: 0.12 });

    targets.forEach(t => io.observe(t));
  }
}
