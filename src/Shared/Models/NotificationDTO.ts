
export interface NotificationDTO {
	id?: string | null;
	senderId: number;
	recipientId: number;
	typeOfAction: NotificationType;
	timestamp: string;
	postId?: number | null;
	commentId?: number | null;
}
export enum NotificationType {
	LIKE= "LIKE",
	COMMENT="COMMENT",
	FRIEND_REQUEST="FRIEND_REQUEST",
	FRIEND_REQUEST_ACCEPTED="FRIEND_REQUEST_ACCEPTED"
}
