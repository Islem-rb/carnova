try { const t=localStorage.getItem('carnova-theme'); document.documentElement.dataset.theme=t || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); } catch {}

if (location.pathname === '/' || location.pathname === '/Home') {
  const hero = document.createElement('link');
  hero.rel = 'preload'; hero.as = 'image'; hero.href = '/assets/market/hero.webp'; hero.fetchPriority = 'high';
  hero.setAttribute('imagesrcset', '/assets/market/hero-640.webp 640w, /assets/market/hero-960.webp 960w, /assets/market/hero.webp 1363w');
  hero.setAttribute('imagesizes', '(max-width: 760px) 100vw, 700px');
  document.head.appendChild(hero);
}
