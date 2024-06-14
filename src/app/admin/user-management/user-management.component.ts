import { Component, OnDestroy, OnInit } from '@angular/core';
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { User, UserPage } from "../../../Shared/Models/user.model";
import { AdminService } from "../../../Shared/Services/admin.service";
import { Router } from "@angular/router";

@Component({
    selector: 'user-management',
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css', '../shared-style.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
    users: User[] = [];
    pageNo: number = 0;
    totalPages: number = 0;
    isLast: boolean = false;
    userPage!: UserPage;
    isSearchResultShowing: boolean = false;
    profileMap: Map<number, string> = new Map<number, string>();
    private getAllUserSUb!: Subscription;
    private blockUserSub!: Subscription;
    private unblockUserSub!: Subscription;

    constructor(public userService: UserService,
                private adminService: AdminService,
                private router: Router) {}

    ngOnInit(): void {
        this.loadUserList();
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

    loadUserList() {
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

    blockUser(id: number | null) {
        if (id) {
            if (this.blockUserSub) this.blockUserSub.unsubscribe();
            this.blockUserSub = this.adminService
                .blockUser(id)
                .subscribe({
                    next: value => {
                        for (let user of this.users) {
                            if (user.id === id) { user.isBlocked = true; }
                        }
                    },
                    error: err => { }
                });
        }
    }

    unblockUser(id: number | null) {
        if (id) {
            if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
            this.blockUserSub = this.adminService
                .unblockUser(id)
                .subscribe({
                    next: value => {
                        for (let user of this.users) {
                            if (user.id === id) { user.isBlocked = false; }
                        }
                    },
                    error: err => { }
                });
        }
    }
}