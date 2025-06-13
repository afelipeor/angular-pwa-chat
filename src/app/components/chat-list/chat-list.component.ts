import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
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
export class ChatListComponent implements OnInit {
  chats$: Observable<Chat[]>;
  currentUser$: Observable<User | null>;

  chatService = inject(ChatService);
  authService = inject(AuthService);

  constructor() {
    this.chats$ = this.chatService.chats$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Initialize mock user for demo
    const mockUser: User = {
      _id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'online',
    };
    this.authService.login(mockUser);
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
