import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User, UserResponse } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { UserService } from 'src/Shared/Services/user.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
    protected user!: User;
    private loadUserDetailsSub!: Subscription;

    constructor(private appService: AppService, 
        private userService: UserService, 
        private router: Router) {}

    ngOnInit(): void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (!userStr) {
            this.appService.showError("Could'nt load user details");
            this.router.navigate(['/a/dashboard']);
            return;
        }    
        const user: UserResponse = JSON.parse(userStr);
        this.loadUserDetails(user.id);
        this.loading = false;
    }

    ngOnDestroy(): void {
        if (this.loadUserDetailsSub) this.loadUserDetailsSub.unsubscribe();
    }

    private async loadUserDetails(userId: number) {
        this.loadUserDetailsSub = this.userService.getProfileById(userId).subscribe({
            next: res => {
                this.user = res;
            },
            error: err => {
                this.appService.showError("Could'nt load user details");
                this.router.navigate(['/a/dashboard']);
                return;
            }
        })
    }

    protected loading = false;
    protected changePassword() {
        this.loading = true;
        this.appService.resetPassword(this.user.email);
    }
}
