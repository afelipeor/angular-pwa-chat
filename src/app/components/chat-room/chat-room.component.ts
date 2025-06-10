import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { ChatService, Message } from '../../services/chat.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages$: Observable<Message[]>;
  currentUser$: Observable<User | null>;
  newMessage = '';
  chatId: string = '';
  chatName = '';
  isGroup = false;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.messages$ = this.chatService.messages$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.chatId = params['id'];
      this.loadChatDetails();
    });

    this.messages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.shouldScrollToBottom = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChatDetails(): void {
    this.chatService.chats$
      .pipe(takeUntil(this.destroy$))
      .subscribe((chats) => {
        const chat = chats.find((c) => c.id === this.chatId);
        if (chat) {
          this.chatName = chat.name;
          this.isGroup = chat.isGroup;
        }
      });
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage.trim(), this.chatId);
      this.newMessage = '';
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  isOwnMessage(message: Message): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === message.sender.id;
  }

  getMessageTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
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
