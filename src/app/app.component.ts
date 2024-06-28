import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from "../Shared/Services/web-socket.service";
import { AppService } from "../Shared/Services/app.service";
import { Router } from "@angular/router";
import { USER_LOGIN } from "../Shared/Store/user.action";
import { Store } from "@ngrx/store";
import { User } from "../Shared/Models/user.model";
import { Subscription } from "rxjs";
import { Role } from "../Shared/Models/role";

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent implements OnInit, OnDestroy {
    private loadUserDetailsSub!: Subscription;

    constructor(private webSocketService: WebSocketService,
        private appService: AppService,
        private router: Router,
        private userStore: Store<{ UserStore: User }>) { }

    ngOnInit(): void {
        const token: string | null = localStorage.getItem('AUTH_TOKEN')        
        if (token) {
            this.loadUserDetailsSub = this.appService.loadUserDetails().subscribe({
                next: value => {
                    this.userStore.dispatch(USER_LOGIN());
                    const userId: number = value.id!;
                    if (value.role === Role.USER)
                        this.webSocketService.initNotificationConnection(userId);
                },
                error: err => {
                    console.log(err);
                    this.appService.logout();
                    this.webSocketService.disconnectNotificationConnection();
                }
            })
        }

    }
    ngOnDestroy(): void {
        if (this.loadUserDetailsSub) this.loadUserDetailsSub.unsubscribe();
        this.webSocketService.disconnectNotificationConnection();
    }
}