import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Chat, Message, User } from '../models';
import { AuthService } from './auth.service';
import { PushNotificationService } from './push-notification.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  public chats$ = this.chatsSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private selectedChatSubject = new BehaviorSubject<Chat | null>(null);
  public selectedChat$ = this.selectedChatSubject.asObservable();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private pushService = inject(PushNotificationService);
  constructor() {
    // Don't automatically load chats - wait for explicit call
  }
  private loadChats(): void {
    const token = this.authService.getToken();
    const user = this.authService.getCurrentUser();

    if (token && user && this.authService.isAuthenticated()) {
      this.http.get<Chat[]>(`${environment.apiUrl}/chats`).subscribe({
        next: (chats) => {
          this.chatsSubject.next(chats);
        },
        error: (error) => {
          console.error('Error loading chats:', error);
          this.chatsSubject.next([]);
          // AuthInterceptor will handle 401 errors by logging out
        },
      });
    } else {
      console.log('User not authenticated, cannot load chats');
      this.chatsSubject.next([]);
    }
  }

  // Public method to reload chats (can be called after authentication)
  public reloadChats(): void {
    this.loadChats();
  }

  // Public method to clear chats (called on logout)
  public clearChats(): void {
    this.chatsSubject.next([]);
    this.messagesSubject.next([]);
    this.selectedChatSubject.next(null);
  }

  selectChat(chat: Chat): void {
    this.selectedChatSubject.next(chat);
    this.loadMessages(chat._id);
    this.markAsRead(chat._id);
  }
  getChat(chatId: string): Observable<Chat> {
    return this.http.get<Chat>(`${environment.apiUrl}/chats/${chatId}`);
  }

  createNewChat(participants: User[], name?: string): Chat {
    const newChat: Chat = {
      _id: Date.now().toString(),
      name: name || participants.map((p) => p.name).join(', '),
      participants: [...participants, this.authService.getCurrentUser()!],
      unreadCount: 0,
      isGroup: participants.length > 1,
    };

    const currentChats = this.chatsSubject.value;
    this.chatsSubject.next([newChat, ...currentChats]);
    return newChat;
  }

  sendMessage(content: string, chatId: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const message: Message = {
      _id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: currentUser,
      chatId,
      type: 'text',
      status: 'sending',
      readBy: [],
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);

    // Update last message in chat
    const chats = this.chatsSubject.value;
    const updatedChats = chats.map((chat) =>
      chat._id === chatId ? { ...chat, lastMessage: message } : chat
    );
    this.chatsSubject.next(updatedChats);
  }

  private loadMessages(chatId: string): void {
    // Mock messages
    const mockMessages: Message[] = [
      {
        _id: '1',
        content: 'Hello there!',
        timestamp: new Date(Date.now() - 600000),
        sender: {
          _id: '2',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          status: 'online',
        },
        chatId,
        type: 'text',
        status: 'read',
        readBy: [],
      },
      {
        _id: '2',
        content: 'Hi Alice! How are you?',
        timestamp: new Date(Date.now() - 500000),
        sender: this.authService.getCurrentUser()!,
        chatId,
        type: 'text',
        status: 'read',
        readBy: [],
      },
    ];
    this.messagesSubject.next(mockMessages);
  }

  private markAsRead(chatId: string): void {
    const chats = this.chatsSubject.value;
    const updatedChats = chats.map((chat) =>
      chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    this.chatsSubject.next(updatedChats);
  }
}
