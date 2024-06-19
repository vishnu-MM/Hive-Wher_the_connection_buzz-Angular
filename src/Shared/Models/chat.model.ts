import { Timestamp } from "rxjs";

export interface Group {
    id: string | null;
    groupName: string;
    membersId: string[];
    imageData: File | null;
    imageName: string | null;
    imageType: string | null;
}
export interface MessageDTO {
    id: string;
    chatId: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string;
    messageType: MessageType;
}
export enum MessageType { PRIVATE='PRIVATE', GROUP='GROUP' }