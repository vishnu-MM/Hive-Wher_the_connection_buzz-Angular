import { WebSocketService } from 'src/Shared/Services/web-socket.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User, UserOnline } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { ImageType, UserService } from 'src/Shared/Services/user.service';

@Component({
    selector: 'online-user-list',
    templateUrl: './online-user-list.component.html',
    styleUrls: ['./online-user-list.component.css']
})
export class OnlineUserListComponent implements OnInit, OnDestroy {
    private getMessageSub!: Subscription;
    private eventSubscription!: Subscription;
    protected hide: boolean = true;
    protected usersOnline: number[] = [];
    protected users: User[] = [];
    protected profileMap: Map<number, string> = new Map<number, string>();

    constructor(private webSocket: WebSocketService, 
        private appService: AppService,
        private userService: UserService) { }

    ngOnInit(): void {
        this.eventSubscription = this.appService.event$.subscribe(msg => this.hide = (msg === 'HIDE') );
        this.loadOnlineUsers().then();
        this.listernToOnlineUser().then();
    }

    private async loadOnlineUsers(): Promise<void> {
        const savedStr = localStorage.getItem('ONLINE_USERS');
        if (savedStr) {
            const savedList: number[] = JSON.parse(savedStr);
            this.usersOnline = savedList;
            this.loadUserData(this.usersOnline).then();
        }
    }

    private async loadUserData(userIds: number[]): Promise<void> {
        for ( let userId of userIds ) {
            if (this.profileMap.has(userId)) {
                continue;
            }
            this.userService.getProfileById(userId).subscribe({
                next: res => { 
                    this.users.push(res); 
                    this.loadProfilePics(userId).then()
                },
                error: err => { this.appService.showWarn(`Error happed while loading Online User (${err.status})`) }
            })
        }
    }

    private async loadProfilePics(userId: number): Promise<void> {
        if (this.profileMap.has(userId)) {
            return;
        }
        this.userService.getProfileImage(userId, ImageType.PROFILE_IMAGE).subscribe({
            next: (response) => {
                const image = 'data:image/png;base64,' + response.image
                this.profileMap.set(userId, image);
            },
            error: (err) => {
                if (err.status !== 400) {
                    this.appService.showError(`Could'nt load Cover picture (${err.status})`)
                }
                else {
                    const image = 'assets/no-profile-image.png';
                    this.profileMap.set(userId, image);
                }
            }
        });
    }

    private async listernToOnlineUser(): Promise<void> {
        this.getMessageSub = this.webSocket.onlineUpdate$.subscribe(message => {
            const userOnline: UserOnline = JSON.parse(message);
            if (userOnline.isOnline)
                this.loadOnlineUsers();
            else
                this.userWentOffline(userOnline.userId);
        });
    }

    private userWentOffline(userId: number): void {
        this.users = this.users.filter(user => user.id !== userId);
        this.usersOnline = this.usersOnline.filter(id => id !== userId);
    }
    
    ngOnDestroy(): void {
        if (this.getMessageSub) this.getMessageSub.unsubscribe();
        if (this.eventSubscription) this.eventSubscription.unsubscribe();
    }
}