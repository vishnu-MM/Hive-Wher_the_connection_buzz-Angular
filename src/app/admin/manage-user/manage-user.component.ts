import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { User, UserPage } from "../../../Shared/Models/user.model";
import { AdminService } from "../../../Shared/Services/admin.service";
import { Router } from "@angular/router";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BlockFilter, TimeFilter, UserFilter } from 'src/Shared/Models/filter.model';

@Component({
    selector: 'manage-user.',
    templateUrl: './manage-user.component.html',
    styleUrls: ['./manage-user.component.css', '../shared-style.css'],
    animations: [
        trigger('slideDownAnimation', [
            state('void', style({
                height: '0',
                opacity: 0,
            })),
            transition('void <=> *', [
                animate('300ms ease-in-out', style({
                    height: '*',
                    opacity: 1,
                }))
            ])
        ])
    ]
})
export class ManageUsersComponent implements OnInit, OnDestroy {
    protected users: User[] = [];
    protected pageNo: number = 0;
    protected totalPages: number = 0;
    protected isLast: boolean = false;
    protected userPage!: UserPage;
    protected isSearchResultShowing: boolean = false;
    protected profileMap: Map<number, string> = new Map<number, string>();
    protected selectedUser!: User | undefined;
    private getAllUserSUb!: Subscription;
    private blockUserSub!: Subscription;
    private unblockUserSub!: Subscription;
    protected blockReason: string = '';
    protected clicked: boolean = false;

    constructor(public userService: UserService,
        private adminService: AdminService,
        private dialog: MatDialog,
        private router: Router) { }

    ngOnInit(): void {
        this.resetFilter();
        this.loadUserList().then();
    }

    ngOnDestroy(): void {
        if (this.getAllUserSUb) this.getAllUserSUb.unsubscribe();
        if (this.blockUserSub) this.blockUserSub.unsubscribe();
        if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
        if (this.filterSub) this.filterSub.unsubscribe();
    }

    search(searchQuery: string) {
        this.userService.search(searchQuery).subscribe({
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
        if (this.userFilter.block === BlockFilter.ALL && this.userFilter.time === TimeFilter.ALL) {
            this.loadAllUsers().then();
        }
        else {
            this.applyFilters().then();
        }
    }

    private async loadAllUsers(): Promise<void> {
        this.getAllUserSUb = this.userService.getAllUsers(this.pageNo, 10).subscribe({
            next: value => {
                this.userPage = value
                this.users = value.contents;
                this.totalPages = value.totalPages;
                this.isLast = value.isLast;
                if (this.isSearchResultShowing) this.isSearchResultShowing = false;            
                this.loadProfilePiture().then()    
            },
            error: err => { console.log("Some thing went wrong while fetching user details") }
        })
    }

    async loadProfilePiture(): Promise<void> {
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

    protected async confirmUnblockUser(user: User): Promise<void> {
        Swal.fire({
            title: 'Are you sure?',
            text: `User was Blocked Because ${user.blockReason ? user.blockReason : '(Reason not specified)'}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, unblock it!'
        })
            .then((result) => {
                if (result.isConfirmed) {
                    this.unblockUser(user.id);
                }
            });
    }

    private async unblockUser(id: number | null): Promise<void> {
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
        this.router.navigate(['/a/users/user', userId])
    }

    // Pagination related

    protected get getPageNo(): number {
        if (this.userFilter.block === BlockFilter.ALL && this.userFilter.time === TimeFilter.ALL) {
            return this.pageNo + 1;
        }
        else {
            return this.userFilter.pageNo + 1;
        }
    }

    protected isFirst(): boolean {
        if (this.userFilter.block === BlockFilter.ALL && this.userFilter.time === TimeFilter.ALL) {
            return this.pageNo <= 0;
        }
        else {
            return this.userFilter.pageNo <= 0;
        }
    }

    protected decrPageNo() :void {
        if (this.userFilter.block === BlockFilter.ALL && this.userFilter.time === TimeFilter.ALL) {
            this.pageNo = this.pageNo - 1;
        }
        else {
            this.userFilter.pageNo = this.userFilter.pageNo -1;
        }
        this.loadUserList().then();
    }

    protected incrPageNo() :void {
        if (this.userFilter.block === BlockFilter.ALL && this.userFilter.time === TimeFilter.ALL) {
            this.pageNo = this.pageNo + 1;
        }
        else {
            this.userFilter.pageNo = this.userFilter.pageNo +1;
        }
        this.loadUserList().then();
    }

    //Filter Related
    protected showFilterDiv: boolean = false;
    protected userFilter!: UserFilter;
    protected readonly TimeFilter = TimeFilter;
    protected readonly BlockFilter = BlockFilter;
    protected isCustomDateSelected = false;
    protected startDate: string = '';
    protected endDate: string = '';
    protected maxDate: string = '';
    private filterSub!: Subscription;

    protected resetFilter(): void {
        this.userFilter = { block: BlockFilter.ALL, time: TimeFilter.ALL, pageNo: 0, pageSize: 10 };
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        this.startDate = formattedDate;
        this.endDate = formattedDate;
        this.maxDate = formattedDate;
        this.isCustomDateSelected = false;
    }

    protected onDateFilterChange(filterValue: TimeFilter): void {
        this.userFilter.time = filterValue;
        this.isCustomDateSelected = filterValue === TimeFilter.CUSTOM_DATE;
    
        const today = new Date();
        if (filterValue === TimeFilter.TODAY) {
            this.startDate = today.toISOString();
            this.endDate = today.toISOString();
        }
        else if (filterValue === TimeFilter.THIS_WEEK) {
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            this.startDate = startOfWeek.toISOString();
            this.endDate = new Date().toISOString();
        }
        else if (filterValue === TimeFilter.THIS_MONTH) {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            this.startDate = startOfMonth.toISOString();
            this.endDate = new Date().toISOString();
        }
        else if (filterValue === TimeFilter.THIS_YEAR) {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            this.startDate = startOfYear.toISOString();
            this.endDate = new Date().toISOString();
        }
    }
    

    protected onBlockFilterChange(filterValue: BlockFilter): void {
        this.userFilter.block = filterValue;
    }

    protected async applyFilters(): Promise<void> {
        if (this.startDate && this.endDate) {
            this.userFilter.startingDate = new Date(this.startDate);
            this.userFilter.endingDate = new Date(this.endDate);
        }
        if (this.filterSub) this.filterSub.unsubscribe();
        this.filterSub = this.userService.filter(this.userFilter).subscribe({
            next: (value) => {
                this.userPage = value
                this.users = value.contents;
                this.totalPages = value.totalPages;
                this.isLast = value.isLast;
                if (this.isSearchResultShowing) this.isSearchResultShowing = false;   
                this.loadProfilePiture().then()
            },
            error: (err) => {
                console.log(err);
            },
        })
    }

    protected onDateChange(): void {
        if (this.startDate > this.endDate) {
          this.endDate = this.startDate;
        }
    }
}