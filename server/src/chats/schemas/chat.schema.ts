import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({
    type: Map,
    of: Number,
    default: new Map()
  })
  unreadCount: Map<string, number>;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop()
  avatar?: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
