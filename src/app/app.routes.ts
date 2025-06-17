import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/chat-list/chat-list.component').then(
        (m) => m.ChatListComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'chat/:id',
    loadComponent: () =>
      import('./components/chat-room/chat-room.component').then(
        (m) => m.ChatRoomComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'new-chat',
    loadComponent: () =>
      import('./components/new-chat/new-chat.component').then(
        (m) => m.NewChatComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
