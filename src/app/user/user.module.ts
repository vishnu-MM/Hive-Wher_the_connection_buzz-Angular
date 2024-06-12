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
import { MyProfileComponent } from './my-profile/my-profile.component';
import {MatDialogModule} from "@angular/material/dialog";
import { PostComponent } from './post/post.component';
import { PostInteractionComponent } from './post-interaction/post-interaction.component';
import {NgToastModule} from "ng-angular-popup";
import {SingleCommentComponent} from "./single-comment/single-comment.component";
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ChatComponent } from './chat/chat.component';
import { SearchComponent } from './search/search.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { SpinnerComponent } from '../spinner/spinner.component';

@NgModule({
    declarations: [
        HomeComponent,
        SideNavBarComponent,
        PostsComponent,
        SinglePostComponent,
        CreatePostComponent,
        UpdateProfileComponent,
        MyProfileComponent,
        PostComponent,
        SingleCommentComponent,
        PostInteractionComponent,
        UserProfileComponent,
        ChatComponent,
        SearchComponent,
        NotificationsComponent
    ],
    exports: [
        PostsComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        UserRoutingModule,
        NgOptimizedImage,
        FormsModule,
        ImageCropperComponent,
        MatDialogModule,
        NgToastModule
    ]
})
export class UserModule { }
