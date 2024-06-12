import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationDTO, NotificationPage, NotificationType } from "../../../Shared/Models/NotificationDTO";
import { WebSocketService } from 'src/Shared/Services/web-socket.service';
import { Subscription } from 'rxjs';
import { UserResponse } from 'src/Shared/Models/user.model';
import { Post } from 'src/Shared/Models/post.model';
import { UserService } from 'src/Shared/Services/user.service';

@Component({
	selector: 'app-notifications',
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
	hasNext: boolean = true;
	notifications: NotificationDTO[] = [];
	pageNo: number = 0;
	userId: number = 0;
	private fetchNewNotificationSub!: Subscription;
	private loadNotificationsSub!: Subscription;
	notificationPage!: NotificationPage;
	usernameMap : Map<number, string> = new Map<number,string>();
	postMap : Map<number, string> = new Map<number,string>();

	constructor(private notificationService: WebSocketService, private userService : UserService) { }

	ngOnInit(): void {
		this.fetchNewNotificationSub = this.notificationService.notification$.subscribe(notification => {
			this.notifications.unshift(notification);
		})
		const userStr = localStorage.getItem('CURRENT_USER');
		if (userStr) {
			const user: UserResponse = JSON.parse(userStr);
			this.userId = user.id;
			this.loadNotifications().then();
		}
	}

	ngOnDestroy(): void {
		if (this.fetchNewNotificationSub) this.fetchNewNotificationSub.unsubscribe();
		if (this.loadNotificationsSub) this.loadNotificationsSub.unsubscribe();
	}

	async loadNotifications(): Promise<void> {
		this.loadNotificationsSub = this.notificationService
			.getNotifications(this.userId, this.pageNo)
			.subscribe({
				next: response => {
					this.notifications = [...this.notifications, ...response.contents];
					this.notificationPage = response;
					this.pageNo++;
					this.fetchUsername(response.contents).then();
				},
				error: error => { console.log(error) }
			});
	}

	async fetchUsername(notificationList: NotificationDTO[]) : Promise<void> {
		for (const notification of notificationList) {
			const userId = notification.senderId;
			console.log(userId);

			this.userService.getProfileById(userId)
				.subscribe({
					next: res => {
						this.usernameMap.set(res.id!, res.username);
						console.log(res.id!, res.username);
					 },
					error: err => { console.log(err); }
				})
		}
	}

	notificationIcon(type: NotificationType): string {
		if (type === NotificationType.LIKE)
			return 'assets/like.png';
		else if (type === NotificationType.COMMENT)
			return 'assets/comment.png';
		else if (type === NotificationType.FRIEND_REQUEST || type === NotificationType.FRIEND_REQUEST_ACCEPTED)
			return 'assets/friend-request.png';
		return '';
	};

	description(type: NotificationType): string {
		if (type === NotificationType.LIKE)
			return 'Liked your post';
		else if (type === NotificationType.COMMENT)
			return 'Commented on your post';
		else if (type === NotificationType.FRIEND_REQUEST )
			return 'Send friend request';
		else if ( type === NotificationType.FRIEND_REQUEST_ACCEPTED)
			return 'Accepted your friend request';
		return '';
	};
}