import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { Post, PostType } from "../../../Shared/Models/post.model";
import { Subscription } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngrx/store";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { PostService } from "../../../Shared/Services/post.service";
import { ActivatedRoute, Router } from "@angular/router";
import { USER_LOGIN } from "../../../Shared/Store/user.action";
import { ComplaintsDTO } from 'src/Shared/Models/complaints.model';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    user!: User;
    coverPicture: string = '';
    profilePicture: string = '';
    friendsCount: number = 0;
    posts: Post[] = [];
    protected readonly PostType = PostType;
    postFiles: Map<number, string> = new Map<number, string>();
    aspectRatio: Map<number, string> = new Map<number, string>();
    showListView: boolean = true;
    isFriends: boolean = false;
    isValidReason: boolean = false;
    description: string = '';


    //SUBSCRIPTION for CLOSING
    private getUserSub!: Subscription;
    private getProfileSub!: Subscription;
    private getCoverSub!: Subscription;
    private getAllPostsSub!: Subscription;
    private getPostFileSub!: Subscription;
    private ReportUserSub!: Subscription;
    @ViewChild('reportModal') postModal!: TemplateRef<any>;
    private dialogRef!: MatDialogRef<any>;

    //CONSTRUCTOR & LIFE-CYCLE METHODS
    constructor(private userService: UserService,
                private postService: PostService,
                private dialog: MatDialog,
                private router: Router,
                private route: ActivatedRoute) {}

    ngOnInit(): void {
        const userId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        if (userId) {
            this.getUserSub = this.userService.getProfileById(userId)
                .subscribe({
                    next: value => {
                        this.user = value
                        console.log(this.user)
                        if (this.user && this.user.id) {
                            this.getProfileImage(this.user.id).then();
                            this.getCoverImage(this.user.id).then();
                            this.getAllPostsByUser(this.user.id).then();
                        }
                    },
                    error: err => {
                        console.log(err)
                    }
                })
        }
        else {
            this.router.navigate(['/u/home']).then();
        }
    }

    ngOnDestroy(): void {
        if (this.getUserSub != undefined) this.getUserSub.unsubscribe()
        if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
        if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
        if (this.getAllPostsSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.ReportUserSub != undefined) this.ReportUserSub.unsubscribe()
    }

    // LOGIC
    async getCoverImage(userId: number) {
        this.coverPicture = "assets/LoginSignUpBg.jpg"
        this.getCoverSub = this.userService
            .getProfileImage(userId, ImageType.COVER_IMAGE)
            .subscribe({
                next: (response) => this.coverPicture = 'data:image/png;base64,' + response.image,
                error: err => {
                    console.log('error happen while getCoverImage ' + err)
                }
            })
    }

    async getProfileImage(userId: number) {
        this.profilePicture = "assets/LoginSignUpBg.jpg"
        this.getProfileSub = this.userService
            .getProfileImage(userId, ImageType.PROFILE_IMAGE)
            .subscribe({
                next: (response) => {
                    this.profilePicture = 'data:image/png;base64,' + response.image
                },
                error: err => {
                    console.log('error happen while getProfileImage ' + err)
                }
            })
    }

    async getAllPostsByUser(userId: number) {
        this.getAllPostsSub = this.postService.getUserPosts(userId)
            .subscribe({
                next: posts => {
                    this.posts = posts;
                    this.getPostFile().then();
                },
                error: err => {
                    console.log('Error occurred during getAllPostsByUser ' + err)
                }
            })
    }

    async getPostFile() {
        for (const post of this.posts) {
            this.getPostFileSub = this.postService.getImage(post.id)
                .subscribe({
                    next: (blob) => {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                            this.postFiles.set(post.id, event.target.result);

                            if (post.postType === 'IMAGE') {
                                // Create an image element to calculate the aspect ratio
                                const img = new Image();
                                img.onload = () => {
                                    const aspectRatio = img.width / img.height;
                                    this.aspectRatio.set(post.id, this.calculateAspectRatioClass(aspectRatio));
                                };
                                img.src = event.target.result;
                            }
                            else if (post.postType === 'VIDEO') {
                                // Create a video element to calculate the aspect ratio
                                const video = document.createElement('video');
                                video.onloadedmetadata = () => {
                                    const aspectRatio = video.videoWidth / video.videoHeight;
                                    this.aspectRatio.set(post.id, this.calculateAspectRatioClass(aspectRatio));
                                };
                                video.src = event.target.result;
                            }
                        };
                        reader.readAsDataURL(blob);
                        if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe();
                    },
                    error: (error) => {
                        console.error('File loading failed ', error)
                        if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe();
                    }
                });
        }
    }

    private calculateAspectRatioClass(aspectRatio: number): string {
        if (aspectRatio > 1.5)
            return 'aspect-ratio-16-9';
        else if (aspectRatio < 0.6)
            return 'aspect-ratio-9-16';
        else if (aspectRatio < 1 && aspectRatio >= 0.8)
            return 'aspect-ratio-4-5';
        return 'aspect-ratio-1-1';
    }

    openModal(): void {
        this.dialogRef = this.dialog.open(this.postModal);
    }

    closeModal(): void {
        this.dialogRef.close();
    }

    logout() {
        this.closeModal();
        localStorage.clear();
        this.router.navigate(['/login'])
    }

    playVideo() {

    }

    reportUser() {
        this.isValidReason = this.description !== '' || this.description.trim() !== '';
        if (this.isValidReason) {
            const userStr = localStorage.getItem('CURRENT_USER');
            if (userStr) {
                const user: UserResponse = JSON.parse(userStr);
                const complaintsDTO: ComplaintsDTO = {
                    id: null, senderId: user.id, reportedUser: this.user.id!, date: new Date(), description: this.description
                }
                this.ReportUserSub = this.userService.reportAUser(complaintsDTO).subscribe({
                    next: res => { this.closeModal() },
                    error: err => { this.closeModal() }
                });
            }
        }
    }
}
