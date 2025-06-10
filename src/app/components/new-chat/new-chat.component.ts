import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

interface Contact extends User {
  selected?: boolean;
}

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss'],
})
export class NewChatComponent implements OnInit {
  contacts: Contact[] = [];
  selectedContacts: Contact[] = [];
  searchTerm = '';
  groupName = '';
  showGroupNameInput = false;
  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadContacts();
  }

  private loadContacts(): void {
    this.contacts = [
      {
        id: '2',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        status: 'online',
        avatar: '',
      },
      {
        id: '3',
        name: 'Bob Smith',
        email: 'bob@example.com',
        status: 'away',
        avatar: '',
      },
      {
        id: '4',
        name: 'Carol Davis',
        email: 'carol@example.com',
        status: 'online',
        avatar: '',
      },
      {
        id: '5',
        name: 'David Wilson',
        email: 'david@example.com',
        status: 'offline',
        avatar: '',
      },
      {
        id: '6',
        name: 'Emma Brown',
        email: 'emma@example.com',
        status: 'online',
        avatar: '',
      },
      {
        id: '7',
        name: 'Frank Miller',
        email: 'frank@example.com',
        status: 'away',
        avatar: '',
      },
    ];
  }

  get filteredContacts(): Contact[] {
    if (!this.searchTerm) {
      return this.contacts;
    }

    return this.contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  toggleContactSelection(contact: Contact): void {
    const index = this.selectedContacts.findIndex((c) => c.id === contact.id);

    if (index > -1) {
      this.selectedContacts.splice(index, 1);
      contact.selected = false;
    } else {
      this.selectedContacts.push(contact);
      contact.selected = true;
    }

    this.showGroupNameInput = this.selectedContacts.length > 1;
  }

  removeSelectedContact(contact: Contact): void {
    const index = this.selectedContacts.findIndex((c) => c.id === contact.id);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
      contact.selected = false;
    }

    this.showGroupNameInput = this.selectedContacts.length > 1;
  }

  createChat(): void {
    if (this.selectedContacts.length === 0) {
      return;
    }

    const chatName =
      this.showGroupNameInput && this.groupName.trim()
        ? this.groupName.trim()
        : undefined;

    const newChat = this.chatService.createNewChat(
      this.selectedContacts,
      chatName
    );

    this.router.navigate(['/chat', newChat.id]);
  }

  goBack(): void {
    this.router.navigate(['/']);
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

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some((c) => c.id === contact.id);
  }

  trackByContactId(index: number, contact: Contact): string {
    return contact.id;
  }

  trackBySelectedContactId(index: number, contact: Contact): string {
    return contact.id;
  }
}
