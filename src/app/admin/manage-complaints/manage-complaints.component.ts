import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, async } from 'rxjs';
import { ComplaintsDTO, ComplaintsPage } from 'src/Shared/Models/complaints.model';
import { User } from 'src/Shared/Models/user.model';
import { AdminService } from 'src/Shared/Services/admin.service';
import { UserService } from 'src/Shared/Services/user.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-complaints',
    templateUrl: './manage-complaints.component.html',
    styleUrls: ['./manage-complaints.component.css', '../shared-style.css']
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
                private userService: UserService) { }

    ngOnInit(): void {
        this.loadNextpage().then();
    }

    ngOnDestroy(): void {
        if (this.loadNextpageSub) this.loadNextpageSub.unsubscribe();
    }


    async loadNextpage(): Promise<void> {
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
                error: err => { }
            })
    }

    search(event: any) {
        throw new Error('Method not implemented.');
    }

    logout() {
        localStorage.clear();
        this.router.navigate(['/login'])
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
                    error: err => { console.log(err); }
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
                console.error('Failed to block user', err);
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
            error: err => { }
        });        
    }
}
