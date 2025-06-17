import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;
export declare class Chat {
    name: string;
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
    lastMessage?: Types.ObjectId;
    unreadCount: Map<string, number>;
    isGroup: boolean;
    avatar?: string;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, Document<unknown, any, Chat> & Chat & {
    _id: Types.ObjectId;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, Document<unknown, {}, import("mongoose").FlatRecord<Chat>> & import("mongoose").FlatRecord<Chat> & {
    _id: Types.ObjectId;
}>;
