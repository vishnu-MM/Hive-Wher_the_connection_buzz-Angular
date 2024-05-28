import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {UpdateProfileComponent} from './update-profile/update-profile.component';
import {MyProfileComponent} from "./my-profile/my-profile.component";
import {PostComponent} from "./post/post.component";

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'post/:id', component: PostComponent },
  { path: 'chat', component: PostComponent },
  {
    path: 'profile',
    children:[
      {path: '', component: MyProfileComponent, pathMatch: 'full'},
      { path: 'update', component: UpdateProfileComponent}
    ]
 },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class UserRoutingModule { }
