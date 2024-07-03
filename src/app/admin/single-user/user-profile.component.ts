import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Timestamp } from 'rxjs';
import { Post } from 'src/Shared/Models/post.model';
import { User } from 'src/Shared/Models/user.model';
import { AdminService } from 'src/Shared/Services/admin.service';
import { PostFile, PostService } from 'src/Shared/Services/post.service';
import { ImageType, UserService } from 'src/Shared/Services/user.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css', '../shared-style.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    //USER
    protected user!: User;
    protected friendsCount: number | null = 0;
    protected coverPicture: string = '';
    protected profilePicture: string = '';
    protected blockReason: string = '';
    protected clicked: boolean = false;
    //POSTS
    protected posts: Post[] = [];
    protected postFiles: Map<number, string> = new Map<number, string>();
    protected isPostCountZero : boolean = false;

    //Subscription
    private loadUserDetailsSub!: Subscription;
    private loadUserImagesSub!: Subscription;
    private loadUserPostsSub!: Subscription;
    private getPostFilesSub!: Subscription;
    private unblockUserSub!: Subscription;
    private blockUserSub!: Subscription;

    constructor(private userService: UserService,
                private adminService: AdminService,
                private postService: PostService,
                private router: Router,
                private dialog: MatDialog,
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
        if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
        if (this.blockUserSub) this.blockUserSub.unsubscribe();
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
                        this.profilePicture = 'assets/no-profile-image.png';
                    if (imageType === ImageType.COVER_IMAGE)
                        this.coverPicture = 'assets/default-banner.png';
                }
            })
    }

    toggleBlockOrUnblock() {
        this.user.isBlocked = (!this.user.isBlocked)
    }

    @ViewChild('BlockUser') private blockUserDialog!: TemplateRef<any>;
    private blockUserDialogRef!: MatDialogRef<any>;
    protected openBlockUser() {
        this.blockUserDialogRef = this.dialog.open(this.blockUserDialog);
    }

    protected closeBlockUser() {
        this.blockReason = '';
        this.clicked = false;
        this.blockUserDialogRef.close();
    }


    protected async blockUser(): Promise<void> {
        if (this.blockUserSub) {
            this.blockUserSub.unsubscribe();
        }
        
        this.clicked = true;
    
        if (!this.blockReason || this.blockReason.trim() === '') {
            console.error('Block reason is required');
            return;
        }
        
        const trimmedBlockReason = this.blockReason.trim();
        
        this.blockUserSub = this.adminService.blockUser(this.user.id!, trimmedBlockReason).subscribe({
            next: () => {   
                this.user.isBlocked = true; 
                this.user.blockReason = trimmedBlockReason; 
                this.closeBlockUser();
            },
            error: (err: any) => {
                console.error('Failed to block user', err);
                this.closeBlockUser();
            }
        });
    }
    
    protected async confirmUnblockUser(): Promise<void> {
        Swal.fire({
            title: 'Are you sure?',
            text: `User was Blocked Because ${this.user.blockReason? this.user.blockReason:'(Reason not specified)'}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unblock it!'
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.unblockUser();
          }
        });
    }

    private async unblockUser(): Promise<void> {
        if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
        this.blockUserSub = this.adminService.unblockUser(this.user.id!).subscribe({
            next: () => {
                this.user.isBlocked = false;
            },
            error: () => { }
        });        
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