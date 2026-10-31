import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ⛔️ Ne JAMAIS ajouter d'Authorization pour les actus (route publique)
    const isNews =
      req.url.startsWith('http://localhost:8081/api/news') || // URL absolue
      req.url.startsWith('/api/news');                         // via proxy éventuel

    if (isNews) {
      const clean = req.clone({
        headers: req.headers.delete('Authorization'),
        // (optionnel) s'assurer qu'on n'envoie pas de cookies
        withCredentials: false
      });
      return next.handle(clean);
    }

    // ---- ton code original, inchangé pour le reste ----
    const raw = localStorage.getItem('token');
    if (!raw) return next.handle(req);

    const token = raw.replace(/^Bearer\s+/i, '');
    if (req.headers.has('Authorization')) return next.handle(req);

    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next.handle(cloned);
  }
}
