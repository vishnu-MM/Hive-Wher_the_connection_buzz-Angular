import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Post, PostType} from "../../../Shared/Models/post.model";
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {User} from "../../../Shared/Models/user.model";
import {formatDistanceToNow} from "date-fns";
import {Router} from "@angular/router";

@Component({
	selector: 'single-post',
	templateUrl: './single-post.component.html',
	styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent implements AfterViewInit, OnInit, OnDestroy {
	@Input("post") post!: Post;
	user!: User;
	name: string = '';
	username: string = '';
	postFile: string = '';
	profilePicture: string = '';
	aspectRatioClass: string = '';
	@ViewChild('postImageElement') postImageElement!: ElementRef<HTMLImageElement>;
	@ViewChild('postVideoElement', {static: false}) postVideoElement!: ElementRef<HTMLVideoElement>;
	getProfileSub!: Subscription;
	postServiceSub!: Subscription;
	readonly PostType = PostType;

	constructor(private postService: PostService, 
                private userService: UserService, 
                private router: Router) {}

	ngOnInit(): void {
		if (this.post) {
            this.getUserByPost();
			if (!(this.post.postType === PostType.TEXT_ONLY))
				this.loadPostFile(this.post).then();
		}
	}

	ngOnDestroy(): void {
		if (this.postServiceSub) this.postServiceSub.unsubscribe();
		if (this.getProfileSub) this.getProfileSub.unsubscribe();
	}

	ngAfterViewInit(): void {
		if (this.postVideoElement) {
			this.respondToVisibility(this.postVideoElement.nativeElement, (isVisible) => {
				if (!this.postVideoElement.nativeElement.paused && !isVisible) this.pauseVideo();
			});
		}
	}

    async loadPostFile(post: Post): Promise<void> {
        this.postFile = await this.postService.getPostFile(post.id);
    }

    getAspectRatio(aspectRatio : number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

	async getUserByPost(): Promise<void> {
		this.userService.getProfileById(this.post.userId).subscribe({
				next: (response) => {
					this.name = response.name;
					this.username = response.username;
					this.user = response;
				},
				error: (error) => {
				}
			})
		this.profilePicture = "assets/LoginSignUpBg.jpg"
		this.getProfileSub = this.userService
			.getProfileImage(this.post.userId, ImageType.PROFILE_IMAGE)
			.subscribe({
				next: (response) => this.profilePicture = 'data:image/png;base64,' + response.image,
				error: (error) => {
				}
			})
	}

	get getRelativeTime(): string {
		const parsedDate = new Date(this.post.createdOn.toString());
		return formatDistanceToNow(parsedDate, {addSuffix: true});
	}

	playVideo(): void {
		if (this.postVideoElement && this.postVideoElement.nativeElement)
			this.postVideoElement.nativeElement.play();
	}

	pauseVideo(): void {
		if (this.postVideoElement && this.postVideoElement.nativeElement)
			this.postVideoElement.nativeElement.pause();
	}

	respondToVisibility(element: HTMLElement, callback: (isVisible: boolean) => void): void {
		const options = {root: document.documentElement};

		const observer = new IntersectionObserver((entries, observer) => {
			entries.forEach(entry => callback(entry.intersectionRatio > 0) );
		}, options);

		observer.observe(element);
	}


	navigateTo(id: number) {
		this.router.navigate([`/u/post`, id]);
	}

	navigateToUser() {
		if (this.user) this.router.navigate(['/u/user', this.user.id]);
	}
}
