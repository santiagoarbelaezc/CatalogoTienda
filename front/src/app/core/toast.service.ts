import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  toasts$ = this._toasts$.asObservable();
  private nextId = 1;

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    const current = this._toasts$.value;
    this._toasts$.next([...current, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  success(message: string, duration = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3500): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: number): void {
    const current = this._toasts$.value;
    this._toasts$.next(current.filter(t => t.id !== id));
  }
}
