import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, async } from 'rxjs';
import { ComplaintsDTO, ComplaintsPage } from 'src/Shared/Models/complaints.model';
import { User } from 'src/Shared/Models/user.model';
import { AdminService } from 'src/Shared/Services/admin.service';
import { UserService } from 'src/Shared/Services/user.service';
import Swal from 'sweetalert2';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BlockFilter, TimeFilter, UserFilter } from 'src/Shared/Models/filter.model';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'app-complaints',
    templateUrl: './manage-complaints.component.html',
    styleUrls: ['./manage-complaints.component.css', '../shared-style.css'],
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
export class ManageComplaintsComponent implements OnInit, OnDestroy {
    protected complaints: ComplaintsDTO[] = [];
    protected pageNo: number = 0;
    protected pageSize: number = 10;
    protected totalPages: number = 0;
    protected isLast: boolean = true;
    protected complaintsPage!: ComplaintsPage;
    protected userDetailsMap: Map<number, User> = new Map<number, User>();
    protected isSearchResultShowing: boolean = false;
    protected blockReason: string = '';
    protected clicked: boolean = false;
    private loadNextpageSub!: Subscription;
    private unblockUserSub!: Subscription;
    private blockUserSub!: Subscription;

    constructor(private adminService: AdminService,
                private dialog: MatDialog,
                private router: Router,
                private appService: AppService,
                private userService: UserService) { }

    ngOnInit(): void {
        this.resetFilter();
        this.loadData().then();
    }

    ngOnDestroy(): void {
        if (this.loadNextpageSub) this.loadNextpageSub.unsubscribe();
        if (this.filterSub) this.filterSub.unsubscribe();
    }

    protected async loadData():Promise<void> {
        if (this.filter.block === BlockFilter.ALL && this.filter.time === TimeFilter.ALL) {
            this.loadNextpage();
        }
        else {
            this.applyFilters().then();
        }
        if(this.isSearchResultShowing) this.isSearchResultShowing = false;
    }

    private loadNextpage(): void {
        if (this.loadNextpageSub) this.loadNextpageSub.unsubscribe();
        this.loadNextpageSub = this.adminService.getAllComplaints(this.pageNo, this.pageSize)
            .subscribe({
                next: res => {
                    this.complaints = res.contents
                    this.complaintsPage = res
                    this.totalPages = res.totalPages;
                    this.isLast = res.isLast;
                    this.loadUserDetails().then()
                },
                error: err => { 
                    this.appService.showError(`Could'nt load next page (${err.status})`);
                }
            })
    }

    search(searchQuery: string) {
        this.userService.complaintsSearch(searchQuery).subscribe({
            next: res => {
                this.isSearchResultShowing = true;
                this.complaints = res;
                this.isLast = true;
                this.totalPages = 1;
                this.loadUserDetails().then();
            },
            error: err => {
                this.appService.showError(`Could'nt search (${err.status})`);
            }
        })
    }

    logout() {
        this.appService.logout();
    }

    async loadUserDetails(): Promise<void> {
        for (const complaint of this.complaints) {
            this.loadUserDetailsHelper(complaint.senderId);
            this.loadUserDetailsHelper(complaint.reportedUser);
        }
    }

    private loadUserDetailsHelper(userID: number): void {
        if (!this.userDetailsMap.has(userID)) {
            this.userService.getProfileById(userID)
                .subscribe({
                    next: res => {
                        if (!this.userDetailsMap.has(userID))
                            this.userDetailsMap.set(userID, res);
                    },
                    error: err => { 
                        this.appService.showError(`Could'nt load user details (${err.status})`);
                     }
                });

        }
    }

    @ViewChild('BlockUser') private blockUserDialog!: TemplateRef<any>;
    protected selectedUser: User | null = null; 
    private blockUserDialogRef!: MatDialogRef<any>;
    protected openBlockUser(user: User) {
        this.selectedUser = user;
        this.blockUserDialogRef = this.dialog.open(this.blockUserDialog);
    }

    protected closeBlockUser() {
        this.blockReason = '';
        this.selectedUser = null;
        this.clicked = false;
        this.blockUserDialogRef.close();
    }


