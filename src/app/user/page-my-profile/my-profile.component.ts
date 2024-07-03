import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { Subscription, Timestamp } from "rxjs";
import { Store } from "@ngrx/store";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Router } from "@angular/router";
import { USER_LOGIN } from "../../../Shared/Store/user.action";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PostService } from "../../../Shared/Services/post.service";
import { Post, PostType } from "../../../Shared/Models/post.model";
import { formatDistanceToNow } from 'date-fns';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'my-profile',
    templateUrl: './my-profile.component.html',
    styleUrls: ['../shared-style.css', './my-profile.component.css']
})
export class MyProfileComponent implements OnInit, OnDestroy {
    protected currentUser!: User;
    protected coverPicture: string = 'assets/default-banner.png';
    protected profilePicture: string = 'assets/no-profile-image.png';
    protected friendsCount: number = 0;
    protected posts: Post[] = [];
    protected postFiles: Map<number, string> = new Map<number, string>();
    protected selectedPost: Post | null = null;

    //SUBSCRIPTION for CLOSING
    private userStoreSub!: Subscription;
    private getProfileSub!: Subscription;
    private getCoverSub!: Subscription;
    private getAllPostsSub!: Subscription;
    private getPostFilesSub!: Subscription;

    @ViewChild('postModal') postModal!: TemplateRef<any>;
    @ViewChild('EditDeleteModal') editDeleteModalRef!: TemplateRef<any>;
    @ViewChild('EditPostModal') EditPostModalRef!: TemplateRef<any>;
    private dialogRef!: MatDialogRef<any>;
    private EditPostModaldialogRef!: MatDialogRef<any>;
    protected readonly PostType = PostType;

    //CONSTRUCTOR & LIFE-CYCLE METHODS
    constructor(private userStore: Store<{ UserStore: User }>,
        private userService: UserService,
        private postService: PostService,
        private appService: AppService,
        private dialog: MatDialog,
        private router: Router) { }

    ngOnInit(): void {
        this.userStore.dispatch(USER_LOGIN());
        this.userStoreSub = this.userStore.select('UserStore').subscribe(data => {
            this.currentUser = { ...data }
            if (this.currentUser.id) {
                this.getProfileImage();
                this.getCoverImage();
            }
        });
        this.getAllPostsByUser();
    }

    ngOnDestroy(): void {
        if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
        if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
        if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
        if (this.getAllPostsSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.getPostFilesSub != undefined) this.getAllPostsSub.unsubscribe()
    }

    // LOGIC
    private async getCoverImage(): Promise<void> {
        this.getCoverSub = this.userService.getProfileImage(this.currentUser.id!, ImageType.COVER_IMAGE).subscribe({
            next: (response) => this.coverPicture = 'data:image/png;base64,' + response.image,
            error: (error) => {
                if (error.status !== 400) {
                    this.appService.showError("Could'nt load Cover picture")
                }
            }
        })
    }

    private async getProfileImage(): Promise<void> {
        this.getProfileSub = this.userService.getProfileImage(this.currentUser.id!, ImageType.PROFILE_IMAGE).subscribe({
            next: (response) => {
                this.profilePicture = 'data:image/png;base64,' + response.image
            },
            error: (error) => { 
                if (error.status !== 400) {
                    this.appService.showError("Could'nt load Profile picture")
                }
            }
        })
    }

    async getAllPostsByUser() {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            this.getAllPostsSub = this.postService.getUserPosts(user.id).subscribe({
                next: posts => {
                    this.posts = posts;
                    this.loadPostFiles(posts);
                },
                error: err => {
                    this.appService.showError("Could'nt load posts")
                 }
            })
        }
    }

    async loadPostFiles(postList: Post[]): Promise<void> {
        this.postFiles = await this.postService.getPostFiles(postList);
    }

    getAspectRatio(aspectRatio: number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

    openModal(): void {
        this.dialogRef = this.dialog.open(this.postModal);
    }

    closeModal(): void {
        this.dialogRef.close();
    }

    logout() {
        this.closeModal();
        this.appService.logout();
    }

    playVideo() {

    }

    getWidthClass(aspectRatio: number) {
        if (aspectRatio > 1.5) { return 'width-16-9' }
        else if (aspectRatio < 0.6) { return 'width-9-16' }
        else if (aspectRatio < 1 && aspectRatio >= 0.8) { return 'width-4-5' }
        else return 'width-1-1';
    }

    editDeleteModal(post: Post) {
        this.selectedPost = post;
        this.dialogRef = this.dialog.open(this.editDeleteModalRef);
    }

    editPostModal() {
        this.EditPostModaldialogRef = this.dialog.open(this.EditPostModalRef);
    }

    closeEditPostModal() {
        this.EditPostModaldialogRef.close();
        this.selectedPost = null;
    }

    editpost() {
        if (this.selectedPost !== null) {
            this.editPostModal()
            this.closeModal();
        }
    }

    deletePost() {
        if (this.selectedPost !== null) {

        }
    }

    async update(): Promise<void> {
        if (this.selectedPost) {
            this.selectedPost.description = this.selectedPost.description.trim();
            this.postService.updatePost(this.selectedPost).subscribe({
                next: res => { this.closeEditPostModal(); },
                error: err => { console.log(err) }
            })
        }
    }

    protected getRelativeTime(createdOn: Timestamp<string>): string {
        const parsedDate = new Date(createdOn.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
}