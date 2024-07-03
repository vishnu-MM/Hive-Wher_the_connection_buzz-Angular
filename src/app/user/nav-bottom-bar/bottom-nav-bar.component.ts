import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export enum CurrentPage{ HOME, CHAT, SEARCH, NOTIFICATION, EXPLORER, PROFILE }

@Component({
  selector: 'bottom-nav-bar',
  templateUrl: './bottom-nav-bar.component.html',
  styleUrls: ['./bottom-nav-bar.component.css']
})
export class BottomNavBarComponent implements OnInit{
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
            else if ( urlPart === '') this.currentPage = CurrentPage.EXPLORER;
        }
    }
}

/*
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'post/:id', component: PostComponent },
  { path: 'user/:id', component: UserProfileComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'search', component: SearchComponent },
  {
    path: 'profile',
    children:[
      {path: '', component: MyProfileComponent, pathMatch: 'full'},
      { path: 'update', component: UpdateProfileComponent},
    ]
  },
*/