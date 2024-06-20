import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Timestamp } from 'rxjs';
import { Post, PostType } from 'src/Shared/Models/post.model';
import { PostFile, PostService } from 'src/Shared/Services/post.service';

@Component({
    selector: 'app-post-management',
    templateUrl: './manage-posts.component.html',
    styleUrls: ['./manage-posts.component.css', '../shared-style.css']
})
export class ManagePostsComponent implements OnInit, OnDestroy {
    postList: Post[] = [];
    pageNo: number = 0;
    pageSize: number = 10;
    totalPages: number = 0;
    isLast: boolean = true;
    isSearchResultShowing: boolean = false;
    postFiles: Map<number, string> = new Map<number, string>();
    private loadPostListSub!: Subscription;
    private searchSub!: Subscription;

    constructor(private postService: PostService, private router: Router) {}

    ngOnInit(): void {
        this.loadPostList().then();
    }

    ngOnDestroy(): void {
        if (this.loadPostListSub) this.loadPostListSub.unsubscribe();
        if (this.searchSub) this.searchSub.unsubscribe();
    }

    async loadPostList(): Promise<void> {
        this.loadPostListSub = this.postService.getAllPosts(this.pageNo, this.pageSize)
            .subscribe({
                next: res => {
                    this.postList = res.contents;
                    this.isLast = res.isLast;
                    this.totalPages = res.totalPages;
                    if (this.isSearchResultShowing) this.isSearchResultShowing = false;
                    this.loadPostFiles(res.contents).then();
                },
                error: err => {}
            })
    }

	async loadPostFiles(postList: Post[]): Promise<void> {
        this.postFiles = await this.postService.getPostFiles(postList);
	}

    getAspectRatio(aspectRatio : number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

    search(searchQuery: string) {
        if (this.searchSub) this.searchSub.unsubscribe();
        this.searchSub = this.postService.search(searchQuery).subscribe({
            next: res => {
                this.isSearchResultShowing = true;
                this.postList = res;
                this.isLast = true;
                this.totalPages = 1;
                this.loadPostFiles(res).then();
            },
            error: err => {}
        })
    }

    getPostDate(createdOn: Timestamp<string>) : Date {
        return new Date(createdOn.toString());
    }

    redireactTo(postId: number) {
        this.router.navigate(['/a/posts/post',postId])
    }
}