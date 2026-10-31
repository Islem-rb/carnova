try { const t=localStorage.getItem('carnova-theme'); document.documentElement.dataset.theme=t || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); } catch {}
