import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { Post, PostType } from "../../../Shared/Models/post.model";
import { Subscription, Timestamp } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { PostService } from "../../../Shared/Services/post.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ComplaintsDTO } from 'src/Shared/Models/complaints.model';
import { AppService } from 'src/Shared/Services/app.service';
import { formatDistanceToNow } from 'date-fns';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    //USER
    user!: User;
    coverPicture: string = '';
    profilePicture: string = '';
    friendsCount: number = 0;
    isFriends: boolean = false;
    
    //POSTS
    posts: Post[] = [];
    description: string = '';
    postFiles: Map<number, string> = new Map<number, string>();
    showListView: boolean = true;

    //COMPLAINTS
    isValidReason: boolean = false;
    
    //SUBSCRIPTION for CLOSING
    private getUserSub!: Subscription;
    private getProfileSub!: Subscription;
    private getCoverSub!: Subscription;
    private getAllPostsSub!: Subscription;
    private getPostFilesSub!: Subscription;
    private ReportUserSub!: Subscription;

    //OTHERS
    protected readonly PostType = PostType;
    private dialogRef!: MatDialogRef<any>;
    @ViewChild('reportModal') postModal!: TemplateRef<any>;

    //CONSTRUCTOR & LIFE-CYCLE METHODS
    constructor(private userService: UserService,
                private postService: PostService,
                private appService : AppService,
                private dialog: MatDialog,
                private router: Router,
                private route: ActivatedRoute) {}

    ngOnInit(): void {
        const userId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        if (userId) {
            this.loadUserDetails(userId).then()
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
        if (this.getPostFilesSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.ReportUserSub != undefined) this.ReportUserSub.unsubscribe()
    }

    // LOGIC
    // USER
    async loadUserDetails(userId: number): Promise<void> {
        this.getUserSub = this.userService.getProfileById(userId).subscribe({
            next: value => {
                if (value && value.id) {
                    this.user = value
                    this.getProfileImage(this.user.id!).then();
                    this.getCoverImage(this.user.id!).then();
                    this.getAllPostsByUser(this.user.id!).then();
                }
            },
            error: err => { console.log(err) }
        })
    }

    async getCoverImage(userId: number): Promise<void> {
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

    // POSTS

    async getAllPostsByUser(userId: number) {
        this.getAllPostsSub = this.postService.getUserPosts(userId)
            .subscribe({
                next: posts => {
                    this.posts = posts;
                    this.loadPostFiles(posts).then();
                },
                error: err => {
                    console.log('Error occurred during getAllPostsByUser ' + err)
                }
            })
    }

    async loadPostFiles(postList: Post[]): Promise<void> {
        this.postFiles = await this.postService.getPostFiles(postList);
	}

    getAspectRatio(aspectRatio : number): string {
        return this.postService.getAspectRatio(aspectRatio);
    }

    // COMPLAINTS

    protected reportUser(): void {
        this.isValidReason = this.description !== '' || this.description.trim() !== '';
        if (this.isValidReason) return;

        const userStr = localStorage.getItem('CURRENT_USER');
        if (!userStr) return;

        const user: UserResponse = JSON.parse(userStr);
        const complaintsDTO: ComplaintsDTO = {
            id: null, 
            senderId: user.id, 
            reportedUser: this.user.id!, 
            date: new Date(), 
            description: this.description
        }

        this.ReportUserSub = this.userService.reportAUser(complaintsDTO).subscribe({
            next: res => { this.closeModal() },
            error: err => { this.closeModal() }
        });
    }

    // OTHERS

    protected openModal(): void {
        this.dialogRef = this.dialog.open(this.postModal);
    }

    protected closeModal(): void {
        this.dialogRef.close();
    }

    protected logout(): void {
        this.closeModal();
        this.appService.logout();
    }

    protected getRelativeTime(createdOn: Timestamp<string>): string {
		const parsedDate = new Date(createdOn.toString());
		return formatDistanceToNow(parsedDate, {addSuffix: true});
	}
}
