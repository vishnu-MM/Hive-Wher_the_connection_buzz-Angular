import { Post, PostType } from "./post.model";
import { User } from "./user.model";

export interface NotificationDTO {
	id?: string | null;
	senderId: number;
	recipientId: number;
	typeOfNotification: NotificationType;
	date: Date;
	postId?: number | null;
	commentId?: number | null;
}
export enum NotificationType {
	LIKE= "LIKE",
	COMMENT="COMMENT",
	FRIEND_REQUEST="FRIEND_REQUEST",
	FRIEND_REQUEST_ACCEPTED="FRIEND_REQUEST_ACCEPTED"
}
export interface NotificationPage{
  contents : NotificationDTO[];
  pageNo : number;
  pageSize : number;
  totalElements : number;
  totalPages : number;
  isLast : boolean;
  hasNext : boolean;
}