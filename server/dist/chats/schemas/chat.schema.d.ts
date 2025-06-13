import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;
export declare class Chat {
    _id: string;
    name: string;
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
    lastMessage?: Types.ObjectId;
    unreadCount: Map<string, number>;
    isGroup: boolean;
    avatar?: string;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, Document<unknown, any, Chat> & Chat & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, Document<unknown, {}, import("mongoose").FlatRecord<Chat>> & import("mongoose").FlatRecord<Chat> & Required<{
    _id: string;
}>>;
