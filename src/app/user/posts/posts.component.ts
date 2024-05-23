import {Component, OnInit} from '@angular/core';
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {Post} from "../../../Shared/Models/post.model";

@Component({
  selector: 'posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css']
})
export class PostsComponent implements OnInit {
  userStoreSub! : Subscription;
  randomPosts! : Post[];

  constructor(private postService : PostService) {}

  ngOnInit() : void {
      this.userStoreSub = this.postService
        .getRandomPosts()
        .subscribe({
            next: data => { this.randomPosts = data; },
            error : err => { console.log(err) }
        })
  }

}
