import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private base = 'http://localhost:8081/api/news';

  constructor(private http: HttpClient) {}

  list(sinceHours = 72, limit = 50): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.base}?sinceHours=${sinceHours}&limit=${limit}`);
  }

  refresh(): Observable<{status: string; inserted: number}> {
    return this.http.post<{status: string; inserted: number}>(`${this.base}/refresh`, {});
  }
}
