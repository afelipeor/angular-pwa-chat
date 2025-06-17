import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Message, MessageType, User } from '../models';
import { MessagesResponse } from '../models/messages-response.model';
import { AuthService } from './auth.service';

export interface CreateMessageDto {
  chatId: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  replyToId?: string;
  attachments?: File[];
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
  userId?: string;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface MessageSearchResult {
  messages: Message[];
  totalCount: number;
  highlights: { [messageId: string]: string[] };
}

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private socket: Socket | null = null;
  private readonly apiUrl = `${environment.apiUrl}/messages`;

  // Message streams
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private newMessageSubject = new Subject<Message>();
  private messageStatusSubject = new Subject<MessageStatus>();
  private typingStatusSubject = new Subject<TypingStatus>();
  private messageDeletedSubject = new Subject<string>();
  private messageUpdatedSubject = new Subject<Message>();

  // State management
  private messageCache = new Map<string, Message[]>();
  private pendingMessages = new Map<string, Message>();
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  // Observables
  public messages$ = this.messagesSubject.asObservable();
  public newMessage$ = this.newMessageSubject.asObservable();
  public messageStatus$ = this.messageStatusSubject.asObservable();
  public typingStatus$ = this.typingStatusSubject.asObservable();
  public messageDeleted$ = this.messageDeletedSubject.asObservable();
  public messageUpdated$ = this.messageUpdatedSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.initializeSocketConnection();
  }

  private initializeSocketConnection(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (user && !this.socket) {
        const token = this.authService.getToken();
        if (token) {
          this.socket = io(environment.socketUrl || 'http://localhost:3001', {
            auth: {
              token: token,
            },
            transports: ['websocket'],
          });

          this.setupSocketListeners();
        }
      } else if (!user && this.socket) {
        this.disconnectSocket();
      }
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to message socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from message socket');
    });

    this.socket.on('newMessage', (message: Message) => {
      this.handleNewMessage(message);
    });

    this.socket.on('messageStatus', (status: MessageStatus) => {
      this.handleMessageStatus(status);
    });

    this.socket.on('userTyping', (data: TypingStatus) => {
      this.handleTypingStatus(data);
    });

    this.socket.on('messageDeleted', (messageId: string) => {
      this.handleMessageDeleted(messageId);
    });

    this.socket.on('messageUpdated', (message: Message) => {
      this.handleMessageUpdated(message);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      // If it's an authentication error, clear token and redirect to login
      if (
        error.message?.includes('authentication') ||
        error.message?.includes('token')
      ) {
        console.warn(
          'WebSocket authentication failed, clearing tokens and redirecting to login'
        );
        this.authService.logout();
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  // Public Methods - All HTTP requests will now use the interceptor

  /**
   * Get messages for a specific chat
   */
  getMessages(
    chatId: string,
    limit: number = 50,
    cursor?: string
  ): Observable<MessagesResponse | Message[]> {
    // Authentication is now handled by the interceptor
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<MessagesResponse | Message[]>(`${this.apiUrl}/chat/${chatId}`, {
        params,
      })
      .pipe(
        tap((response) => {
          let messages: Message[] = [];

          if (Array.isArray(response)) {
            messages = response;
          } else if (response && (response as MessagesResponse).messages) {
            messages = (response as MessagesResponse).messages;
          }

          // Update cache
          const existingMessages = this.messageCache.get(chatId) || [];
          const allMessages = cursor
            ? [...existingMessages, ...messages]
            : messages;
          this.messageCache.set(chatId, allMessages);
          this.messagesSubject.next(allMessages);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send a new message
   */
  sendMessage(messageData: CreateMessageDto): Observable<Message> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    // Create optimistic message
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const currentUser = this.authService.getCurrentUser();

    const optimisticMessage: Message = {
      _id: tempId,
      chatId: messageData.chatId,
      content: messageData.content,
      type: (messageData.type as MessageType) || 'text',
      sender: currentUser || ({} as User),
      timestamp: new Date(),
      status: 'sending',
      readBy: [],
      attachments: [],
    };

    // Add to pending messages
    this.pendingMessages.set(tempId, optimisticMessage);

    // Add to cache optimistically
    const chatMessages = this.messageCache.get(messageData.chatId) || [];
    chatMessages.push(optimisticMessage);
    this.messageCache.set(messageData.chatId, chatMessages);
    this.messagesSubject.next(chatMessages); // Prepare request data - use FormData only if there are file attachments
    let requestBody: FormData | any;
    let hasAttachments =
      messageData.attachments && messageData.attachments.length > 0;

    if (hasAttachments) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('chatId', messageData.chatId);
      formData.append('content', messageData.content);
      formData.append('type', messageData.type || 'text');

      if (messageData.replyToId) {
        formData.append('replyToId', messageData.replyToId);
      }

      messageData.attachments!.forEach((file) => {
        formData.append('attachments', file);
      });

      requestBody = formData;
    } else {
      // Use JSON for text messages
      requestBody = {
        chatId: messageData.chatId,
        content: messageData.content,
        type: messageData.type || 'text',
      };

      if (messageData.replyToId) {
        requestBody.replyToId = messageData.replyToId;
      }
    }

    return this.http.post<Message>(this.apiUrl, requestBody).pipe(
      tap((message) => {
        // Replace optimistic message with real message
        const messages = this.messageCache.get(messageData.chatId) || [];
        const index = messages.findIndex((m) => m._id === tempId);
        if (index !== -1) {
          messages[index] = message;
          this.messageCache.set(messageData.chatId, messages);
          this.messagesSubject.next(messages);
        }
        this.pendingMessages.delete(tempId);
      }),
      catchError((error) => {
        // Remove optimistic message on error
        const messages = this.messageCache.get(messageData.chatId) || [];
        const filteredMessages = messages.filter((m) => m._id !== tempId);
        this.messageCache.set(messageData.chatId, filteredMessages);
        this.messagesSubject.next(filteredMessages);
        this.pendingMessages.delete(tempId);
        return this.handleError(error);
      }),
      retry(1)
    );
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.http
      .delete<void>(`${this.apiUrl}/${messageId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Edit a message
   */
  editMessage(messageId: string, content: string): Observable<Message> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.http
      .patch<Message>(`${this.apiUrl}/${messageId}`, { content })
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.http
      .post<void>(`${this.apiUrl}/${messageId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark all messages in chat as read
   */
  markChatAsRead(chatId: string): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    return this.http
      .post<void>(`${this.apiUrl}/chat/${chatId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Search messages
   */
  searchMessages(
    query: string,
    chatId?: string,
    limit: number = 20
  ): Observable<MessageSearchResult> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Authentication required'));
    }

    let params = new HttpParams()
      .set('query', query)
      .set('limit', limit.toString());

    if (chatId) {
      params = params.set('chatId', chatId);
    }

    return this.http
      .get<MessageSearchResult>(`${this.apiUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping: true });

      const existingTimeout = this.typingTimeouts.get(chatId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        this.sendStopTyping(chatId);
      }, 3000);

      this.typingTimeouts.set(chatId, timeout);
    }
  }

  /**
   * Stop typing indicator
   */
  sendStopTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping: false });

      const timeout = this.typingTimeouts.get(chatId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(chatId);
      }
    }
  }

  /**
   * Join chat room for real-time updates
   */
  joinChatRoom(chatId: string): void {
    if (this.socket) {
      this.socket.emit('joinChat', chatId);
    }
  }

  /**
   * Leave chat room
   */
  leaveChatRoom(chatId: string): void {
    if (this.socket) {
      this.socket.emit('leaveChat', chatId);
    }
  }

  /**
   * Get cached messages for a chat
   */
  getCachedMessages(chatId: string): Message[] {
    return this.messageCache.get(chatId) || [];
  }

  /**
   * Clear message cache
   */
  clearCache(chatId?: string): void {
    if (chatId) {
      this.messageCache.delete(chatId);
    } else {
      this.messageCache.clear();
    }
  }

  /**
   * Get pending messages
   */
  getPendingMessages(): Message[] {
    return Array.from(this.pendingMessages.values());
  }

  /**
   * Retry failed messages
   */
  retryFailedMessages(): void {
    const pendingMessages = Array.from(this.pendingMessages.values());
    pendingMessages.forEach((message) => {
      if (message.status === 'failed') {
        const messageData: CreateMessageDto = {
          chatId: message.chatId,
          content: message.content,
          type: message.type,
          replyToId: message.replyTo,
        };
        this.sendMessage(messageData).subscribe();
      }
    });
  }

  /**
   * Disconnect socket
   */
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear typing timeouts
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  // Private message handlers
  private handleNewMessage(message: Message): void {
    // Update cache
    const chatMessages = this.messageCache.get(message.chatId) || [];
    chatMessages.push(message);
    this.messageCache.set(message.chatId, chatMessages);

    // Remove from pending if it exists
    this.pendingMessages.delete(message._id);

    // Emit to subscribers
    this.newMessageSubject.next(message);
    this.messagesSubject.next(chatMessages);
  }

  private handleMessageStatus(status: MessageStatus): void {
    // Update message in cache
    const allMessages = Array.from(this.messageCache.values()).flat();
    const message = allMessages.find((m) => m._id === status.messageId);

    if (message) {
      message.status = status.status as any;
      if (status.status === 'read' && status.userId) {
        const user = this.authService.getCurrentUser();
        if (user && user._id === status.userId) {
          message.readBy = message.readBy || [];
          const alreadyRead = message.readBy.find(
            (u) => u._id === status.userId
          );
          if (!alreadyRead && user) {
            message.readBy.push(user);
          }
        }
      }
    }

    this.messageStatusSubject.next(status);
  }

  private handleTypingStatus(data: TypingStatus): void {
    this.typingStatusSubject.next(data);
  }

  private handleMessageDeleted(messageId: string): void {
    // Remove from all caches
    for (const [chatId, messages] of this.messageCache.entries()) {
      const filteredMessages = messages.filter((m) => m._id !== messageId);
      if (filteredMessages.length !== messages.length) {
        this.messageCache.set(chatId, filteredMessages);
        this.messagesSubject.next(filteredMessages);
      }
    }

    this.messageDeletedSubject.next(messageId);
  }

  private handleMessageUpdated(message: Message): void {
    // Update in cache
    const chatMessages = this.messageCache.get(message.chatId) || [];
    const index = chatMessages.findIndex((m) => m._id === message._id);

    if (index !== -1) {
      chatMessages[index] = message;
      this.messageCache.set(message.chatId, chatMessages);
      this.messagesSubject.next(chatMessages);
    }

    this.messageUpdatedSubject.next(message);
  }

  private handleError = (error: any): Observable<never> => {
    console.error('MessagesService error:', error);

    let errorMessage = 'An error occurred';

    if (error.status === 401) {
      errorMessage = 'Authentication failed';
    } else if (error.status === 403) {
      errorMessage = 'Access denied';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found';
    } else if (error.status === 500) {
      errorMessage = 'Server error - Please try again later';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };

  ngOnDestroy(): void {
    this.disconnectSocket();
  }
}
