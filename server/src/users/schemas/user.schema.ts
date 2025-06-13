import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop()
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: ['online', 'away', 'offline'],
    default: 'offline',
  })
  status: string;

  @Prop()
  avatar?: string;

  @Prop({ type: Date, default: Date.now })
  lastSeen: Date;

  @Prop({ type: [String], default: [] })
  deviceTokens: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
