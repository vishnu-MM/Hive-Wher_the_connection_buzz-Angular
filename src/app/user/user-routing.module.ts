import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {UpdateProfileComponent} from './update-profile/update-profile.component';
import {MyProfileComponent} from "./my-profile/my-profile.component";
import {PostComponent} from "./post/post.component";
import {ChatComponent} from "./chat/chat.component";
import {UserProfileComponent} from "./user-profile/user-profile.component";
import {NotificationsComponent} from "./notifications/notifications.component";
import {SearchComponent} from "./search/search.component";
import { PostEditComponent } from './post-edit/post-edit.component';

const routes: Routes = [
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
      { path: 'edit-post/:id', component: PostEditComponent}
    ]
 },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class UserRoutingModule { }
