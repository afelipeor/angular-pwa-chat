import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Chat, User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { HeaderMenuComponent } from '../header-menu/header-menu.component';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, RouterModule, HeaderMenuComponent],
  standalone: true,
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats$: Observable<Chat[]>;
  currentUser$: Observable<User | null>;
  private authSubscription: Subscription | null = null;

  chatService = inject(ChatService);
  authService = inject(AuthService);

  constructor() {
    this.chats$ = this.chatService.chats$;
    this.currentUser$ = this.authService.currentUser$;
  }
  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      if (user && this.authService.isAuthenticated()) {
        // User is authenticated, load chats
        this.chatService.reloadChats();
      } else {
        // User is not authenticated, clear chats
        // Don't call logout here as it can cause infinite loops
        // The AuthInterceptor handles 401 errors and the AuthGuard handles redirects
        this.chatService.clearChats();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  openChat(chat: Chat): void {
    this.chatService.selectChat(chat);
    // Navigation will be handled by routerLink in template
  }

  getLastMessageTime(timestamp: Date | undefined): string {
    if (!timestamp) {
      return '';
    }

    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'now';
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    if (hours < 24) {
      return `${hours}h`;
    }
    return `${days}d`;
  }

  getAvatarInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return '#4caf50';
      case 'away':
        return '#ff9800';
      case 'offline':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }
}
