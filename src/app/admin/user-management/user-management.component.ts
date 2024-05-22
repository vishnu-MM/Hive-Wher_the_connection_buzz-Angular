import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from "../../../Shared/Services/user.service";
import {Subscription} from "rxjs";
import {User, UserPage} from "../../../Shared/Models/user.model";
import {AdminService} from "../../../Shared/Services/admin.services";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy{
  pageNo : number = 0;
  totalPages : number = 0;
  userPage! : UserPage;
  users : User[] = [];
  private getAllUserSUb!: Subscription;
  private blockUserSub!: Subscription;
  private unblockUserSub!: Subscription;

  constructor(public userService: UserService,
              private adminService: AdminService,
              private router: Router) {}
  ngOnDestroy(): void {
    if (this.getAllUserSUb) this.getAllUserSUb.unsubscribe();
    if (this.blockUserSub) this.blockUserSub.unsubscribe();
    if (this.unblockUserSub) this.unblockUserSub.unsubscribe();
  }
  ngOnInit(): void {
    this.loadUserList();
  }


  search() {}

  loadUserList() {
    this.getAllUserSUb = this.userService
      .getAllUsers(this.pageNo)
      .subscribe({
        next: value => {
          this.userPage = value
          this.users = value.contents;
          this.totalPages = value.totalPages;
        },
        error: err => { console.log("Some thing went wrong while fetching user details") }
      })
  }

  blockUser(id:number | null) {
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
          error: err => {}
        });
    }
  }
  unblockUser(id:number | null) {
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
          error: err => {}
        });
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login'])
  }
}
