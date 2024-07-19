import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {HomeComponent} from "./page-home/home.component";
import {SideNavBarComponent} from "./nav-side-bar/side-nav-bar.component";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {UserRoutingModule} from "./user-routing.module";
import { PostsComponent } from './post-list/posts.component';
import { SinglePostComponent } from './single-post/single-post.component';
import { CreatePostComponent } from './post-create/create-post.component';
import { UpdateProfileComponent } from './page-update-profile/update-profile.component';
import {FormsModule} from "@angular/forms";
import {ImageCropperComponent} from "ngx-image-cropper";
import { MyProfileComponent } from './page-my-profile/my-profile.component';
import {MatDialogModule} from "@angular/material/dialog";
import { PostComponent } from './page-post/post.component';
import { PostInteractionComponent } from './post-interaction/post-interaction.component';
import { NgToastModule} from "ng-angular-popup";
import { SingleCommentComponent } from "./single-comment/single-comment.component";
import { UserProfileComponent } from './page-user-profile/user-profile.component';
import { ChatComponent } from './page-chat/chat.component';
import { SearchComponent } from './page-search/search.component';
import { NotificationsComponent } from './page-notifications/notifications.component';
import {CloudinaryModule} from '@cloudinary/ng';
import { BottomNavBarComponent } from './nav-bottom-bar/bottom-nav-bar.component';
import { ExplorerComponent } from './page-explorer/explorer.component';
import { OnlineUserListComponent } from './online-user-list/online-user-list.component';
import { PostPreviewComponent } from './post-preview/post-preview.component';
import { ShortenPipe } from '../shorten.pipe';

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
        NotificationsComponent,
        BottomNavBarComponent,
        ExplorerComponent,
        OnlineUserListComponent,
        PostPreviewComponent,
        ShortenPipe
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
        NgToastModule,
        CloudinaryModule
    ]
})
export class UserModule { }
