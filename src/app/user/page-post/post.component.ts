import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommentDTO, CommentRequestDTO, Post } from "../../../Shared/Models/post.model";
import { PostService } from "../../../Shared/Services/post.service";
import { Subscription } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { UserResponse } from "../../../Shared/Models/user.model";

@Component({
    selector: 'post-view',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit, OnDestroy {
    protected post!: Post;
    protected postId: number = 0;
    protected userId: number = 0;
    protected commentTxt: string = '';
    protected tryingToPost: boolean = false;
    protected clicked: boolean = false;
    protected comments: CommentDTO[] = [];
    private setPostSub!: Subscription;
    private postCommentSub!: Subscription;
    private getAllCommentsSub!: Subscription;

    constructor(private postService: PostService, private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.postId = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            this.userId = user.id
        }
        this.setPost(this.postId);
        this.getAllComments();
    }

    ngOnDestroy(): void {
        if (this.setPostSub) this.setPostSub.unsubscribe();
        if (this.postCommentSub) this.postCommentSub.unsubscribe();
        if (this.getAllCommentsSub) this.getAllCommentsSub.unsubscribe();
    }

    async setPost(postId: number): Promise<void> {
        this.setPostSub = this.postService.getPost(postId)
            .subscribe({
                next: value => this.post = value,
                error: err => { }
            })
    }

    protected async postComment(): Promise<void> {
        this.commentTxt = this.commentTxt.trim()
        this.clicked = true;
        if (this.commentTxt === '' || this.userId === 0 || this.postId === 0) {
            return;
        }
        
        this.tryingToPost = true;
        const comment: CommentRequestDTO = { comment: this.commentTxt, postId: this.postId, userId: this.userId }
        this.postCommentSub = this.postService.createComment(comment).subscribe({
            next: value => {
                console.log(value)
                this.comments.unshift(value);
                this.tryingToPost = false;
                this.clicked = false;
                this.commentTxt = '';
            },
            error: err => {
                this.tryingToPost = false;
                this.clicked = false;
                this.commentTxt = '';
            }
        });        
    }

    async getAllComments(): Promise<void> {
        this.getAllCommentsSub = this.postService.getCommentsForPost(this.postId)
            .subscribe({
                next: value => {
                    this.comments = value;
                },
                error: err => { }
            })
    }
}
