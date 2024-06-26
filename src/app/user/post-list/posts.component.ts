import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {Post} from "../../../Shared/Models/post.model";
import {Router} from "@angular/router";

@Component({
  selector: 'posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {
  userStoreSub!: Subscription;
  randomPosts: Post[] = [];
  loading: boolean = false;
  private intersectionObserver?: IntersectionObserver;

  @ViewChild('observerTarget', { static: true }) observerTarget!: ElementRef;

  constructor(private postService: PostService, private router: Router) {}

  ngOnInit(): void {
    this.loadPosts();

    this.intersectionObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.loadPosts();
      }
    });

    this.intersectionObserver.observe(this.observerTarget.nativeElement);
  }

  loadPosts(): void {
    if (this.loading) return;

    this.loading = true;
    this.userStoreSub = this.postService
      .getRandomPosts()
      .subscribe({
        next: data => {
          this.randomPosts.push(...data);
          this.loading = false;
        },
        error: err => {
          console.log(err);
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.userStoreSub) {
      this.userStoreSub.unsubscribe();
    }
  }
}