import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentPage } from '../nav-bottom-bar/bottom-nav-bar.component';

@Component({
  selector: 'side-nav-bar',
  templateUrl: './side-nav-bar.component.html',
  styleUrls: ['./side-nav-bar.component.css']
})
export class SideNavBarComponent {
    protected currentPage!: any;
    constructor(private router: Router) {}

    ngOnInit(): void {
        const url = this.router.url;
        const parts = url.split('/');
        const indexOfA = parts.indexOf('u');
        if (indexOfA !== -1 && parts.length > indexOfA + 1) {
            const urlPart = parts[indexOfA + 1];
            if ( urlPart === 'home') this.currentPage = CurrentPage.HOME;
            else if ( urlPart === 'chat') this.currentPage = CurrentPage.CHAT;
            else if ( urlPart === 'search') this.currentPage = CurrentPage.SEARCH;
            else if ( urlPart === 'notifications') this.currentPage = CurrentPage.NOTIFICATION;
            else if ( urlPart === 'profile') this.currentPage = CurrentPage.PROFILE;
            else if ( urlPart === '') this.currentPage = CurrentPage.EXPLORER;
        }
    }
}