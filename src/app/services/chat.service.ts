import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
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
    this.initializeMockChats();
  }

  private initializeMockChats(): void {
    const mockChats: Chat[] = [
      {
        _id: '1',
        name: 'Alice Johnson',
        participants: [
          {
            _id: '2',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            status: 'online',
          },
          this.authService.getCurrentUser()!,
        ],
        unreadCount: 2,
        isGroup: false,
        lastMessage: {
          _id: '1',
          content: 'Hey! How are you doing?',
          timestamp: new Date(Date.now() - 300000),
          sender: {
            _id: '2',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            status: 'online',
          },
          chatId: '1',
          type: 'text',
          status: 'sent',
          readBy: [],
        },
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 600000),
      },
      {
        _id: '2',
        name: 'Team Discussion',
        participants: [
          {
            _id: '3',
            name: 'Bob Smith',
            email: 'bob@example.com',
            status: 'away',
          },
          {
            _id: '4',
            name: 'Carol Davis',
            email: 'carol@example.com',
            status: 'online',
          },
          this.authService.getCurrentUser()!,
        ],
        unreadCount: 0,
        isGroup: true,
        lastMessage: {
          _id: '2',
          content: 'Great job on the project!',
          timestamp: new Date(Date.now() - 3600000),
          sender: {
            _id: '3',
            name: 'Bob Smith',
            email: 'bob@example.com',
            status: 'away',
          },
          chatId: '2',
          status: 'read',
          type: 'text',
          readBy: [],
        },
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 600000),
      },
    ];
    this.chatsSubject.next(mockChats);
  }

  selectChat(chat: Chat): void {
    this.selectedChatSubject.next(chat);
    this.loadMessages(chat._id);
    this.markAsRead(chat._id);
  }

  getChat(chatId: string): Observable<Chat> {
    // Replace this mock with actual HTTP call or logic as needed
    return of({ _id: chatId, name: 'Sample Chat', isGroup: false } as Chat);
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
