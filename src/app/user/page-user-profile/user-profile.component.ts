import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Connection, ConnectionStatus, User, UserResponse } from "../../../Shared/Models/user.model";
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
    styleUrls: ['../shared-style.css', './user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
    //USER
    user!: User;
    coverPicture: string = '';
    profilePicture: string = '';
    friendsCount: number = 0;
    
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
        const currentUserStr = localStorage.getItem("CURRENT_USER")
        const userId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        if (userId && currentUserStr) {
            const currentUser: UserResponse = JSON.parse(currentUserStr);
            this.loadUserDetails(userId).then()
            this.currentRelation(currentUser.id, userId).then();
        }
        else {
            this.userLoadError();
        }
    }

    ngOnDestroy(): void {
        if (this.getUserSub != undefined) this.getUserSub.unsubscribe()
        if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
        if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
        if (this.getAllPostsSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.getPostFilesSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.ReportUserSub != undefined) this.ReportUserSub.unsubscribe()
        if ( this.currentRelationSub != undefined)  this.currentRelationSub.unsubscribe()
        if ( this.friendBtnOnClickSub != undefined)  this.friendBtnOnClickSub.unsubscribe()
    }

    private userLoadError(): void {
        this.appService.showError("Could'nt retrieve the User details");
        this.router.navigate(['/u/home']).then();
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
            error: err => { this.userLoadError(); }
        })
    }

    async getCoverImage(userId: number): Promise<void> {
        this.coverPicture = "assets/default-banner.png"
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
        this.profilePicture = "assets/default-banner.png"
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

    protected redirectTO(): void {
        this.router.navigate(['/u/chat', this.user.id])
    }

    //Friend Request
    protected isFriends: boolean = false;
    protected isRequested: boolean = false;
    protected loading: boolean = false;
    private currentRelationSub!: Subscription;
    private friendBtnOnClickSub!: Subscription;

    private async currentRelation(senderId: number, recipientId: number): Promise<void> {
        this.currentRelationSub = this.userService.getConnection(senderId, recipientId).subscribe({
            next: res => {
                const connectionStatus: ConnectionStatus = res.status;
                this.isFriends = (connectionStatus === ConnectionStatus.FRIENDS)
                this.isRequested = (connectionStatus === ConnectionStatus.REQUESTED)
            },
            error: err => {
                this.appService.showWarn("Could'nt retrive friends related data")
            }
        })
    }

    protected async friendBtnOnClick(): Promise<void> {
        this.loading = true;
        const currentUserStr = localStorage.getItem("CURRENT_USER")
        const userId: number = parseInt(<string>this.route.snapshot.paramMap.get('id'));
        
        if (userId && currentUserStr) {
            const currentUser: UserResponse = JSON.parse(currentUserStr);

            const friendRequest: Connection = {
                id: null, senderId: currentUser.id, recipientId: userId, date: new Date(),
                status: (this.isFriends || this.isRequested) ? ConnectionStatus.REJECTED : ConnectionStatus.REQUESTED                
            }  
            this.friendBtnOnClickSub = this.userService.updateConnection(friendRequest).subscribe({
                next: res => {
                    const connectionStatus: ConnectionStatus = res.status;
                    console.log(res);
                    
                    this.isFriends = (connectionStatus === ConnectionStatus.FRIENDS)
                    this.isRequested = (connectionStatus === ConnectionStatus.REQUESTED)
                    this.loading = false;
                    console.log(this.isFriends,  this.isRequested);
                    
                },
                error: err => {
                    this.appService.showError("Couldn't make request, try again");
                }
            })
        }
    }
}
