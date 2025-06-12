import { registerAs } from '@nestjs/config';

export default registerAs('vapid', () => ({
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BKxUrVbKnAXkGAhCPLhwTr1VNhHcHVxl5v1xVP_qfTSgXvd0OKnO8PJlqfQEz3SjhKvhVFUJTK1MPTL5UjJ5zsg',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key-here',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@angular-chat.com',
}));