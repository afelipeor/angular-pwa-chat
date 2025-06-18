import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, Subject, take, takeUntil } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.currentUser$ = of(this.authService.getCurrentUser());
  }
  ngOnInit(): void {
    // Request notification permission on component init
    this.pushNotificationService.requestNotificationPermission();

    // Debug: Check user authentication state immediately
    console.log('🔐 ChatRoom init - checking auth state...');
    const currentUser = this.authService.getCurrentUser();
    console.log('🔐 Current user on init:', currentUser);

    // Also check observable
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      console.log('🔐 User from observable on init:', user);
    });

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

      // Debug: Check auth state right before sending
      const authCheck = this.authService.getCurrentUser();
      console.log('🔐 Auth state before sending:', authCheck);

      const messageData: CreateMessageDto = {
        chatId: this.chatId,
        content: this.newMessage.trim(),
        type: 'text',
      };

      console.log('📤 Message data:', messageData);

      // Store the message content to check ownership later
      const messageContent = this.newMessage.trim();

      this.messagesService
        .sendMessage(messageData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (message) => {
            console.log('✅ Message sent successfully:', message);
            console.log(
              '🔍 Checking if this is our message:',
              messageContent,
              'vs',
              message.content
            );
            console.log('🔍 Message sender:', message.sender);

            // For debugging, let's always add the message and let the template handle ownership
            const existingMessage = this.messages.find(
              (m) => m._id === message._id
            );
            if (!existingMessage) {
              console.log('➕ Adding sent message to local array');
              this.messages.push(message);
              this.cdr.markForCheck();
              setTimeout(() => this.scrollToBottom(), 100);

              // Test ownership immediately
              const ownership = this.isOwnMessage(message);
              console.log('🔍 Immediate ownership check result:', ownership);
            }
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
    // Get current user - try multiple methods
    let currentUser = this.authService.getCurrentUser();

    // If no user from service, try from localStorage directly
    if (!currentUser) {
      const storedUserStr =
        localStorage.getItem('current_user') ||
        sessionStorage.getItem('current_user');
      if (storedUserStr) {
        try {
          currentUser = JSON.parse(storedUserStr);
          console.log('🔍 Retrieved user from localStorage:', currentUser);
        } catch (e) {
          console.error('❌ Error parsing stored user:', e);
        }
      }
    }

    if (!currentUser) {
      console.log('❌ No current user found anywhere');
      return false;
    }

    // Get current user ID
    const currentUserId = currentUser._id || (currentUser as any).id;
    if (!currentUserId) {
      console.log('❌ Current user has no ID:', currentUser);
      return false;
    }

    // Get message sender ID
    let messageSenderId: string;

    if (typeof message.sender === 'string') {
      messageSenderId = message.sender;
    } else if (message.sender && typeof message.sender === 'object') {
      messageSenderId =
        (message.sender as any)._id || (message.sender as any).id;
    } else {
      console.log('❌ Invalid message sender:', message.sender);
      return false;
    }

    if (!messageSenderId) {
      console.log('❌ Message sender has no ID:', message.sender);
      return false;
    }

    const isOwn = currentUserId === messageSenderId;
    console.log('🔍 Message ownership:', {
      currentUserId,
      messageSenderId,
      content: message.content.substring(0, 20) + '...',
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
        console.log('🔍 Message sender via WebSocket:', message.sender);

        if (message.chatId === this.chatId) {
          // Check if message already exists to avoid duplicates
          const existingMessage = this.messages.find(
            (m) => m._id === message._id
          );
          if (!existingMessage) {
            this.messages.push(message);
            console.log('➕ Added new message via WebSocket');

            // Test ownership immediately for WebSocket messages
            const ownership = this.isOwnMessage(message);
            console.log('🔍 WebSocket message ownership:', ownership);
          } else {
            console.log('⏭️ Message already exists, skipping duplicate');
          }

          // Trigger change detection to update the view
          this.cdr.markForCheck();

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

          // Scroll to bottom after new message and change detection
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
        this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error loading chat:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
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
          console.log('📥 Loaded messages:', messages.length);
          this.cdr.markForCheck();
          // Scroll to bottom after loading messages
          setTimeout(() => this.scrollToBottom(), 100);
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

  /**
   * Check if this is the last message sent by this specific sender
   */
  isLastMessageBySender(message: Message, index: number): boolean {
    // Get sender ID
    const senderId =
      typeof message.sender === 'string' ? message.sender : message.sender._id;

    // Check if any subsequent message is from the same sender
    for (let i = index + 1; i < this.messages.length; i++) {
      const nextMessage = this.messages[i];
      const nextSenderId =
        typeof nextMessage.sender === 'string'
          ? nextMessage.sender
          : nextMessage.sender._id;

      if (nextSenderId === senderId) {
        return false; // Found a later message from same sender
      }
    }

    return true; // This is the last message from this sender
  }

  /**
   * Check if message has been read by other users (not including sender)
   */
  isMessageRead(message: Message): boolean {
    if (!message.readBy || message.readBy.length === 0) {
      return false;
    }

    // Get current user ID
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    const currentUserId = currentUser._id;

    // Check if anyone other than the sender has read it
    return message.readBy.some((reader) => {
      const readerId = typeof reader === 'string' ? reader : reader._id;
      return readerId !== currentUserId;
    });
  }

  /**
   * Get read status text for own messages
   */
  getReadStatusText(message: Message): string {
    if (!this.isOwnMessage(message)) {
      return ''; // Only show read status for own messages
    }

    switch (message.status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed';
      default:
        return this.isMessageRead(message) ? 'Read' : 'Sent';
    }
  }

  /**
   * Get read status icon for own messages
   */
  getReadStatusIcon(message: Message): string {
    if (!this.isOwnMessage(message)) {
      return ''; // Only show read status for own messages
    }

    switch (message.status) {
      case 'sending':
        return 'schedule';
      case 'sent':
        return 'done';
      case 'delivered':
        return 'done_all';
      case 'read':
        return 'done_all';
      case 'failed':
        return 'error';
      default:
        return this.isMessageRead(message) ? 'done_all' : 'done';
    }
  }

  /**
   * Mark messages as read when user views the chat
   */
  private markMessagesAsRead(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const unreadMessages = this.messages.filter((message) => {
      // Don't mark own messages as read
      if (this.isOwnMessage(message)) return false;

      // Check if current user hasn't read this message yet
      return !message.readBy.some((reader) => {
        const readerId = typeof reader === 'string' ? reader : reader._id;
        return readerId === currentUser._id;
      });
    });

    if (unreadMessages.length > 0) {
      console.log(`📖 Marking ${unreadMessages.length} messages as read`);
      // Call backend to mark messages as read
      unreadMessages.forEach((message) => {
        this.messagesService.markAsRead(message._id).subscribe({
          next: () => {
            // Add current user to readBy array locally
            if (
              !message.readBy.some((reader) => {
                const readerId =
                  typeof reader === 'string' ? reader : reader._id;
                return readerId === currentUser._id;
              })
            ) {
              message.readBy.push(currentUser);
              this.cdr.markForCheck();
            }
          },
          error: (error: any) => {
            console.error('Error marking message as read:', error);
          },
        });
      });
    }
  }
}
