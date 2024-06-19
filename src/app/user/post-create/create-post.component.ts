import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from "@ngrx/store";
import { User } from "../../../Shared/Models/user.model";
import { USER_LOGIN } from "../../../Shared/Store/user.action";
import { Subscription } from "rxjs";
import { PostCreation, PostType } from "../../../Shared/Models/post.model";
import { PostService } from "../../../Shared/Services/post.service";
import { NgToastService } from 'ng-angular-popup';

@Component({
    selector: 'create-post',
    templateUrl: './create-post.component.html',
    styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit, OnDestroy {
    imageChangedEvent!: Event;
    @Output() showModal = new EventEmitter<Event>();
    @Input() file: File | undefined;
    @Input() previewImg!: string;
    @Input() aspectRatio!: number;
    description: string = '';
    userStoreSub!: Subscription;
    currentUser!: User;
    postServiceSub!: Subscription;
    previewVideo: string | ArrayBuffer | null = null;

    constructor(private userStore: Store<{ UserStore: User }>,
        private postService: PostService, private toast: NgToastService) { }

    ngOnInit(): void {
        this.userStore.dispatch(USER_LOGIN());
        this.userStoreSub = this.userStore
            .select('UserStore')
            .subscribe(data => this.currentUser = { ...data });
    }

    ngOnDestroy() {
        this.userStoreSub.unsubscribe();
        if (this.postServiceSub) this.postServiceSub.unsubscribe();
    }

    triggerImageUpload(): void {
        this.file = undefined;
        this.previewVideo = '';
        this.previewImg = '';
        const fileInput = document.getElementById('imageInput') as HTMLInputElement;
        if (fileInput) { fileInput.click(); }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.imageChangedEvent = event;
            this.showModal.emit(this.imageChangedEvent);
        }
    }

    post(): void {
        if (this.file) {
            if (this.file.type.startsWith('image/')) {
                let postCreation: PostCreation = {
                    description: (this.description) ? this.description.trim() : '',
                    postType: PostType.IMAGE,
                    userId: this.currentUser.id!,
                    aspectRatio: this.aspectRatio
                }
                this.postServiceSub = this.postService
                    .createPost(this.file, postCreation)
                    .subscribe({
                        next: value => {
                            this.file = undefined;
                            this.description = '';
                            this.previewImg = '';
                            this.showSuccess("Posted Successfully!");
                        },
                        error: error => { this.showError("Something Went wrong") }
                    });
            }
            else if (this.file.type.startsWith('video/')) {

                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    video.onloadedmetadata = null;
                    this.aspectRatio = video.videoWidth / video.videoHeight;            
                    URL.revokeObjectURL(video.src);
                };
                video.src = URL.createObjectURL(this.file);

                let postCreation: PostCreation = {
                    description: this.description.trim(),
                    postType: PostType.VIDEO,
                    userId: this.currentUser.id!,
                    aspectRatio: this.aspectRatio
                }

                this.postServiceSub = this.postService.createPost(this.file, postCreation)
                    .subscribe({
                        next: value => {
                            this.file = undefined;
                            this.description = '';
                            this.previewVideo = '';
                            this.showSuccess("Posted Successfully!");
                        },
                        error: error => { this.showError("Something Went wrong") }
                    });
            }
        }
        else {
            let postCreation: PostCreation = {
                description: this.description.trim(),
                postType: PostType.TEXT_ONLY,
                userId: this.currentUser.id!,
                aspectRatio: 0
            }
        }
    }

    triggerVideoUpload() {
        this.file = undefined;
        this.previewVideo = '';
        this.previewImg = '';
        const fileInput = document.getElementById('videoInput') as HTMLInputElement;
        if (fileInput) { fileInput.click(); }
    }

    onVideoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files ? input.files[0] : null;

        if (file && file.type.startsWith('video/')) {
            if (file.size > 200 * 1024 * 1024) {
                this.showError('File size exceeds the limit of 200MB.');
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

    getVideoMetadata(file: File) {
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

    showSuccess(summary: string) {
        this.toast.success({ detail: "SUCCESS", summary: summary, duration: 5000 });
    }

    showError(summary: string) {
        this.toast.error({ detail: "ERROR", summary: summary, duration: 5000 });
    }

    showInfo(summary: string) {
        // this.toast.info({detail:"INFO", summary: summary, sticky:true});
        this.toast.info({ detail: "INFO", summary: summary, duration: 5000 });
    }

    showWarn(summary: string) {
        this.toast.warning({ detail: "WARN", summary: summary, duration: 5000 });
    }
}
