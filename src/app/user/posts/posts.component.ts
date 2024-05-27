import {Component, OnInit} from '@angular/core';
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
  userStoreSub! : Subscription;
  randomPosts! : Post[];

  constructor(private postService : PostService, private router : Router) {}

  ngOnInit() : void {
      this.userStoreSub = this.postService
        .getRandomPosts()
        .subscribe({
            next: data => { this.randomPosts = data; },
            error : err => { console.log(err) }
        })
  }

}
