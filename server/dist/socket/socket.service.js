"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const socket_io_client_1 = require("socket.io-client");
const environment_1 = require("../../environments/environment");
let SocketService = class SocketService {
    constructor() {
        this.socket = null;
    }
    connect(token) {
        if (this.socket?.connected) {
            return;
        }
        this.socket = (0, socket_io_client_1.io)(environment_1.environment.socketUrl, {
            auth: {
                token: token,
            },
            transports: ['websocket', 'polling'],
            upgrade: true,
            timeout: 20000,
            forceNew: true,
        });
        this.socket.on('connect', () => {
            console.log('Socket connected successfully');
        });
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
        else {
            console.warn('Socket not connected. Cannot emit event:', event);
        }
    }
    on(event) {
        return new rxjs_1.Observable((observer) => {
            if (this.socket) {
                this.socket.on(event, (data) => observer.next(data));
            }
            return () => {
                if (this.socket) {
                    this.socket.off(event);
                }
            };
        });
    }
    isConnected() {
        return this.socket?.connected || false;
    }
};
exports.SocketService = SocketService;
exports.SocketService = SocketService = __decorate([
    (0, core_1.Injectable)({
        providedIn: 'root',
    })
], SocketService);
//# sourceMappingURL=socket.service.js.map