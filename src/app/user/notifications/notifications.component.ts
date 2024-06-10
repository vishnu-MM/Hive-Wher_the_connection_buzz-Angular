import {Component, OnDestroy, OnInit} from '@angular/core';
import {NotificationDTO, NotificationType} from "../../../Shared/Models/NotificationDTO";

@Component({
	selector: 'app-notifications',
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
	Description: string = '';
	dateTime: string = '';
	hasNext: boolean = true;
	oldNotifications: NotificationDTO[] = [];
	newNotifications: NotificationDTO[] = [];
	readonly notificationIcon: { [key in NotificationType]: string } = {
		[NotificationType.LIKE]: 'assets/like.png',
		[NotificationType.COMMENT]: 'assets/comment.png',
		[NotificationType.FRIEND_REQUEST]: 'assets/friend-request.png',
		[NotificationType.FRIEND_REQUEST_ACCEPTED]: 'assets/friend-request.png'
	};
	
	ngOnInit(): void {
	}
	
	ngOnDestroy(): void {
	}
	
	async loadNextPage(): Promise<void> {
	
	}
	
}
