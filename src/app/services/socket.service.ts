import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private authErrorSubject = new Subject<any>();
  public authError$ = this.authErrorSubject.asObservable();
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Check if it's an authentication error (likely expired token)
      if (
        error.message?.includes('authentication') ||
        error.message?.includes('token') ||
        error.message?.includes('jwt') ||
        error.message?.includes('expired') ||
        error.message?.includes('unauthorized')
      ) {
        console.warn('Socket authentication failed - token may be expired');
        // Emit auth error via Subject
        this.authErrorSubject.next({ error: error.message });
      }
    });
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // Check if disconnection is due to authentication issues
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.warn('Socket disconnected by server - possible auth issue');
        this.authErrorSubject.next({ error: 'Disconnected by server' });
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }
  on(event: string): Observable<any> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on(event, (data: any) => observer.next(data));
      }

      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Method to reconnect with a new token
  reconnect(token: string): void {
    this.disconnect();
    this.connect(token);
  }

  // Get connection state info
  getConnectionState(): { connected: boolean; socketId?: string } {
    return {
      connected: this.socket?.connected || false,
      socketId: this.socket?.id,
    };
  }
}
