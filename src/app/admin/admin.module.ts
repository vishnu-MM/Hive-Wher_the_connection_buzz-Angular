import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminRoutingModule } from "./admin-routing.module";
import { MatIconModule } from "@angular/material/icon";
import { ManageUsersComponent } from './manage-user/manage-user.component';
import { ManagePostsComponent } from './manage-posts/manage-posts.component';
import { ManageComplaintsComponent } from './manage-complaints/manage-complaints.component';
import { FormsModule } from '@angular/forms';
import { SideBarComponent } from './side-bar/side-bar.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { UserPillComponent } from './user-pill/user-pill.component';
import { UserProfileComponent } from './single-user/user-profile.component';
import { PostComponent } from './single-post/post.component';

@NgModule({
    declarations: [
        DashboardComponent,
        ManageUsersComponent,
        ManagePostsComponent,
        ManageComplaintsComponent,
        SideBarComponent,
        TopBarComponent,
        UserPillComponent,
        UserProfileComponent,
        PostComponent
    ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        MatIconModule,
        FormsModule
    ]
})
export class AdminModule { }
