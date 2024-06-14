import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Timestamp } from 'rxjs';
import { Post } from 'src/Shared/Models/post.model';
import { User } from 'src/Shared/Models/user.model';
import { PostFile, PostService } from 'src/Shared/Services/post.service';
import { ImageType, UserService } from 'src/Shared/Services/user.service';

@Component({
    selector: 'user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css', '../shared-style.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    //USER
    user!: User;
    friendsCount: number | null = 0;
    coverPicture: string = '';
    profilePicture: string = '';
    //POSTS
    posts: Post[] = [];
    postFileMap: Map<number, PostFile> = new Map<number, PostFile>();
    isPostCountZero : boolean = false;

    //Subscription
    private loadUserDetailsSub!: Subscription;
    private loadUserImagesSub!: Subscription;
    private loadUserPostsSub!: Subscription;
    private getPostFileSub!: Subscription;

    constructor(private userService: UserService,
        private postService: PostService,
        private router: Router,
        private route: ActivatedRoute) { }

    ngOnInit(): void {
        const userId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        if (userId) {
            this.loadUserDetails(userId).then();
            this.loadUserImages(userId, ImageType.PROFILE_IMAGE).then();
            this.loadUserImages(userId, ImageType.COVER_IMAGE).then();
            this.loadUserPosts(userId).then();
        }
        else {
            this.router.navigate(['/a/users']).then();
        }
    }

    ngOnDestroy(): void {
        if (this.loadUserDetailsSub) this.loadUserDetailsSub.unsubscribe();
        if (this.loadUserImagesSub) this.loadUserDetailsSub.unsubscribe();
        if (this.loadUserPostsSub) this.loadUserDetailsSub.unsubscribe();
    }

    //* USER
    async loadUserDetails(userId: number): Promise<void> {
        this.loadUserDetailsSub = this.userService.getProfileById(userId)
            .subscribe({
                next: value => { this.user = value },
                error: err => { console.log(err) }
            })
    }

    async loadUserImages(userId: number, imageType: ImageType): Promise<void> {
        this.userService.getProfileImage(userId!, imageType)
            .subscribe({
                next: res => {
                    if (imageType === ImageType.PROFILE_IMAGE)
                        this.profilePicture = 'data:image/png;base64,' + res.image;
                    if (imageType === ImageType.COVER_IMAGE)
                        this.coverPicture = 'data:image/png;base64,' + res.image;
                },
                error: (error) => {
                    if (imageType === ImageType.PROFILE_IMAGE)
                        this.profilePicture = 'assets/no-profile-image.jpg';
                    if (imageType === ImageType.COVER_IMAGE)
                        this.coverPicture = 'assets/LoginSignUpBg.jpg';
                }
            })
    }

    toggleBlockOrUnblock() {
        this.user.isBlocked = (!this.user.isBlocked)
    }


    //* POSTS

    async loadUserPosts(userId: number): Promise<void> {
        this.loadUserPostsSub = this.postService.getUserPosts(userId)
            .subscribe({
                next: res => {
                    this.posts = res;
                    this.isPostCountZero = (res.length === 0)
                    if (!this.isPostCountZero) {
                        this.loadPostFiles(res);
                    }
                },
                error: err => { console.log(err); }
            })
    }

    async loadPostFiles(postList: Post[]): Promise<void> {
        for (const post of this.posts) {
            this.getPostFileSub = this.postService.getImage(post.id)
                .subscribe({
                    next: (blob) => {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                            const postFile: PostFile = {
                                postId: post.id,
                                fileString: event.target.result,
                                fileType: post.postType,
                                aspectRatio: ''
                            }
                            this.postFileMap.set(post.id, postFile);

                            if (post.postType === 'IMAGE') {
                                const img = new Image();
                                img.onload = () => {
                                    const aspectRatio = this.calculateAspectRatioClass((img.width / img.height));
                                    const postFile: PostFile = this.postFileMap.get(post.id)!;
                                    postFile.aspectRatio = aspectRatio;
                                    this.postFileMap.set(post.id, postFile);
                                };
                                img.src = event.target.result;
                            }
                            else if (post.postType === 'VIDEO') {
                                const video = document.createElement('video');
                                video.onloadedmetadata = () => {
                                    const aspectRatio = this.calculateAspectRatioClass((video.videoWidth / video.videoHeight));
                                    const postFile: PostFile = this.postFileMap.get(post.id)!;
                                    postFile.aspectRatio = aspectRatio;
                                    this.postFileMap.set(post.id, postFile);
                                };
                                video.src = event.target.result;
                            }
                        };
                        reader.readAsDataURL(blob);
                    },
                    error: (error) => { console.error('File loading failed ', error) }
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

    getPostDate(createdOn: Timestamp<string>): Date {
        return new Date(createdOn.toString());
    }
}