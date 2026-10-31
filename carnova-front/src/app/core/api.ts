import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  get<T>(path: string, params: Record<string, string | number | boolean> = {}) {
    return this.http.get<T>('/api' + path, { params });
  }
  post<T>(path: string, body: unknown) {
    return this.http.post<T>('/api' + path, body);
  }
  put<T>(path: string, body: unknown) {
    return this.http.put<T>('/api' + path, body);
  }
  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>('/api' + path, body);
  }
  delete<T>(path: string) {
    return this.http.delete<T>('/api' + path);
  }
}
