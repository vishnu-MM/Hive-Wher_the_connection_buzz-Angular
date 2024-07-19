import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { PostService } from "../../../Shared/Services/post.service";
import { Subscription } from "rxjs";
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { Router } from '@angular/router';
import { AppService } from 'src/Shared/Services/app.service';
import { LikeRequest } from 'src/Shared/Models/post.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FRONT_END_APP_URL } from 'src/environments/environment';
import { MessageService } from 'src/Shared/Services/message.service';
import { ImageType, UserService } from 'src/Shared/Services/user.service';
import { MessageDTO, MessageFileType, MessageType } from 'src/Shared/Models/chat.model';

@Component({
    selector: 'post-interaction',
    templateUrl: './post-interaction.component.html',
    styleUrls: ['./post-interaction.component.css']
})
export class PostInteractionComponent implements OnInit, OnDestroy {
    @Input("id") postId: number = 0;
    protected isLiked: boolean = false;
    protected likeCount: number = 0;
    protected commentCount: number = 0
    protected userId!: number;
    private loadLikeCountSub!: Subscription;
    private loadCommentCountSub!: Subscription;
    private isPostLikedByUserSub!: Subscription;
    private toggleLikeSub!: Subscription;
    private eventSubscription!: Subscription;

    constructor(private postService: PostService,
        private messageService: MessageService,
        private userService: UserService,
        private appService: AppService,
        private dialog: MatDialog,
        private router: Router) { }

    ngOnInit(): void {
        if (this.postId < 0) {
            return;
        }

        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: User = JSON.parse(userStr);
            this.userId = user.id!;
        }
        else {
            this.appService.showWarn("Couldn't load like details");
        }
        this.loadLikeCount()
        this.loadCommentCount()
        this.isPostLikedByUser()

        this.postShareUrl = FRONT_END_APP_URL + 'u/post/' + this.postId;

        this.eventSubscription = this.postService.event$.subscribe(message => {
            if (message === 'INCR') {
                this.commentCount++;
            }
            if (message === 'DECR' && this.commentCount !== 0) {
                this.commentCount--;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.loadLikeCountSub) this.loadLikeCountSub.unsubscribe();
        if (this.loadCommentCountSub) this.loadCommentCountSub.unsubscribe();
        if (this.isPostLikedByUserSub) this.isPostLikedByUserSub.unsubscribe();
        if (this.toggleLikeSub) this.toggleLikeSub.unsubscribe();
        if (this.eventSubscription) this.eventSubscription.unsubscribe();
        if (this.loadFriendsListSub) this.loadFriendsListSub.unsubscribe();
        if (this.getProfileById) this.getProfileById.unsubscribe();
    }

    loadLikeCount(): void {
        this.loadLikeCountSub = this.postService.getLikeCount(this.postId).subscribe({
            next: value => { this.likeCount = value },
            error: err => { this.appService.showWarn("Couldn't load like details"); }
        })
    }

    loadCommentCount(): void {
        this.loadCommentCountSub = this.postService.getCommentCount(this.postId).subscribe({
            next: (res: number) => { this.commentCount = res },
            error: (err: any) => { this.appService.showWarn("Couldn't load comment details"); }
        })
    }

    isPostLikedByUser(): void {
        if (this.userId === null && this.postId <= 0) {
            return;
        }

        this.isPostLikedByUserSub = this.postService.isUserLiked({ postId: this.postId, userId: this.userId }).subscribe({
            next: value => { this.isLiked = value },
            error: err => { this.appService.showWarn("Couldn't load like details"); }
        });
    }

    toggleLike(): void {
        if (this.userId === null && this.postId <= 0) {
            return;
        }
        if (this.toggleLikeSub) {
            this.toggleLikeSub.unsubscribe();
        }
        const requestObj: LikeRequest = {
            postId: this.postId, userId: this.userId
        };
        if (this.isLiked) {
            this.unLikePost(requestObj).then();
        }
        else {
            this.likePost(requestObj).then();
        }
    }

    private async likePost(likeReq: LikeRequest): Promise<void> {
        console.log(this.userId);
        this.isLiked = true;
        this.likeCount++;
        this.toggleLikeSub = this.postService.addLike(likeReq).subscribe({
            next: value => { },
            error: err => {
                this.appService.showError("Could'nt like the post, Try again");
                this.isLiked = false;
                this.likeCount--;
            }
        })
    }

    private async unLikePost(unLikeReq: LikeRequest): Promise<void> {
        this.isLiked = false;
        this.likeCount--;
        this.toggleLikeSub = this.postService.removeLike(unLikeReq).subscribe({
            next: value => { },
            error: err => {
                this.appService.showError("Could'nt un-like the post, Try again");
                this.likeCount++;
                this.isLiked = true;
            }
        })
    }

    navigateTo() {
        this.router.navigate([`/u/post`, this.postId]);
    }

    //Share Related
    private loadFriendsListSub!: Subscription;
    private getProfileById!: Subscription;
    @ViewChild('Share') private shareTemplateRef!: TemplateRef<any>;
    private shareDialogRef!: MatDialogRef<any>;
    protected postShareUrl: string = 'url';
    protected friendsList: User[] = [];
    protected profileMap: Map<number, string> = new Map<number, string>();

    protected openShareDialog(): void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            this.loadFriendsList(user.id).then();
        }
        this.shareDialogRef = this.dialog.open(this.shareTemplateRef);
    }

    protected closeShareDialog(): void {
        this.shareDialogRef.close();
    }

    protected copyToClipBoard(): void {
        try {
            navigator.clipboard.writeText(this.postShareUrl);
            this.appService.showSuccess('Link copied');
        } catch (error) {
            this.appService.showError('Error while copying');
        }
    }

    private async loadFriendsList(id: number): Promise<void> {
        this.loadFriendsListSub = this.messageService.getusers(id).subscribe({
            next: value => {
                for (let userId of value) { 
                    this.loadUser(userId).then(); 
                    this.loadUserProfilePictures(userId).then();
                }
            },
            error: err => {
                this.appService.showError(`Could'nt load friends list (${err.status})`);
            }
        });
    }

    private async loadUser(id: number): Promise<void> {
        this.getProfileById = this.userService.getProfileById(id).subscribe({
            next: value => {
                this.friendsList.unshift(value);                
            },
            error: err => {
                this.appService.showError(`Could'nt load user (${err.status})`);
            }
        });
    }

    private async loadUserProfilePictures(userId : number): Promise<void> {
        this.getProfileById = this.userService.getProfileImage(userId, ImageType.PROFILE_IMAGE).subscribe({
            next: value => {
                this.profileMap.set(userId, ('data:image/png;base64,' + value.image))               
            },
            error: err => {
                this.profileMap.set(userId, 'assets/no-profile-image.png');
            }
        });
    }

    protected sentToUser(user: User) : void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (!userStr || this.postId <= 0 ) {
            return;
        }
        const currentUser: UserResponse = JSON.parse(userStr);
        const message: MessageDTO = {
            id: "", 
            chatId: "",
            content: this.postId.toString(),
            recipientId: user.id!.toString(),
            senderId: currentUser.id.toString(),
            timestamp: (new Date()).toString(),
            messageType: MessageType.PRIVATE,
            messageFileType: MessageFileType.POST
        }
        this.messageService.sendMessage(message).subscribe({
            next: () => {
                this.shareDialogRef.close();
                this.router.navigate(['/u/chat', user.id!]);
            },
            error: err => this.appService.showError(`Error sending message (${err.status})`)
        });
    }
}