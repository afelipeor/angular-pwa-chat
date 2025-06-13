"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('AppController (e2e)', () => {
    let app;
    let userToken;
    let userId;
    let chatId;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Authentication', () => {
        it('/api/auth/register (POST)', async () => {
            const registerDto = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerDto)
                .expect(201);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(registerDto.email);
            userToken = response.body.access_token;
            userId = response.body.user.id;
        });
        it('/api/auth/login (POST)', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send(loginDto)
                .expect(200);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('user');
        });
    });
    describe('Users', () => {
        it('/api/users (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('/api/users/profile (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(response.body.email).toBe('test@example.com');
        });
    });
    describe('Chats', () => {
        it('/api/chats (POST)', async () => {
            const createChatDto = {
                name: 'Test Chat',
                participants: [userId],
            };
            const response = await request(app.getHttpServer())
                .post('/api/chats')
                .set('Authorization', `Bearer ${userToken}`)
                .send(createChatDto)
                .expect(201);
            expect(response.body.name).toBe(createChatDto.name);
            chatId = response.body._id;
        });
        it('/api/chats (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/chats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
    describe('Messages', () => {
        it('/api/messages (POST)', async () => {
            const createMessageDto = {
                content: 'Hello World',
                chatId: chatId,
                type: 'text',
            };
            const response = await request(app.getHttpServer())
                .post('/api/messages')
                .set('Authorization', `Bearer ${userToken}`)
                .send(createMessageDto)
                .expect(201);
            expect(response.body.content).toBe(createMessageDto.content);
        });
        it('/api/messages/chat/:chatId (GET)', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/messages/chat/${chatId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    describe('Notifications', () => {
        it('/api/notifications/subscribe (POST)', async () => {
            const subscriptionDto = {
                endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                keys: {
                    p256dh: 'test-p256dh-key',
                    auth: 'test-auth-key',
                },
            };
            await request(app.getHttpServer())
                .post('/api/notifications/subscribe')
                .set('Authorization', `Bearer ${userToken}`)
                .send(subscriptionDto)
                .expect(201);
        });
    });
});
//# sourceMappingURL=integration.spec.js.map