import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, Timestamp } from 'rxjs';
import { PostFilter, TimeFilter, PostTypeFilter } from 'src/Shared/Models/filter.model';
import { Post, PostType } from 'src/Shared/Models/post.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PostFile, PostService } from 'src/Shared/Services/post.service';

@Component({
    selector: 'app-post-management',
    templateUrl: './manage-posts.component.html',
    styleUrls: ['./manage-posts.component.css', '../shared-style.css'],
    animations: [
        trigger('slideDownAnimation', [
            state('void', style({
                height: '0',
                opacity: 0,
            })),
            transition('void <=> *', [
                animate('300ms ease-in-out', style({
                    height: '*',
                    opacity: 1,
                }))
            ])
        ])
    ]
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
        this.resetFilter();
        this.loadPostList().then();
    }

    ngOnDestroy(): void {
        if (this.loadPostListSub) this.loadPostListSub.unsubscribe();
        if (this.searchSub) this.searchSub.unsubscribe();
    }

    protected async loadPostList(): Promise<void> {
        if (this.postFilter.postFile === PostTypeFilter.ALL && this.postFilter.dateFilter === TimeFilter.ALL) {
            this.loadPostListHelper();
        }
        else {
            this.applyFilters().then();
        }
    }

    private loadPostListHelper(): void {
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

    // Pagination Related

    protected get getPageNo(): number {
        if (this.postFilter.postFile === PostTypeFilter.ALL && this.postFilter.dateFilter === TimeFilter.ALL) {
            return this.pageNo + 1;
        }
        else {
            return this.postFilter.pageNo + 1;
        }
    }

    protected isFirst(): boolean {
        if (this.postFilter.postFile === PostTypeFilter.ALL && this.postFilter.dateFilter === TimeFilter.ALL) {
            return this.pageNo <= 0;
        }
        else {
            return this.postFilter.pageNo <= 0;
        }
    }

    protected decrPageNo() :void {
        if (this.postFilter.postFile === PostTypeFilter.ALL && this.postFilter.dateFilter === TimeFilter.ALL) {
            this.pageNo = this.pageNo - 1;
        }
        else {
            this.postFilter.pageNo = this.postFilter.pageNo -1;
        }
        this.loadPostList().then();
    }

    protected incrPageNo() :void {
        if (this.postFilter.postFile === PostTypeFilter.ALL && this.postFilter.dateFilter === TimeFilter.ALL) {
            this.pageNo = this.pageNo + 1;
        }
        else {
            this.postFilter.pageNo = this.postFilter.pageNo +1;
        }
        this.loadPostList().then();
    }

    //Filter Related
    protected showFilterDiv: boolean =false;
    protected postFilter!: PostFilter;
    protected readonly TimeFilter = TimeFilter;
    protected readonly PostTypeFilter = PostTypeFilter;
    protected isCustomDateSelected = false;
    protected startDate: string = '';
    protected endDate: string = '';
    protected maxDate: string = '';
    private filterSub!: Subscription;

    protected resetFilter(): void {
        this.postFilter = { postFile: PostTypeFilter.ALL, dateFilter: TimeFilter.ALL, pageNo: 0, pageSize: 10 };
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        this.startDate = formattedDate;
        this.endDate = formattedDate;
        this.maxDate = formattedDate;
        this.isCustomDateSelected = false;
    }

    protected onDateFilterChange(filterValue: TimeFilter): void {
        this.postFilter.dateFilter = filterValue;
        this.isCustomDateSelected = filterValue === TimeFilter.CUSTOM_DATE;
    
        const today = new Date();
        if (filterValue === TimeFilter.TODAY) {
            this.startDate = today.toISOString();
            this.endDate = today.toISOString();
        }
        else if (filterValue === TimeFilter.THIS_WEEK) {
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            this.startDate = startOfWeek.toISOString();
            this.endDate = new Date().toISOString();
        }
        else if (filterValue === TimeFilter.THIS_MONTH) {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            this.startDate = startOfMonth.toISOString();
            this.endDate = new Date().toISOString();
        }
        else if (filterValue === TimeFilter.THIS_YEAR) {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            this.startDate = startOfYear.toISOString();
            this.endDate = new Date().toISOString();
        }
    }

    protected onPostTypeFilterChange(filterValue: PostTypeFilter): void {
        this.postFilter.postFile = filterValue;
    }

    protected onDateChange(): void {
        if (this.startDate > this.endDate) {
          this.endDate = this.startDate;
        }
    }

    protected async applyFilters(): Promise<void> {
        if (this.startDate && this.endDate) {
            this.postFilter.startingDate = new Date(this.startDate);
            this.postFilter.endingDate = new Date(this.endDate);
        }
        if (this.filterSub) this.filterSub.unsubscribe();
        this.filterSub = this.postService.filter(this.postFilter).subscribe({
            next: res => {
                this.postList = res.contents;
                this.isLast = res.isLast;
                this.totalPages = res.totalPages;
                if (this.isSearchResultShowing) this.isSearchResultShowing = false;
                this.loadPostFiles(res.contents).then();
            },
            error: err => {

            }
        })
    }
}