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
    postFiles: Map<number, string> = new Map<number, string>();
    isPostCountZero : boolean = false;

    //Subscription
    private loadUserDetailsSub!: Subscription;
    private loadUserImagesSub!: Subscription;
    private loadUserPostsSub!: Subscription;
    private getPostFilesSub!: Subscription;

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
        this.postFiles = await this.postService.getPostFiles(postList);
	}

    getAspectRatio(aspectRatio : number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

    getPostDate(createdOn: Timestamp<string>): Date {
        return new Date(createdOn.toString());
    }
}