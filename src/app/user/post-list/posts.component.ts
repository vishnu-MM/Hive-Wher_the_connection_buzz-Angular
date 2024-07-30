import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PostService } from "../../../Shared/Services/post.service";
import { Post, PostPage } from "../../../Shared/Models/post.model";
import { AppService } from 'src/Shared/Services/app.service';
import { UserResponse } from 'src/Shared/Models/user.model';
import { Subscription } from "rxjs";

@Component({ selector: 'posts', templateUrl: './posts.component.html', styleUrls: ['./posts.component.css'] })
export class PostsComponent implements OnInit {
    protected randomPosts: Post[] = [];
    protected friendsPosts: Post[] = [];
    protected loading: boolean = false;
    private intersectionObserver?: IntersectionObserver;
    private postPage!: PostPage;
    protected isLast: boolean = false;
    private pageNo: number = 0;
    private pageSize: number = 10;
    protected userStoreSub!: Subscription;
    protected eventSubScription!: Subscription;

    @ViewChild('observerTarget', { static: true }) observerTarget!: ElementRef;

    constructor(private postService: PostService, private appService: AppService) { }

    ngOnInit(): void {
        this.loadPosts().then();
        this.intersectionObserverConfig().then();
        this.observeForNewPost().then();
    }

    private async intersectionObserverConfig(): Promise<void> {
        this.intersectionObserver = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                if (this.isLast) { this.loadPosts(); }
                else { this.loadUserSpecificPosts(); }            
            }
        });

        this.intersectionObserver.observe(this.observerTarget.nativeElement);
    }

    private async observeForNewPost(): Promise<void> {
        this.eventSubScription = this.postService.event$.subscribe(message => {
            if (message !== 'INCR' && message !== 'DECR') {
                const newPost: Post = JSON.parse(message);
                this.friendsPosts.unshift(newPost);
            }
        })
    }

    private async loadUserSpecificPosts(): Promise<void> {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (!userStr) {
            this.appService.showWarn("Could'nt load posts from your friends");
            return;
        }
        const user: UserResponse = JSON.parse(userStr);
        this.postService.getPostForUsers(user.id, this.pageNo, this.pageSize).subscribe({
            next: res => {
                this.isLast = res.isLast;
                this.friendsPosts.push(...res.contents);
                this.postPage = res;
                this.pageNo++;
            },
            error: err => {
                this.appService.showError(`Could'nt load Posts from your friends (${err.status})`)
            }
        });
    }

    protected async loadPosts(): Promise<void> {
        if (this.loading) return;

        this.loading = true;
        this.userStoreSub = this.postService.getRandomPosts().subscribe({
            next: data => {
                this.randomPosts.push(...data);
                this.loading = false;
            },
            error: err => {
                this.loading = false;
                this.appService.showError(`Could'nt load Posts (${err.status})`)
            }
        });
    }

    ngOnDestroy(): void {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();        
        if (this.userStoreSub) this.userStoreSub.unsubscribe();        
        if (this.eventSubScription) this.eventSubScription.unsubscribe();        
    }
}