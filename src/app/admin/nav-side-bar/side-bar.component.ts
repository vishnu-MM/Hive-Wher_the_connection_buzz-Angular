import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/Shared/Services/app.service';

enum CurrentPage {
    DASHBOARD='DASHBOARD',
    USER_MANAGEMENT='USER_MANAGEMENT',
    POST_MANAGEMENT='POST_MANAGEMENT',
    COMPLAINT_MANAGEMENT='COMPLAINT_MANAGEMENT',
    PROFILE='PROFILE'
 }

@Component({
    selector: 'side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {
    currentPage: CurrentPage = CurrentPage.DASHBOARD ;
    CurrentPage = CurrentPage;

    constructor(private appService : AppService,
                private router: Router,
                private route: ActivatedRoute) {}

    ngOnInit(): void {
        const url = this.router.url;
        const parts = url.split('/');
        const indexOfA = parts.indexOf('a');
        if (indexOfA !== -1 && parts.length > indexOfA + 1) {
            const urlPart = parts[indexOfA + 1];
            if ( urlPart === 'dashboard') this.currentPage = CurrentPage.DASHBOARD;
            else if ( urlPart === 'complaints') this.currentPage = CurrentPage.COMPLAINT_MANAGEMENT;
            else if ( urlPart === 'posts') this.currentPage = CurrentPage.POST_MANAGEMENT;
            else if ( urlPart === 'users') this.currentPage = CurrentPage.USER_MANAGEMENT;
            else if ( urlPart === 'profile') this.currentPage = CurrentPage.PROFILE;
        }
        console.log(this.currentPage);

    }

    logout() {
        this.appService.logout();
    }
}