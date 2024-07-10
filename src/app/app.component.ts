import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from "../Shared/Services/web-socket.service";
import { AppService } from "../Shared/Services/app.service";
import { Router } from "@angular/router";
import { USER_LOGIN } from "../Shared/Store/user.action";
import { Store } from "@ngrx/store";
import { User, UserOnline, UserResponse } from "../Shared/Models/user.model";
import { Subscription } from "rxjs";
import { Role } from "../Shared/Models/role";
import { UserService } from 'src/Shared/Services/user.service';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent implements OnInit, OnDestroy {
    private loadUserDetailsSub!: Subscription;
    private validateTokenSub!: Subscription;

    constructor(private webSocketService: WebSocketService,
        private userService: UserService,  
        private appService: AppService,
        private userStore: Store<{ UserStore: User }>) { }

    ngOnInit(): void {
        const token: string | null = localStorage.getItem('AUTH_TOKEN');
        const userStr: string | null = localStorage.getItem('CURRENT_USER');        
        if (token && userStr) {
            const user: UserResponse = JSON.parse(userStr);
            this.isValidToken(token,user).then();

        }
    }

    private async isValidToken(token: string, userResponse: UserResponse): Promise<void> {
        this.validateTokenSub = this.appService.verifyToken(token).subscribe({
            next: res => {
                if (res) {
                    this.loadUserDetails().then();
                }
                else {
                    this.appService.showError(`Token Expires, Please Login`);
                    this.appService.logout();
                }
            },
            error: err => {
                this.appService.showError(`Token Expires, Please Login (${err.status})`);
                this.appService.logout();
            }
        })
    }


    private async loadUserDetails(): Promise<void> {
        this.loadUserDetailsSub = this.appService.loadUserDetails().subscribe({
            next: value => {
                this.userStore.dispatch(USER_LOGIN());
                const userId: number = value.id!;
                if (value.role === Role.USER) {
                    this.webSocketService.initNotificationConnection(userId);
                    this.webSocketService.initConnectionSocket(userId);
                }
            },
            error: err => {
                this.appService.logout();
                this.webSocketService.disconnectNotificationConnection();
            }
        })
    }

    ngOnDestroy(): void {
        if (this.loadUserDetailsSub) this.loadUserDetailsSub.unsubscribe();
        if (this.validateTokenSub) this.validateTokenSub.unsubscribe();
        this.webSocketService.disconnectNotificationConnection();
    }
}