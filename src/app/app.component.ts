import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PushNotificationService } from './services/push-notification.service';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet],
    template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Angular PWA Chat App';

  constructor(private pushService: PushNotificationService) {}

  ngOnInit(): void {
    this.pushService.requestNotificationPermission().then((permission) => {
      if (permission === 'granted') {
        this.pushService.subscribeToNotifications();
      }
    });
  }
}
