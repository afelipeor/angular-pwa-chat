import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  Message,
  MessageSearchResult,
  MessagesResponse,
  MessageStatus,
  MessageType,
  MessageTypeEnum,
  TypingStatus,
  User,
} from '../models';
import { AuthService } from './auth.service';

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

  // Public Methods

  /**
   * Get messages for a specific chat
   */
  getMessages(
    chatId: string,
    limit: number = 50,
    cursor?: string
  ): Observable<MessagesResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http
      .get<MessagesResponse>(`${this.apiUrl}/chat/${chatId}`, { params })
      .pipe(
        tap((response) => {
          // Update cache
          const existingMessages = this.messageCache.get(chatId) || [];
          const allMessages = cursor
            ? [...existingMessages, ...response.messages]
            : response.messages;
          this.messageCache.set(chatId, allMessages);
          this.messagesSubject.next(allMessages);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send a new message
   */
  sendMessage(messageData: Message): Observable<Message> {
    // Create optimistic message
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      chatId: messageData.chatId,
      content: messageData.content,
      type: (messageData.type as MessageType) || MessageTypeEnum.text,
      sender: {} as User, // Will be set by current user
      timestamp: new Date(),
      status: 'sending',
      readBy: [],
      replyTo: undefined,
      attachments: [],
    };

    // Add to pending messages
    this.pendingMessages.set(tempId, optimisticMessage);

    // Add to cache optimistically
    const chatMessages = this.messageCache.get(messageData.chatId) || [];
    chatMessages.push(optimisticMessage);
    this.messageCache.set(messageData.chatId, chatMessages);
    this.messagesSubject.next(chatMessages);

    // Prepare form data for file uploads
    const formData = new FormData();
    formData.append('chatId', messageData.chatId);
    formData.append('content', messageData.content);
    formData.append('type', messageData.type || 'text');
    formData.append('tempId', tempId);

    if (messageData.replyTo) {
      formData.append('replyToId', messageData.replyTo);
    }

    if (messageData.attachments) {
      messageData.attachments.forEach((attachment, index) => {
        // If attachment is a File or Blob, append directly
        if (attachment instanceof File || attachment instanceof Blob) {
          formData.append('attachments', attachment);
        }
        // Otherwise, skip or handle error as needed
      });
    }

    return this.http.post<Message>(this.apiUrl, formData).pipe(
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
      retry(2)
    );
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${messageId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Edit a message
   */
  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http
      .patch<Message>(`${this.apiUrl}/${messageId}`, { content })
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/${messageId}/read`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark all messages in chat as read
   */
  markChatAsRead(chatId: string): Observable<void> {
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

      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(chatId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to stop typing
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
        this.sendMessage({
          _id: message._id || '', // Provide a fallback if missing
          chatId: message.chatId,
          content: message.content,
          type: message.type,
          sender: message.sender || ({} as User),
          timestamp: message.timestamp || new Date(),
          status: 'sending',
          readBy: message.readBy || [],
          replyTo: message.replyTo,
          attachments: message.attachments || [],
        }).subscribe();
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

  private handleError(error: any): Observable<never> {
    console.error('MessagesService error:', error);

    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  private initializeSocketConnection(): void {
    const user = this.authService.getCurrentUser();

    if (user && !this.socket) {
      this.socket = io(environment.socketUrl, {
        auth: {
          token: this.authService.getToken(),
        },
        transports: ['websocket'],
      });

      this.setupSocketListeners();
    } else if (!user && this.socket) {
      this.disconnectSocket();
    }
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

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

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
    const message = allMessages.find((m) => m._id === status);
    const user = this.authService.getCurrentUser();

    if (message && user) {
      message.status = status;
      message.readBy = message.readBy || [];

      if (status === 'read') {
        const readByUser = message.readBy.find((r) => r._id === user?._id);
        if (!readByUser) {
          message.readBy.push(user);
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

  ngOnDestroy(): void {
    this.disconnectSocket();
  }
}
