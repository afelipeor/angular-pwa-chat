import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/chat-list/chat-list.component').then(
        (m) => m.ChatListComponent
      ),
  },
  {
    path: 'chat/:id',
    loadComponent: () =>
      import('./components/chat-room/chat-room.component').then(
        (m) => m.ChatRoomComponent
      ),
  },
  {
    path: 'new-chat',
    loadComponent: () =>
      import('./components/new-chat/new-chat.component').then(
        (m) => m.NewChatComponent
      ),
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./components/logout/logout.component').then(
        (m) => m.LogoutComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
