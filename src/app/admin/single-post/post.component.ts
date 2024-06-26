import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDistanceToNow } from 'date-fns';
import { Subscription, Timestamp } from 'rxjs';
import { CommentDTO, Like, Post } from 'src/Shared/Models/post.model';
import { PostFile, PostService } from 'src/Shared/Services/post.service';

enum LodingData { POST, LIKE, COMMENT, POST_FILE }

@Component({
  selector: 'post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css', '../shared-style.css']
})
export class PostComponent implements OnInit, OnDestroy {
    post!: Post;
    postFile: string = '';
    likeCount: number = 0;
    commentCount: number = 0;
    commentList: CommentDTO[] = [];
    likeList: Like[] = [];
    showLike: boolean = false;
    protected readonly LodingData = LodingData;
    
    private postSub!: Subscription; 
    private postFileSub!: Subscription;
    private commentListSub!: Subscription;
    private likeListSub!: Subscription;
    
    constructor(private service: PostService, 
                private router: Router, 
                private route: ActivatedRoute) {}

    ngOnInit(): void {
        const postId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        if (postId) {
            this.loadPost(postId).then();
        }
        else {
            this.router.navigate(['/a/users']).then();
        }
    }

    ngOnDestroy(): void {
        if (this.postSub) this.postSub.unsubscribe(); 
        if (this.commentListSub) this.commentListSub.unsubscribe();
        if (this.likeListSub) this.likeListSub.unsubscribe(); 
    }

    async loadPost(postId: number): Promise<void> {
        this.postSub = this.service.getPost(postId).subscribe({
            next: res => {
                if(res) {
                    this.post = res;
                    this.loadPostFile(res).then();
                    this.loadCommenList(postId).then();
                    this.loadLikeList(postId).then();
                }
            },
            error: err => {
                console.log(err);
            }
        })
    }

    async loadPostFile(post: Post): Promise<void> {
        this.postFile = await this.service.getPostFile(post.id);
    }

    getAspectRatio(aspectRatio : number): string {
        return this.service.getAspectRatio(aspectRatio);
    }
    
    async loadCommenList(postId: number): Promise<void> {
        this.commentListSub = this.service.getCommentsForPost(postId).subscribe({
            next: res => {
                this.commentCount = res.length;
                this.commentList = res;
            },
            error: err => {
                console.log(err);
            }
        })
    }

    async loadLikeList(postId: number): Promise<void> {
        this.likeListSub = this.service.getLikesForPost(postId).subscribe({
            next: res => {
                this.likeCount = res.length;
                this.likeList = res;
            },
            error: err => { 
                console.log(err);
            }
        })
    }

    isLoading(lodingData: LodingData): boolean {
        if (lodingData === LodingData.POST) {
            return true
        }
        else if (lodingData === LodingData.POST_FILE) {
            return true
        }
        else if (lodingData === LodingData.LIKE) {
            return true
        }
        else if (lodingData === LodingData.COMMENT) {
            return true
        }
        return false;
    }

    getPostDate(createdOn: Timestamp<string>) : Date {
        return new Date(createdOn.toString());
    }

    getRelativeTime(commentedDate: Timestamp<string>): string {
        const parsedDate = new Date(commentedDate.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
}
