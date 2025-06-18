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
import { MessagesResponse } from '../../models';
import { Chat } from '../../models/chat.model';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import {
  CreateMessageDto,
  MessagesService,
} from '../../services/messages.service';
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
  @ViewChild(AutoResponseToggleComponent)
  autoResponseToggle!: AutoResponseToggleComponent;

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

  private readonly systemUser: User = {
    _id: 'system',
    name: 'System',
    email: 'system@app.com',
  };

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

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.chatId) {
      this.leaveChat();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  get chatName(): string {
    return this.chat?.name || '';
  }

  get isGroup(): boolean {
    return this.chat?.isGroup || false;
  }
  sendMessage(): void {
    if (this.newMessage.trim()) {
      const messageData: CreateMessageDto = {
        chatId: this.chatId,
        content: this.newMessage.trim(),
        type: 'text',
      };

      this.messagesService
        .sendMessage(messageData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (message) => {
            console.log('Message sent successfully:', message);

            // Check if auto-response is enabled and trigger system message after delay
            if (
              this.autoResponseToggle &&
              this.autoResponseToggle.autoResponseEnabled
            ) {
              const delayMs = this.autoResponseToggle.delaySeconds * 1000;
              console.log(
                `Auto-response enabled, sending system message after ${this.autoResponseToggle.delaySeconds} seconds`
              );

              setTimeout(() => {
                this.systemMessage();
              }, delayMs);
            }
          },
          error: (error) => {
            console.error('Error sending message:', error);
          },
        });

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
      this.authService.getCurrentUser()?._id ===
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
        next: (response: MessagesResponse | Message[]) => {
          // Handle both array response and MessagesResponse object
          let messages: Message[] = [];

          if (Array.isArray(response)) {
            messages = response;
          } else if (
            response &&
            Array.isArray((response as MessagesResponse).messages)
          ) {
            messages = (response as MessagesResponse).messages;
          }

          this.messages = messages; // Show messages in the order received (oldest first)
        },
        error: (error: any) => {
          console.error('Error loading messages:', error);
          // Handle specific error cases
          if (error?.message && error.message.includes('Unauthorized')) {
            this.router.navigate(['/login']);
          }
        },
      });
  }

  private systemMessage(): void {
    const message: CreateMessageDto = {
      content: 'This is a system message.',
      chatId: this.chatId,
      type: 'text',
    };

    this.socketService.emit('newMessage', message);
    this.messagesService
      .sendMessage(message)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          console.log('Message sent successfully:', message);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        },
      });
  }
}
