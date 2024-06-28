import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationDTO, NotificationPage, NotificationType } from "../../../Shared/Models/NotificationDTO";
import { WebSocketService } from 'src/Shared/Services/web-socket.service';
import { Subscription } from 'rxjs';
import { Connection, ConnectionStatus, UserResponse } from 'src/Shared/Models/user.model';
import { Post } from 'src/Shared/Models/post.model';
import { UserService } from 'src/Shared/Services/user.service';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
    protected hasNext: boolean = false;
    protected notifications: NotificationDTO[] = [];
    protected pageNo: number = 0;
    protected userId: number = 0;
    protected notificationPage!: NotificationPage;
    protected usernameMap: Map<number, string> = new Map<number, string>();
    protected postMap: Map<number, string> = new Map<number, string>();
    protected readonly NType = NotificationType;

    private fetchNewNotificationSub!: Subscription;
    private loadNotificationsSub!: Subscription;
    private manageFriendRequestSub!: Subscription;

    constructor(private notificationService: WebSocketService,
                private appService: AppService,
                private userService: UserService,
                private cdRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.fetchNewNotificationSub = this.notificationService.notification$.subscribe(notification => {
            const newNotification: NotificationDTO = JSON.parse(notification);
            this.notifications.unshift(newNotification);
            this.fetchUsername(this.notifications).then();
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
        if (this.manageFriendRequestSub) this.manageFriendRequestSub.unsubscribe();
    }

    async loadNotifications(): Promise<void> {
        this.loadNotificationsSub = this.notificationService
            .getNotifications(this.userId, this.pageNo)
            .subscribe({
                next: response => {
                    this.notifications = [...this.notifications, ...response.contents];
                    this.notificationPage = response;
                    this.hasNext = response.hasNext;
                    this.pageNo++;
                    console.log(response);

                    this.fetchUsername(response.contents).then();
                },
                error: error => { console.log(error) }
            });
    }

    async fetchUsername(notificationList: NotificationDTO[]): Promise<void> {
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
        if (type === NotificationType.LIKE) {
            return 'Liked your post';
        } else if (type === NotificationType.COMMENT) {
            return 'Commented on your post';
        } else if (type === NotificationType.FRIEND_REQUEST) {
             return 'Send friend request';
        } else if (type === NotificationType.FRIEND_REQUEST_ACCEPTED) {
            return 'Accepted your friend request';
        }
        return '';
    };

    protected acceptRequest(senderId: number, recipientId: number): void {
        const connectionReq: Connection = {
            id: null,
            senderId: senderId,
            recipientId: recipientId,
            status: ConnectionStatus.ACCEPTED,
            date: new Date()
        }
        this.manageFriendRequest(connectionReq).then();
    }

    protected rejectRequest(senderId: number, recipientId: number): void {
        const connectionReq: Connection = {
            id: null,
            senderId: senderId,
            recipientId: recipientId,
            status: ConnectionStatus.ACCEPTED,
            date: new Date()
        }
        this.manageFriendRequest(connectionReq).then();
    }

    private async manageFriendRequest(connectionReq: Connection): Promise<void> {
        this.manageFriendRequestSub = this.userService.updateConnection(connectionReq).subscribe({
            next: res => {
                for (let i = 0; i < this.notifications.length; i++) {
                    const _notification = this.notifications[i];
                    if (_notification.senderId === connectionReq.senderId && 
                        _notification.recipientId === connectionReq.recipientId &&
                        _notification.typeOfNotification === NotificationType.FRIEND_REQUEST) {
                        
                        this.notifications.splice(i, 1);                        
                        break;
                    }
                }
                if (connectionReq.status === ConnectionStatus.ACCEPTED)
                    this.appService.showSuccess("Successfully accepted the request");
                else if (connectionReq.status === ConnectionStatus.REJECTED)
                    this.appService.showSuccess("Successfully rejected the request");
            },
            error: err => {
                console.log(err);                
                if (connectionReq.status === ConnectionStatus.ACCEPTED)
                    this.appService.showError("Couldn't accept the request try again");
                else if (connectionReq.status === ConnectionStatus.REJECTED)
                    this.appService.showError("Couldn't reject the request try again");
                else
                    this.appService.showError("Something went wrong");
            }
        })
    }
}