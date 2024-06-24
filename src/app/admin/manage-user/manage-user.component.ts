import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { User, UserPage } from "../../../Shared/Models/user.model";
import { AdminService } from "../../../Shared/Services/admin.service";
import { Router } from "@angular/router";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'manage-user.',
    templateUrl: './manage-user.component.html',
    styleUrls: ['./manage-user.component.css', '../shared-style.css']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
    protected users: User[] = [];
    protected pageNo: number = 0;
    protected totalPages: number = 0;
    protected isLast: boolean = false;
    protected userPage!: UserPage;
    protected isSearchResultShowing: boolean = false;
    protected profileMap: Map<number, string> = new Map<number, string>();
    protected selectedUser!:User | undefined;
    private getAllUserSUb!: Subscription;
    private blockUserSub!: Subscription;
    private unblockUserSub!: Subscription;
    protected blockReason: string = '';
    protected clicked: boolean = false;

    constructor(public userService: UserService,
                private adminService: AdminService,
                private dialog: MatDialog,
                private router: Router) {}

    ngOnInit(): void {
        this.loadUserList().then();
    }

    ngOnDestroy(): void {
        if (this.getAllUserSUb) this.getAllUserSUb.unsubscribe();
        if (this.blockUserSub) this.blockUserSub.unsubscribe();
        if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
    }

    search(searchQuery: string) {
        this.userService.search(searchQuery)
            .subscribe({
                next: res => {
                    this.isSearchResultShowing = true;
                    this.users = res;
                    this.isLast = true;
                    this.totalPages = 1;
                    this.loadProfilePiture().then();
                },
                error: err => {
                    console.log(err);
                }
            })
    }

   protected async loadUserList(): Promise<void> {
        this.getAllUserSUb = this.userService
            .getAllUsers(this.pageNo, 10)
            .subscribe({
                next: value => {
                    this.userPage = value
                    this.users = value.contents;
                    this.totalPages = value.totalPages;
                    this.isLast = value.isLast;
                    if (this.isSearchResultShowing) this.isSearchResultShowing = false;
                    this.loadProfilePiture().then();
                },
                error: err => { console.log("Some thing went wrong while fetching user details") }
            })
    }

    async loadProfilePiture() : Promise<void> {
        this.profileMap = await this.userService.loadProfilePiture(this.users, ImageType.PROFILE_IMAGE);
    }

    @ViewChild('BlockUser') private blockUserDialog!: TemplateRef<any>;
    private blockUserDialogRef!: MatDialogRef<any>;
    protected openBlockUser(user: User) {
        this.selectedUser = user;
        this.blockUserDialogRef = this.dialog.open(this.blockUserDialog);
    }

    protected closeBlockUser() {
        this.blockReason = '';
        this.selectedUser = undefined;
        this.clicked = false;
        this.blockUserDialogRef.close();
    }


    protected async blockUser(): Promise<void> {
        if (this.blockUserSub) {
            this.blockUserSub.unsubscribe();
        }
        
        this.clicked = true;
        
        if (!this.selectedUser) {
            console.error('No user selected');
            return;
        }
    
        if (!this.blockReason || this.blockReason.trim() === '') {
            console.error('Block reason is required');
            return;
        }
        
        const trimmedBlockReason = this.blockReason.trim();
        
        this.blockUserSub = this.adminService.blockUser(this.selectedUser.id!, trimmedBlockReason).subscribe({
            next: value => {
                for (let user of this.users) {
                    if (user.id === this.selectedUser!.id) {
                        user.isBlocked = true; 
                        this.closeBlockUser();
                        break;
                    }
                }
            },
            error: err => {
                console.error('Failed to block user', err);
                this.closeBlockUser();
            }
        });
    }
    

    protected async unblockUser(id: number | null): Promise<void> {
        if (id === null) {
            return;
        }
        if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
        this.blockUserSub = this.adminService.unblockUser(id).subscribe({
            next: value => {
                for (let user of this.users) {
                    if (user.id === id) { user.isBlocked = false; }
                }
            },
            error: err => { }
        });        
    }

    redireactTo(userId: number) {
        this.router.navigate(['/a/users/user',userId])
    }
}