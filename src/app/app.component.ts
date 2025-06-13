import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Angular PWA Chat App';

  private pushService = inject(PushNotificationService);

  ngOnInit(): void {
    this.pushService.requestNotificationPermission().then((permission) => {
      if (permission === 'granted') {
        this.pushService.subscribeToNotifications();
      }
    });
  }
}
