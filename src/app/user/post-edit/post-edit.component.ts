import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Post, PostType } from "../../../Shared/Models/post.model";
import { PostService } from "../../../Shared/Services/post.service";
import { Subscription } from "rxjs";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { User } from "../../../Shared/Models/user.model";
import { formatDistanceToNow } from "date-fns";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: 'post-edit',
	templateUrl: './post-edit.component.html',
	styleUrls: ['./post-edit.component.css']
})
export class PostEditComponent {
	@Input() postId!: number;
  @Output() close = new EventEmitter<void>();
	post!: Post;
	postImage: string = '';
	postVideo: string = '';
	aspectRatioClass: string = '';
	@ViewChild('postImageElement') postImageElement!: ElementRef<HTMLImageElement>;
	@ViewChild('postVideoElement', { static: false }) postVideoElement!: ElementRef<HTMLVideoElement>;
	postServiceSub!: Subscription;
	readonly PostType = PostType;

	constructor(private postService: PostService, private router: Router) { }

	ngOnInit(): void {
		this.loadPost(this.postId).then();
	}

	ngAfterViewInit(): void {
		if (this.postImageElement) {
			const imgElement = this.postImageElement.nativeElement;
			imgElement.onload = () => {
				const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
				this.calculateAspectRatioClass(aspectRatio);
			};
		}

		if (this.postVideoElement) {
			this.respondToVisibility(this.postVideoElement.nativeElement, (isVisible) => {
				if (!this.postVideoElement.nativeElement.paused && !isVisible) this.pauseVideo();
			});
		}
	}

	ngOnDestroy(): void {
		if (this.postServiceSub) this.postServiceSub.unsubscribe();
	}

	async loadPost(postId: number): Promise<void> {
		this.postService.getPost(postId)
			.subscribe({
				next: res => {
					this.post = res;
					if (this.post && this.post.postType === PostType.IMAGE)
						this.getPostImage();
					if (this.post && this.post.postType === PostType.VIDEO)
						this.getPostVideo();
				},
				error: err => { }
			})
	}


	private calculateAspectRatioClass(aspectRatio: number): void {
		if (aspectRatio > 1.5)
			this.aspectRatioClass = 'aspect-ratio-16-9';
		else if (aspectRatio < 0.6)
			this.aspectRatioClass = 'aspect-ratio-9-16';
		else if (aspectRatio < 1 && aspectRatio >= 0.8)
			this.aspectRatioClass = 'aspect-ratio-4-5';
		else
			this.aspectRatioClass = 'aspect-ratio-1-1';

	}

	async getPostImage() {
		this.postServiceSub = this.postService
			.getImage(this.post.id)
			.subscribe({
				next: (blob) => {
					const reader = new FileReader();
					reader.onload = (event: any) => {
						this.postImage = event.target.result;
					};
					reader.readAsDataURL(blob);
				},
				error: (error) => console.error('Image loading failed', error)

			});
	}

	async getPostVideo() {
		this.postServiceSub = this.postService
			.getImage(this.post.id)
			.subscribe({
				next: (blob) => {
					const videoUrl = URL.createObjectURL(blob);
					this.postVideo = videoUrl;
					this.setAspectRatio(blob);
				},
				error: (error) => {
					console.error('Image loading failed', error);
				}
			});
	}

	setAspectRatio(blob: Blob): void {
		const video = document.createElement('video');
		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			const aspectRatio = parseFloat((video.videoWidth / video.videoHeight).toFixed(4));
			this.aspectRatioClass = this.getAspectRatioClass(aspectRatio);
			URL.revokeObjectURL(video.src);
		};
		video.src = URL.createObjectURL(blob);
	}

	getAspectRatioClass(aspectRatio: number): string {
		if (Math.abs(aspectRatio - 0.5625) < 0.0001)
			return 'aspect-ratio-9-16';
		else if (Math.abs(aspectRatio - 16 / 9) < 0.0001)
			return 'aspect-ratio-16-9';
		else
			return 'aspect-ratio-16-9';
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
		const options = { root: document.documentElement };

		const observer = new IntersectionObserver((entries, observer) => {
			entries.forEach(entry => {
				callback(entry.intersectionRatio > 0);
			});
		}, options);

		observer.observe(element);
	}

  cancelUpdate() {
    this.close.emit();
  }

  update() {
    this.postService.updatePost(this.post)
    .subscribe({
      next: res => {this.close.emit();},
      error: err => {}
    })
  }
}