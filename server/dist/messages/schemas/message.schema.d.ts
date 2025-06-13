import { Document, Types } from 'mongoose';
export type MessageDocument = Message & Document;
export declare class Message {
    _id: string;
    content: string;
    sender: Types.ObjectId;
    chat: Types.ObjectId;
    type: string;
    readBy: Types.ObjectId[];
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    edited: boolean;
    editedAt?: Date;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message> & Message & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>> & import("mongoose").FlatRecord<Message> & Required<{
    _id: string;
}>>;
