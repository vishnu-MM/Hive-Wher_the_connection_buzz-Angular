import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Connection, ConnectionStatus, User, UserResponse } from "../../../Shared/Models/user.model";
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
import Swal from 'sweetalert2';

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
        this.getFriendsCount().then();
    }

    ngOnDestroy(): void {
        if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
        if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
        if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
        if (this.getAllPostsSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.getPostFilesSub != undefined) this.getAllPostsSub.unsubscribe()
        if (this.friendsCountSub != undefined) this.friendsCountSub.unsubscribe()
        if (this.friendsCountList != undefined) this.friendsCountList.unsubscribe() 
        if (this.updateConnectionSub != undefined) this.updateConnectionSub.unsubscribe() 
    }

    // LOGIC
    private async getCoverImage(): Promise<void> {
        this.getCoverSub = this.userService.getProfileImage(this.currentUser.id!, ImageType.COVER_IMAGE).subscribe({
            next: (response) => this.coverPicture = 'data:image/png;base64,' + response.image,
            error: (err) => {
                if (err.status !== 400) {
                    this.appService.showError(`Could'nt load Cover picture (${err.status})`)
                }
            }
        })
    }

    private async getProfileImage(): Promise<void> {
        this.getProfileSub = this.userService.getProfileImage(this.currentUser.id!, ImageType.PROFILE_IMAGE).subscribe({
            next: (response) => {
                this.profilePicture = 'data:image/png;base64,' + response.image
            },
            error: (err) => { 
                if (err.status !== 400) {
                    this.appService.showError(`Could'nt load Profile picture (${err.status})`)
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
                error: err => { 
                    this.appService.showError(`Could'nt update posts (${err.status})`)
                 }
            })
        }
    }

    protected getRelativeTime(createdOn: Timestamp<string>): string {
        const parsedDate = new Date(createdOn.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }

    //friends related 
    protected showFriendsList: boolean = false;
    protected friendList: User[] = []; 
    protected sort: boolean = true;
    protected loading: boolean = false;
    private friendsCountSub!: Subscription;
    private friendsCountList!: Subscription;
    private updateConnectionSub!: Subscription;

    protected showFriends(): void {
        if (this.friendsCount === 0 ) {
            this.appService.showInfo('No friends to show, Please Make new connections', false)
            return;
        }
        if (this.showFriendsList) {
            this.hideFriends();
            return;
        }
        this.showFriendsList = true;
        this.loading = true;
        this.getFriendsList(false).then()
    }

    protected hideFriends(): void {
        this.showFriendsList = false;
        this.loading = false;
    }

    private async getFriendsCount(): Promise<void> {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            this.friendsCountSub = this.userService.getUserFriendsCount(user.id).subscribe({
                next: res => this.friendsCount = res,
                error: err => {
                    this.appService.showError(`Could'nt load friend related data (${err.status})`)
                }
            })
        }
    }

    private async getFriendsList(sortInAscending: boolean): Promise<void> {
        if (this.friendsCount === 0) {
            this.hideFriends();
            return;
        }

        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            if (this.friendsCountList != undefined) this.friendsCountList.unsubscribe()
            
            this.friendsCountList = this.userService.getUserFriendsList(user.id, sortInAscending).subscribe({
                next: res => {
                    this.friendList = res;
                    this.loading = false;
                },
                error: err => {
                    this.appService.showError(`Could'nt load friend related data (${err.status})`)
                    this.hideFriends();
                }
            })
        }
        else {
            this.hideFriends();
            return;
        }
    }

    protected async removeFriend(friendId: number) {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);
            const friendRequest: Connection = {
                id: null, senderId: user.id, recipientId: friendId, date: new Date(), status: ConnectionStatus.REJECTED                
            }  
            this.updateConnectionSub = this.userService.updateConnection(friendRequest).subscribe({
                next: res => {
                    this.friendList = this.friendList.filter(user => { return( user.id !== friendId) });
                    this.friendsCount--;
                    this.appService.showSuccess('Removes user from friends list')
                },
                error: err => {
                    this.appService.showError("Couldn't make request, try again");
                }
            })
        }
    }

    sortFriendListAscending() {
        this.getFriendsList(true);
    }

    sortFriendListDescending() {
        this.getFriendsList(false);
    }

    forgetPassword() {
        this.appService.resetPassword(this.currentUser.username);
    }

    deleteAccout() {
        this.closeModal();
        Swal.fire({
            title: 'Are you sure?',
            text: `Deleting your account will remove your detials, posts and connections from Hive`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Delete it!'
        })
        .then((result) => {
            if (result.isConfirmed) {
                this.deleteMyAccount();
            }
        });
    }

    protected async deleteMyAccount(): Promise<void> {
        const str = localStorage.getItem('CURRENT_USER');
        if (!str) {
            return;
        }
        const user: UserResponse = JSON.parse(str);
        this.userService.deleteMyAccount(user.id).subscribe({
            next: res => {
                this.appService.logout();
            },
            error: err => {
                this.appService.showError(`Could'nt delete account (${err.status})`);
            }
        });
    } 
}