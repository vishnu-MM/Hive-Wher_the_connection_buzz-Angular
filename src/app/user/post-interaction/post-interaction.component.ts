import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PostService } from "../../../Shared/Services/post.service";
import { Subscription } from "rxjs";
import { User } from "../../../Shared/Models/user.model";
import { Router } from '@angular/router';
import { AppService } from 'src/Shared/Services/app.service';
import { LikeRequest } from 'src/Shared/Models/post.model';

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

    constructor(private postService: PostService,
        private appService: AppService,
        private router: Router) { }

    ngOnInit(): void {
        if (this.postId > 0) {
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
        }
    }

    ngOnDestroy(): void {
        if (this.loadLikeCountSub) this.loadLikeCountSub.unsubscribe();
        if (this.loadCommentCountSub) this.loadCommentCountSub.unsubscribe();
        if (this.isPostLikedByUserSub) this.isPostLikedByUserSub.unsubscribe();
        if (this.toggleLikeSub) this.toggleLikeSub.unsubscribe();
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
            next: value => {},
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
            next: value => {},
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
}
