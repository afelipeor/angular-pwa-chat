import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { Chat } from '../../models/chat.model';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { MessagesService } from '../../services/messages.service';
import { SocketService } from '../../services/socket.service';
import { AutoResponseToggleComponent } from '../auto-response-toggle/auto-response-toggle.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AutoResponseToggleComponent,
  ],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  chatId: string = '';
  chat: Chat | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  currentUser$: Observable<User | null>;
  typingUsers: string[] = [];
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly chatsService = inject(ChatService);
  readonly messagesService = inject(MessagesService);
  readonly authService = inject(AuthService);
  readonly socketService = inject(SocketService);

  constructor() {
    this.currentUser$ = of(this.authService.getCurrentUser());
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.chatId = params['id'];
      if (this.chatId) {
        this.loadChat();
        this.loadMessages();
        this.setupSocketListeners();
        this.joinChat();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chatId) {
      this.leaveChat();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private setupSocketListeners(): void {
    this.socketService
      .on('newMessage')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        if (message.chatId === this.chatId) {
          this.messages.push(message);
        }
      });

    this.socketService
      .on('userTyping')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data.isTyping && !this.typingUsers.includes(data.userName)) {
          this.typingUsers.push(data.userName);
        } else {
          this.typingUsers = this.typingUsers.filter(
            (user) => user !== data.userName
          );
        }
      });
  }

  private joinChat(): void {
    this.socketService.emit('joinChat', { chatId: this.chatId });
  }

  private leaveChat(): void {
    this.socketService.emit('leaveChat', { chatId: this.chatId });
  }

  private loadChat(): void {
    this.isLoading = true;
    this.chatsService
      .getChat(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chat: Chat) => {
          this.chat = chat;
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error loading chat:', error);
          this.isLoading = false;
          this.router.navigate(['/']);
        },
      });
  }

  private loadMessages(): void {
    this.messagesService
      .getMessages(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Adjust according to actual response structure, e.g., response.messages
          this.messages = (response.messages ?? []).reverse(); // Reverse to show oldest first
        },
        error: (error: Error) => {
          console.error('Error loading messages:', error);
        },
      });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageData = {
        chatId: this.chatId,
        content: this.newMessage.trim(),
        type: 'text',
      };

      this.socketService.emit('sendMessage', messageData);
      this.newMessage = '';
    }
  }

  // Formats a timestamp (number or string) to a human-readable time string
  getMessageTime(timestamp: number | string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onTyping(): void {
    this.socketService.emit('typing', { chatId: this.chatId, isTyping: true });

    // Stop typing after 1 second of no input
    setTimeout(() => {
      this.socketService.emit('typing', {
        chatId: this.chatId,
        isTyping: false,
      });
    }, 1000);
  }

  isOwnMessage(message: Message): boolean {
    return (
      this.authService.getCurrentUserId() ===
      ((message.sender as any)._id || message.sender)
    );
  }

  formatTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getChatInitials(): string {
    return (
      this.chat?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || ''
    );
  }

  get chatName(): string {
    return this.chat?.name || '';
  }

  get isGroup(): boolean {
    return this.chat?.isGroup || false;
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1)
      return `${this.typingUsers[0]} is typing...`;
    return `${this.typingUsers.join(', ')} are typing...`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
