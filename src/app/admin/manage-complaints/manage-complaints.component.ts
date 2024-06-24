import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ComplaintsDTO, ComplaintsPage } from 'src/Shared/Models/complaints.model';
import { User } from 'src/Shared/Models/user.model';
import { AdminService } from 'src/Shared/Services/admin.service';
import { UserService } from 'src/Shared/Services/user.service';

@Component({
	selector: 'app-complaints',
	templateUrl: './manage-complaints.component.html',
	styleUrls: ['./manage-complaints.component.css', '../shared-style.css']
})
export class ManageComplaintsComponent implements OnInit, OnDestroy {
loadUserList() {
throw new Error('Method not implemented.');
}
	complaints: ComplaintsDTO[] = [];
	pageNo: number = 0;
	pageSize: number = 10;
	totalPages: number = 0;
	isLast: boolean = true;
	complaintsPage!: ComplaintsPage;
	private loadNextpageSub!: Subscription;
	userDetailsMap: Map<number, User> = new Map<number, User>();
	blockUserSub: any;
	users: any;
	unblockUserSub: any;
    isSearchResultShowing: boolean = false;

	constructor(private adminService: AdminService,
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

	blockUser(id: number | null) {
		if (id) {
			if (this.blockUserSub) this.blockUserSub.unsubscribe();
			// this.blockUserSub = this.adminService.blockUser(id)
			// 	.subscribe({
			// 		next: value => {
			// 			const user : User = this.userDetailsMap.get(id)!;
			// 			user.isBlocked = true;
			// 		},
			// 		error: err => { }
			// 	});
		}
	}
	unblockUser(id: number | null) {
		if (id) {
			if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
			this.blockUserSub = this.adminService
				.unblockUser(id)
				.subscribe({
					next: value => {
						const user : User = this.userDetailsMap.get(id)!;
						user.isBlocked = false;
					},
					error: err => { }
				});
		}
	}
}
