import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {HomeComponent} from "./home/home.component";
import {SideNavBarComponent} from "./side-nav-bar/side-nav-bar.component";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {UserRoutingModule} from "./user-routing.module";
import { PostsComponent } from './posts/posts.component';
import { SinglePostComponent } from './single-post/single-post.component';
import { CreatePostComponent } from './create-post/create-post.component';
import { UpdateProfileComponent } from './update-profile/update-profile.component';
import {FormsModule} from "@angular/forms";
import {ImageCropperComponent} from "ngx-image-cropper";

@NgModule({
  declarations: [
    HomeComponent,
    SideNavBarComponent,
    PostsComponent,
    SinglePostComponent,
    CreatePostComponent,
    UpdateProfileComponent
  ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        UserRoutingModule,
        NgOptimizedImage,
        FormsModule,
        ImageCropperComponent
    ]
})
export class UserModule { }
