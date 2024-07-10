import { Role } from "./role";

export interface User {
    id: number | null;
    name: string;
    username: string;
    email: string;
    phone: string;
    aboutMe: string;
    role: Role;
    joinDate: Date;
    isBlocked: boolean;
    isVerified: boolean;
    blockReason: string;
}
export interface UserPage {
    contents: User[];
    pageNo: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isLast: boolean;
    hasNext: boolean;
}
export interface UserResponse {
    id: number;
    role: Role;
    email?: string;
}
export interface Connection {
    id: number | null;
    senderId: number;
    recipientId: number;
    status: ConnectionStatus;
    date: Date;
}
export enum ConnectionStatus { FRIENDS = 'FRIENDS', REQUESTED = 'REQUESTED', REJECTED = 'REJECTED', ACCEPTED = 'ACCEPTED', NOT_FRIENDS = 'NOT_FRIENDS' }

export interface UserOnline {
    userId: number;
    friendList: number[];
    isOnline: boolean;
}