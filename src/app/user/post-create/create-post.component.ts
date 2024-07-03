import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from "@ngrx/store";
import { User } from "../../../Shared/Models/user.model";
import { USER_LOGIN } from "../../../Shared/Store/user.action";
import { Subscription } from "rxjs";
import { PostCreation, PostType } from "../../../Shared/Models/post.model";
import { PostService } from "../../../Shared/Services/post.service";
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'create-post',
    templateUrl: './create-post.component.html',
    styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit, OnDestroy {
    @Output() showModal = new EventEmitter<Event>();
    @Input() file: File | undefined;
    @Input() previewImg: string| undefined;
    @Input() aspectRatio!: number;
    protected previewVideo: string | ArrayBuffer | null = null;
    protected showCreateNewPostDivInSmallerDisplay: boolean = false;
    protected description: string = '';
    private imageChangedEvent!: Event | undefined;
    private currentUser!: User;
    private userStoreSub!: Subscription;
    private postServiceSub!: Subscription;

    constructor(private postService: PostService,
        private cdRef: ChangeDetectorRef,
        private appService: AppService,
        private userStore: Store<{ UserStore: User }>,) { }

    ngOnInit(): void {
        this.userStore.dispatch(USER_LOGIN());
        this.userStoreSub = this.userStore.select('UserStore').subscribe(
            user => this.currentUser = { ...user }
        );
    }

    ngOnDestroy() {
        this.userStoreSub.unsubscribe();
        if (this.postServiceSub) this.postServiceSub.unsubscribe();
    }

    protected triggerImageUpload(): void {
        this.file = undefined;
        this.previewVideo = '';
        this.previewImg = '';
        const fileInput = document.getElementById('imageInput') as HTMLInputElement;
        if (fileInput) { fileInput.click(); }
    }

    protected onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.imageChangedEvent = event;
            this.showModal.emit(this.imageChangedEvent);
        }
    }

    protected triggerVideoUpload() {
        this.file = undefined;
        this.previewVideo = '';
        this.previewImg = '';
        const fileInput = document.getElementById('videoInput') as HTMLInputElement;
        if (fileInput) { fileInput.click(); }
    }

    protected onVideoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files ? input.files[0] : null;

        if (file && file.type.startsWith('video/')) {
            if (file.size > 200 * 1024 * 1024) {
                this.appService.showError('File size exceeds the limit of 200MB.');
                return;
            }
            this.file = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (result !== undefined) {
                    this.previewVideo = result;
                    this.getVideoMetadata(file);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    private getVideoMetadata(file: File) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
            let calculatedAspectRatio = parseFloat((video.videoWidth / video.videoHeight).toFixed(4));
            if (Math.abs(calculatedAspectRatio - 0.5625) < 0.0001) {
                this.aspectRatio = 0.5625;
            }
        };
        video.src = URL.createObjectURL(file);
    }



    protected async post(): Promise<void> {
        if (this.file)
            this.postFileIncludedPost(this.file);
        else  {
            if (this.description === '') {
                this.appService.showWarn("Post Should have either a Media File or Text")
            }
            else if (this.description !== '') {
                this.postTextBasedPost();
            }
        }
    }

    private async postTextBasedPost(): Promise<void> {
        let postCreation = this.getPostCreationObj(PostType.TEXT_ONLY, 0);
        this.postServiceSub = this.postService.createTextOnlyPost(postCreation).subscribe({
            next: () => { this.clear(true); },
            error: error => { this.appService.showError("Something Went wrong") }
        });
    }

    private async postFileIncludedPost(file: File): Promise<void> {
        let postCreation!: PostCreation;
        if (file.type.startsWith('image/')) {
            postCreation = this.getPostCreationObj(PostType.IMAGE, this.aspectRatio);
        }
        else if (file.type.startsWith('video/')) {
            const aspectRatio = await this.getVideoAspectRatio(file);
            postCreation = this.getPostCreationObj(PostType.VIDEO, aspectRatio);
        }
        else {
            this.appService.showError("Invalid File type")
            this.clear(false);
            return;
        }

        this.postServiceSub = this.postService.createPost(file, postCreation).subscribe({
            next: () => { this.clear(true); },
            error: error => { this.appService.showError("Something Went wrong") }
        });
    }

    private getPostCreationObj(type: PostType, aspectRatio: number): PostCreation {
        const description = (this.description) ? this.description.trim() : '';
        const userid = this.currentUser.id!;
        return {
            userId: userid,
            description: description,
            postType: type,
            aspectRatio: aspectRatio
        }
    }

    private async getVideoAspectRatio(file: File): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                video.onloadedmetadata = null;
                const aspectRatio = video.videoWidth / video.videoHeight;
                URL.revokeObjectURL(video.src);
                resolve(aspectRatio); // Resolve the promise with aspectRatio
            };
            video.onerror = reject; // Handle errors if any
            video.src = URL.createObjectURL(file);
        });
    }

    protected clear(isPosted: boolean): void {
        this.file = undefined;
        this.description = '';
        this.previewVideo = null;
        this.previewImg = undefined;
        this.aspectRatio = 0;
        this.imageChangedEvent = undefined;
        if (isPosted) { this.appService.showSuccess("Posted Successfully!"); }
        this.cdRef.detectChanges();
    }
}
