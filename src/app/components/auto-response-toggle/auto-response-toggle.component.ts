import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-auto-response-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auto-response-toggle.component.html',
  styleUrls: ['./auto-response-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoResponseToggleComponent implements OnInit, OnDestroy {
  autoResponseEnabled = true;
  delaySeconds = 2;

  private destroy$ = new Subject<void>();

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    // Listen for socket connection
    const connected = this.socketService.isConnected();
    if (connected) {
      // Send initial settings
      this.toggleAutoResponse();
      this.updateDelay();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleAutoResponse(): void {
    this.socketService.emit('toggleAutoResponse', {
      enabled: this.autoResponseEnabled,
    });
  }

  updateDelay(): void {
    this.socketService.emit('setAutoResponseDelay', {
      delay: this.delaySeconds * 1000,
    });
  }
}
