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
import { PushNotificationService } from '../../services/push-notification.service';
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
  isSocketConnected: boolean = false;

  private destroy$ = new Subject<void>();
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly chatsService = inject(ChatService);
  readonly messagesService = inject(MessagesService);
  readonly authService = inject(AuthService);
  readonly socketService = inject(SocketService);
  readonly pushNotificationService = inject(PushNotificationService);

  constructor() {
    this.currentUser$ = of(this.authService.getCurrentUser());
  }
  ngOnInit(): void {
    // Request notification permission on component init
    this.pushNotificationService.requestNotificationPermission();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.chatId = params['id'];
      if (this.chatId) {
        this.loadChat();
        this.loadMessages();
        this.setupSocketListeners();
        this.joinChat();
        this.checkSocketConnection();
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
      console.log('🚀 Sending message:', this.newMessage.trim());

      const messageData: CreateMessageDto = {
        chatId: this.chatId,
        content: this.newMessage.trim(),
        type: 'text',
      };

      console.log('📤 Message data:', messageData);

      this.messagesService
        .sendMessage(messageData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (message) => {
            console.log('✅ Message sent successfully:', message);
            // The backend will automatically handle auto-responses if enabled
            // No need to manually create system messages here
          },
          error: (error) => {
            console.error('❌ Error sending message:', error);
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
  isSystemMessage(message: Message): boolean {
    // System messages can be identified by sender email containing 'bot' or 'chatbot'
    // or by checking if the sender name is 'ChatBot'
    const senderEmail = (message.sender as any)?.email?.toLowerCase() || '';
    const senderName = (message.sender as any)?.name?.toLowerCase() || '';
    return (
      senderEmail.includes('bot') ||
      senderEmail.includes('chatbot') ||
      senderName.includes('bot') ||
      senderName.includes('chatbot') ||
      senderName === 'chatbot'
    );
  }
  isOwnMessage(message: Message): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser._id) {
      console.log('❌ No current user found or missing ID');
      return false;
    }

    const currentUserId = currentUser._id;

    // Handle different possible sender structures
    let messageSenderId: string;
    if (typeof message.sender === 'string') {
      messageSenderId = message.sender;
    } else if (message.sender && typeof message.sender === 'object') {
      messageSenderId = (message.sender as any)._id;
    } else {
      console.log('❌ Invalid sender structure:', message.sender);
      return false;
    }

    const isOwn = currentUserId === messageSenderId;
    console.log('🔍 Message ownership check:', {
      currentUserId,
      messageSenderId,
      messageContent: message.content.substring(0, 30) + '...',
      isOwn,
    });

    return isOwn;
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

  checkSocketConnection(): void {
    this.isSocketConnected = this.socketService.isConnected();

    // Set up periodic connection check
    setInterval(() => {
      this.isSocketConnected = this.socketService.isConnected();
    }, 5000); // Check every 5 seconds
  }

  reconnectSocket(): void {
    const token = this.authService.getToken();
    if (token && !this.authService.isTokenExpired()) {
      this.socketService.reconnect(token);
      this.joinChat(); // Rejoin the chat after reconnection
    } else {
      this.authService.handleExpiredToken();
    }
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
    console.log('🎧 Setting up socket listeners for chat:', this.chatId);

    this.socketService
      .on('newMessage')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        console.log('📨 Received new message via socket:', message);
        if (message.chatId === this.chatId) {
          this.messages.push(message);

          // Show push notification if message is not from current user
          const isOwnMessage = this.isOwnMessage(message);
          console.log('🔍 Is own message check:', isOwnMessage);

          if (!isOwnMessage) {
            const senderName = (message.sender as any)?.name || 'Someone';
            const notificationTitle = this.isGroup
              ? `${this.chatName}`
              : senderName;

            console.log(
              '🔔 Showing push notification for:',
              notificationTitle,
              message.content
            );
            this.pushNotificationService.showNotification(
              notificationTitle,
              message.content,
              { chatId: this.chatId, messageId: message._id }
            );
          } else {
            console.log('⏭️ Skipping notification for own message');
          }

          // Scroll to bottom after new message
          setTimeout(() => this.scrollToBottom(), 100);
        } else {
          console.log(
            '❓ Message not for this chat. Message chatId:',
            message.chatId,
            'Current chatId:',
            this.chatId
          );
        }
      });

    this.socketService
      .on('userTyping')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('⌨️ Typing event:', data);
        if (data.isTyping && !this.typingUsers.includes(data.userName)) {
          this.typingUsers.push(data.userName);
        } else {
          this.typingUsers = this.typingUsers.filter(
            (user) => user !== data.userName
          );
        }
      }); // Handle socket authentication errors (e.g., expired tokens)
    this.socketService.authError$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.error('🚨 Socket authentication error:', data);

        // Check if token is expired
        if (this.authService.isTokenExpired()) {
          this.authService.handleExpiredToken();
        } else {
          // Some other auth issue, try to verify token with server
          this.authService.verifyToken().subscribe({
            error: (error) => {
              console.error('Token verification failed:', error);
              this.authService.handleExpiredToken();
            },
          });
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
}
