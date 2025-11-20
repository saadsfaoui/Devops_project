import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export type FlashType = 'success' | 'error' | '';

@Injectable({ providedIn: 'root' })
export class FlashService {
  message = signal('');
  type = signal<FlashType>('');

  show(msg: string, type: FlashType = 'success', duration = 3000) {
    this.message.set(msg);
    this.type.set(type);
    if (duration > 0) {
      setTimeout(() => this.clear(), duration);
    }
  }

  clear() {
    this.message.set('');
    this.type.set('');
  }
}
