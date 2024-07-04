import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './page-home/home.component';
import {UpdateProfileComponent} from './page-update-profile/update-profile.component';
import {MyProfileComponent} from "./page-my-profile/my-profile.component";
import {PostComponent} from "./page-post/post.component";
import {ChatComponent} from "./page-chat/chat.component";
import {UserProfileComponent} from "./page-user-profile/user-profile.component";
import {NotificationsComponent} from "./page-notifications/notifications.component";
import {SearchComponent} from "./page-search/search.component";
import { ExplorerComponent } from './page-explorer/explorer.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'post/:id', component: PostComponent },
  { path: 'user/:id', component: UserProfileComponent },
  { path: 'chat/:id', component: ChatComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'search', component: SearchComponent },
  { path: 'explore', component: ExplorerComponent },
  {
    path: 'profile',
    children:[
      {path: '', component: MyProfileComponent, pathMatch: 'full'},
      { path: 'update', component: UpdateProfileComponent},
    ]
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class UserRoutingModule {}