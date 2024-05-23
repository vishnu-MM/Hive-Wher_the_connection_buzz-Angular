import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {User} from "../../../Shared/Models/user.model";

@Component({
  selector: 'post-interaction',
  templateUrl: './post-interaction.component.html',
  styleUrls: ['./post-interaction.component.css']
})
export class PostInteractionComponent implements OnInit, OnDestroy {
    @Input() id : number = 0;
    isLiked : boolean = false;
    likeCount : number = 0;
    commentCount : number = 0
    userId!: number;
    private loadLikeCountSub! : Subscription;
    private loadCommentCountSub! : Subscription;
    private isPostLikedByUserSub! : Subscription;
    private toggleLikeSub! : Subscription;

    constructor(private postService : PostService) {}

    ngOnInit(): void {
        if (this.id > 0) {
            const userStr = localStorage.getItem('CURRENT_USER');
            if (userStr) {
              const user: User = JSON.parse(userStr);
              this.userId = user.id!;
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

    loadLikeCount() : void {
        this.loadLikeCountSub = this.postService
            .getLikeCount(this.id)
            .subscribe({
                next: value => this.likeCount = value,
                error: err => {}
            })
    }

    loadCommentCount() : void {

    }

    isPostLikedByUser() : void {
        if (this.userId !== null && this.id > 0) {
            this.isPostLikedByUserSub = this.postService
                .isUserLiked({postId: this.id, userId: this.userId})
                .subscribe({
                    next: value => { this.isLiked = value },
                    error: err => {}
                })
        }
    }

    toggleLike() : void {
      console.log((this.userId !== null && this.id > 0))
        if (this.userId !== null && this.id > 0) {
            if (this.toggleLikeSub) this.toggleLikeSub.unsubscribe();
            if (this.isLiked) {
                this.toggleLikeSub = this.postService
                  .removeLike({postId: this.id, userId: this.userId})
                  .subscribe({
                    next: value => { this.likeCount--; },
                    error: err => {}
                })
            }
            else {
                this.toggleLikeSub = this.postService
                  .addLike({postId: this.id, userId: this.userId})
                  .subscribe({
                      next: value => { this.likeCount++; },
                      error: err => {}
                })
            }
            this.isLiked = !this.isLiked;
        }
    }
}
