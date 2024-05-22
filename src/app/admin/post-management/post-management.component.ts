import {Component, OnDestroy, OnInit} from '@angular/core';
import {AdminService} from "../../../Shared/Services/admin.services";
import {Router} from "@angular/router";
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {Post, PostPage} from "../../../Shared/Models/post.model";

@Component({
  selector: 'app-post-management',
  templateUrl: './post-management.component.html',
  styleUrls: ['./post-management.component.css']
})
export class PostManagementComponent implements OnInit, OnDestroy{
  pageNo : number = 0;
  totalPages : number = 0;
  isLast : boolean = false;
  postPage! : PostPage;
  posts : Post[] = [];
  private loadPostsSub!: Subscription;

  constructor(public postService: PostService,
              private adminService: AdminService,
              private router: Router) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnDestroy(): void {
    if (this.loadPostsSub) this.loadPostsSub.unsubscribe();
  }

  search() {

  }

  loadPosts() {
    this.loadPostsSub = this.postService
      .getAllPosts(this.pageNo)
      .subscribe({
          next: value => {
            this.postPage = value
            this.posts = value.contents;
            this.totalPages = value.totalPages;
            this.isLast = value.isLast;
            console.log(value)
          },
          error: err => { console.log("Some thing went wrong while fetching user details") }
      })
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login'])
  }

}
