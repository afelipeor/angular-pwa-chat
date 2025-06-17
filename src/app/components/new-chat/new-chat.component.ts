import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { Contact, User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewChatComponent implements OnInit {
  contacts: Contact[] = [];
  selectedContacts: Contact[] = [];
  searchTerm = '';
  groupName = '';
  showGroupNameInput = false;
  currentUser$: Observable<User | null>;
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  // Getters
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

  // Lifecycle methods
  ngOnInit(): void {
    this.loadContacts();
  }

  // Public methods
  toggleContactSelection(contact: Contact): void {
    const index = this.selectedContacts.findIndex((c) => c._id === contact._id);

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
    const index = this.selectedContacts.findIndex((c) => c._id === contact._id);
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

    this.chatService.createNewChat(this.selectedContacts, chatName).subscribe({
      next: (newChat) => {
        console.log('New chat created:', newChat);
        // Ensure we have a valid chat ID before navigating
        if (newChat && newChat._id) {
          this.router.navigate(['/chat', newChat._id]);
        } else {
          console.error('Invalid chat response:', newChat);
        }
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        // Handle error - maybe show a toast notification
      },
    });
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

  getStatusColor(status?: string): string {
    if (!status) return '#9e9e9e';

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
    return this.selectedContacts.some((c) => c._id === contact._id);
  }
  // Private methods
  private loadContacts(): void {
    const currentUser = this.authService.getCurrentUser();

    this.usersService
      .getAllUsers()
      .pipe(
        map((users) => users.filter((user) => user._id !== currentUser?._id)), // Exclude current user
        map((users) =>
          users.map(
            (user) =>
              ({
                ...user,
                selected: false,
              } as Contact)
          )
        )
      )
      .subscribe({
        next: (contacts) => {
          this.contacts = contacts;
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          // Fallback to empty array if API fails
          this.contacts = [];
        },
      });
  }
}
