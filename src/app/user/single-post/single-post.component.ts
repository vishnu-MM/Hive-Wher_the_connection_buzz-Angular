import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Post, PostType } from "../../../Shared/Models/post.model";
import { PostService } from "../../../Shared/Services/post.service";
import { Subscription } from "rxjs";
import { UserData, UserService } from "../../../Shared/Services/user.service";
import { User } from "../../../Shared/Models/user.model";
import { formatDistanceToNow } from "date-fns";
import { Router } from "@angular/router";

@Component({
    selector: 'single-post',
    templateUrl: './single-post.component.html',
    styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent implements AfterViewInit, OnInit, OnDestroy {
    @Input("post") post!: Post;
    protected user!: User;
    protected name: string = '';
    protected username: string = '';
    protected postFile: string = '';
    protected profilePicture: string = 'assets/no-profile-image.png';
    protected aspectRatioClass: string = '';
    protected readonly PostType = PostType;

    @ViewChild('postVideoElement', { static: false })
    private postVideoElement!: ElementRef<HTMLVideoElement>;
    private postServiceSub!: Subscription;

    constructor(private postService: PostService,
        private userService: UserService,
        private router: Router) { }

    ngOnInit(): void {
        if (!this.post) { return; }
        this.getUser(this.post.userId).then();
        if (this.post.postType !== PostType.TEXT_ONLY)
            this.loadPostFile(this.post).then();
    }

    ngOnDestroy(): void {
        if (this.postServiceSub) this.postServiceSub.unsubscribe();
    }

    ngAfterViewInit(): void {
        if (!this.postVideoElement) { return; }
        this.respondToVisibility(this.postVideoElement.nativeElement, (isVisible) => {
            if (!this.postVideoElement.nativeElement.paused && !isVisible) { this.pauseVideo(); }
        });
    }

    private async getUser(userId: number): Promise<void> {
        this.userService.getUserProfile(userId)
            .then((user: UserData) => {
                this.name = user.user.name;
                this.username = '@' + user.user.username;
                this.user = user.user;
                this.profilePicture = user.profileImg;
            })
            .catch((error: any) => { console.log(error); })
    }

    private async loadPostFile(post: Post): Promise<void> {
        this.postService.getPostFile(post.id)
        .then((res: string) => { this.postFile = res })
        .catch((err: any) => { console.log(err); })
    }

    protected getAspectRatio(aspectRatio: number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

    protected get getRelativeTime(): string {
        const parsedDate = new Date(this.post.createdOn.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }

    protected playVideo(): void {
        if (this.postVideoElement && this.postVideoElement.nativeElement) 
            this.postVideoElement.nativeElement.play();
    }

    protected pauseVideo(): void {
        if (this.postVideoElement && this.postVideoElement.nativeElement)
            this.postVideoElement.nativeElement.pause();
    }

    private respondToVisibility(element: HTMLElement, callback: (isVisible: boolean) => void): void {
        const options = { root: document.documentElement };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => callback(entry.intersectionRatio > 0));
        }, options);

        observer.observe(element);
    }


    protected navigateTo(id: number): void {
        this.router.navigate([`/u/post`, id]);
    }

    protected navigateToUser(): void {
        if (this.user) this.router.navigate(['/u/user', this.user.id]);
    }
}
