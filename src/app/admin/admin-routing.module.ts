import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ManageUsersComponent } from "./manage-user/manage-user.component";
import { ManagePostsComponent } from "./manage-posts/manage-posts.component";
import { ManageComplaintsComponent } from './manage-complaints/manage-complaints.component';
import { UserProfileComponent } from './single-user/user-profile.component';
import { PostComponent } from './single-post/post.component';

const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'complaints', component: ManageComplaintsComponent },
    {
        path: 'posts',
        children: [
            { path: '', component: ManagePostsComponent, pathMatch: 'full' },
            { path: 'post/:id', component: PostComponent }
        ]
    },
    {
        path: 'users',
        children: [
            { path: '', component: ManageUsersComponent, pathMatch: 'full' },
            { path: 'user/:id', component: UserProfileComponent }
        ]
    },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AdminRoutingModule { }
