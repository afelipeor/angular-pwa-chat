import { Observable } from 'rxjs';
export declare class SocketService {
    private socket;
    connect(token: string): void;
    disconnect(): void;
    emit(event: string, data: any): void;
    on(event: string): Observable<any>;
    isConnected(): boolean;
}
