import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImageType, UserService } from 'src/Shared/Services/user.service';

@Component({
    selector: 'user-pill',
    templateUrl: './user-pill.component.html',
    styleUrls: ['./user-pill.component.css']
})
export class UserPillComponent implements OnInit, OnDestroy {
    @Input('UserID') userId!: number;
    userName: string = '';
    username: string = '';
    profilePicture: string = '';
    private loadProfilePicSub!: Subscription;
    private loadUserSub!: Subscription;

    constructor(private service: UserService, private router: Router) {}

    ngOnInit(): void {
        this.loadUser().then();
    }

    ngOnDestroy(): void {
        if (this.loadProfilePicSub) this.loadProfilePicSub.unsubscribe();
        if (this.loadUserSub) this.loadUserSub.unsubscribe();
    }

    async loadUser(): Promise<void> {
        this.loadUserSub = this.service.getProfileById(this.userId)
            .subscribe({
                next: res => {
                    this.username = '@' + res.username;
                    this.userName = res.name;
                    this.loadProfilePicture().then();
                },
                error: err => {}
            });
    }

    async loadProfilePicture(): Promise<void> {
        this.loadProfilePicSub = this.service.getProfileImage(this.userId, ImageType.PROFILE_IMAGE)
        .subscribe({
            next: res => {
                this.profilePicture = 'data:image/png;base64,' + res.image; 
            },
            error: err => {  this.profilePicture = 'assets/no-profile-image.jpg'}
        });
    }

    redireactTo() {
        this.router.navigate(['/a/users/user',this.userId])
    }
}
