import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8081/api/payments';

  constructor(private http: HttpClient) {}

 createPaymentIntent(amount: number): Observable<{ clientSecret: string }> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/create-payment-intent`, { amount }, { headers });
}
 confirmPayment(paymentIntentId: string): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.post(`${this.apiUrl}/confirm`, { paymentIntentId }, { headers });
}
}