    protected async blockUser(): Promise<void> {
        if (this.blockUserSub) {
            this.blockUserSub.unsubscribe();
        }
        
        this.clicked = true;
        
        if (this.selectedUser === null) {
            console.error('No user selected');
            return;
        }
    
        if (!this.blockReason || this.blockReason.trim() === '') {
            console.error('Block reason is required');
            return;
        }
        
        const trimmedBlockReason = this.blockReason.trim();
        
        this.blockUserSub = this.adminService.blockUser(this.selectedUser.id!, trimmedBlockReason).subscribe({
            next: () => {
                this.selectedUser!.isBlocked = true; 
                this.selectedUser!.blockReason = trimmedBlockReason;
                this.userDetailsMap.set(this.selectedUser!.id!, this.selectedUser!);
                this.closeBlockUser();
            },
            error: (err: any) => {
                this.appService.showError(`Failed to Block User (${err.status})`);
                this.closeBlockUser();
            }
        });
    }
    
    protected async confirmUnblockUser(user: User): Promise<void> {
        Swal.fire({
            title: 'Are you sure?',
            text: `User was Blocked Because ${user.blockReason? user.blockReason:'(Reason not specified)'}`,
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
                const user = this.userDetailsMap.get(id)!;
                user.isBlocked = false; 
                this.userDetailsMap.set(id, user);
            },
            error: err => { 
                this.appService.showError(`Could'nt Un Block User (${err.status})`);
            }
        });        
    }

    // Pagination related

    protected get getPageNo(): number {
        if (this.filter.block === BlockFilter.ALL && this.filter.time === TimeFilter.ALL) {
            return this.pageNo + 1;
        }
        else {
            return this.filter.pageNo + 1;
        }
    }

    protected isFirst(): boolean {
        if (this.filter.block === BlockFilter.ALL && this.filter.time === TimeFilter.ALL) {
            return this.pageNo <= 0;
        }
        else {
            return this.filter.pageNo <= 0;
        }
    }

    protected decrPageNo() :void {
        if (this.filter.block === BlockFilter.ALL && this.filter.time === TimeFilter.ALL) {
            this.pageNo = this.pageNo - 1;
        }
        else {
            this.filter.pageNo = this.filter.pageNo -1;
        }
        this.loadData().then();
    }

    protected incrPageNo() :void {
        if (this.filter.block === BlockFilter.ALL && this.filter.time === TimeFilter.ALL) {
            this.pageNo = this.pageNo + 1;
        }
        else {
            this.filter.pageNo = this.filter.pageNo +1;
        }
        this.loadData().then();
    }

    //Filter Related
    protected showFilterDiv: boolean = false;
    protected filter!: UserFilter;
    protected readonly TimeFilter = TimeFilter;
    protected readonly BlockFilter = BlockFilter;
    protected isCustomDateSelected = false;
    protected startDate: string = '';
    protected endDate: string = '';
    protected maxDate: string = '';
    private filterSub!: Subscription;

    protected resetFilter(): void {
        this.filter = { block: BlockFilter.ALL, time: TimeFilter.ALL, pageNo: 0, pageSize: 10 };
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
        this.startDate = formattedDate;
        this.endDate = formattedDate;
        this.maxDate = formattedDate;
        this.isCustomDateSelected = false;
    }

    protected onDateFilterChange(filterValue: TimeFilter): void {
        this.filter.time = filterValue;
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
        this.filter.block = filterValue;
    }

    protected async applyFilters(): Promise<void> {
        if (this.startDate && this.endDate) {
            this.filter.startingDate = new Date(this.startDate);
            this.filter.endingDate = new Date(this.endDate);
        }
        if (this.filterSub) this.filterSub.unsubscribe();
        this.filterSub = this.userService.complaintFilter(this.filter).subscribe({
            next: (res) => {
                this.complaints = res.contents
                this.complaintsPage = res
                this.totalPages = res.totalPages;
                this.isLast = res.isLast;
                this.loadUserDetails().then() 
                console.log(res)
            },
            error: (err) => {
                this.appService.showError(`Could'nt filter data (${err.status})`);
            },
        })
    }

    protected onDateChange(): void {
        if (this.startDate > this.endDate) {
          this.endDate = this.startDate;
        }
    }
}
