import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsItem, NewsService } from '../../services/news.service';

@Component({
  selector: 'app-actualites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actualites.component.html',
  styleUrls: ['./actualites.component.css']
})
export class ActualitesComponent implements OnInit, OnDestroy, AfterViewInit {
  loading = true;
  error?: string;

  items: NewsItem[] = [];
  hero: NewsItem | null = null;
  rest: NewsItem[] = [];

  // Animations "reveal on scroll"
  private io?: IntersectionObserver;

  // Lecture auto vidéo (HTML: <video #heroVideo ...>)
  @ViewChild('heroVideo') heroVideo?: ElementRef<HTMLVideoElement>;
  videoOk = false;

  constructor(private api: NewsService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.io?.disconnect(); }
  ngAfterViewInit(): void { setTimeout(() => this.tryAutoplay(), 0); }

  load(): void {
    this.loading = true;
    this.error = undefined;

    this.api.list(72, 50).subscribe({
      next: (data) => {
        // 1) nettoyer / normaliser
        const clean = (data || [])
          .filter(x => x && x.sourceName !== 'SEED')
          .map(x => ({ ...x, title: (x.title || '').trim() }));

        // 2) dédoublonnage (URL, titre+source, image par domaine)
        const seenUrl = new Set<string>();
        const seenTitleSrc = new Set<string>();
        const seenImgByDomain = new Map<string, Set<string>>();
        const unique: NewsItem[] = [];

        for (const n of clean) {
          const urlKey = (n.sourceUrl || '').split('#')[0].trim();
          const titleKey =
            (n.sourceName?.toLowerCase() || '') + '|' +
            (n.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
          const domain = this.domain(n.sourceUrl);
          const img = (n.imageUrl || '').trim();

          if (urlKey && seenUrl.has(urlKey)) continue;
          if (seenTitleSrc.has(titleKey)) continue;

          if (img && domain) {
            let set = seenImgByDomain.get(domain);
            if (!set) { set = new Set<string>(); seenImgByDomain.set(domain, set); }
            if (set.has(img)) continue;
            set.add(img);
          }

          if (urlKey) seenUrl.add(urlKey);
          seenTitleSrc.add(titleKey);
          unique.push(n);
        }

        // 3) hero + liste (max 24)
        this.hero = unique.find(u => !!u.imageUrl) || unique[0] || null;
        this.rest = unique.filter(u => u !== this.hero).slice(0, 24);
        this.items = unique;

        this.loading = false;

        // 4) animations + autoplay (après rendu)
        setTimeout(() => {
          this.initReveal();
          this.tryAutoplay();
        }, 0);
      },
      error: _ => {
        this.error = 'Impossible de charger les actualités.';
        this.loading = false;
      }
    });
  }

  refreshSources(): void {
    this.loading = true;
    this.api.refresh().subscribe({
      next: _ => this.load(),
      error: _ => this.load()
    });
  }

  /** Texte "il y a X h/j" */
  fromNow(iso?: string): string {
    if (!iso) return '';
    const diff = Date.now() - Date.parse(iso);
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'à l’instant';
    if (h < 24) return `il y a ${h} h`;
    const j = Math.floor(h / 24);
    return `il y a ${j} j`;
  }

  /** Domaine (sans www) */
  domain(url?: string): string {
    try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; }
    catch { return ''; }
  }

  /** Remplace l'image par une fallback si erreur réseau */
  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/news-fallback.jpg';
  }

  trackById(_i: number, n: NewsItem) {
    return (n as any).id ?? n.sourceUrl ?? n.title;
  }

  // ========= Résumé sans balises/images (fix doublons) =========
  summaryText(raw?: string, max = 240): string {
    if (!raw) return '';
    // retire balises média + scripts/styles
    let s = raw
      .replace(/<img[\s\S]*?>/gi, ' ')
      .replace(/<\/?(figure|figcaption|picture|source|video|iframe|noscript)[\s\S]*?>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')   // retire le reste des balises
      .replace(/\s{2,}/g, ' ')    // normalise les espaces
      .trim();

    if (s.length > max) {
      s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
    }
    return s;
  }

  // ========= Animations "reveal" =========
  private initReveal(): void {
    this.io?.disconnect();
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          this.io?.unobserve(e.target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll<HTMLElement>('.reveal')
      .forEach(el => this.io?.observe(el));
  }

  // ========= Vidéo autoplay =========
  private tryAutoplay(): void {
    const v = this.heroVideo?.nativeElement;
    if (!v) return;
    try {
      v.muted = true;
      (v as any).playsInline = true;
      const p = v.play();
      if (p && typeof (p as any).then === 'function') {
        (p as Promise<void>).then(() => this.videoOk = true)
                            .catch(() => this.videoOk = false);
      } else {
        this.videoOk = true;
      }
    } catch {
      this.videoOk = false;
    }
  }
  onVideoError(_e: Event): void { this.videoOk = false; }
}
