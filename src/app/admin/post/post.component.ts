import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Post, PostType} from "../../../Shared/Models/post.model";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements AfterViewInit , OnInit, OnDestroy {
    @Input() post!: Post;
    postedTime: number = 0;
    username: string = '';
    userName: string = '';
    description: string = '';
    postImage: any;
    // Subscriptions
    private getUserByPostSub!: Subscription;
    private getPostImageSub!: Subscription;

    constructor(private postService: PostService,
              private userService: UserService,) {}

    ngOnInit(): void {
      if (this.post) {
        this.postedTime = this.post.createdOn.timestamp;
        this.description = this.post.description;
        if (this.post && this.post.postType === PostType.IMAGE) {
          this.getPostImage();
        }
      }
      this.getUserByPost();
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        if (this.getUserByPostSub) this.getUserByPostSub.unsubscribe();
    }

    private getPostImage() {
        this.getPostImageSub = this.postService
          .getImage(this.post.id)
          .subscribe({
            next: (blob) => {
              const reader = new FileReader();
              reader.onload = (event: any) => {
                this.postImage = event.target.result;
              };
              reader.readAsDataURL(blob);
            },
            error: (error) => { console.error('Image loading failed', error) }
          });
    }

    private getUserByPost() {
        this.getUserByPostSub = this.userService
            .getProfileById(this.post.userId)
            .subscribe({
                next: (response) => {
                  this.username = '@' + response.username;
                  if ( response.name ) this.userName = response.name
                  else this.userName = response.email
                },
                error: (error) => {}
            })
          // this.profilePicture = "assets/LoginSignUpBg.jpg"
          // this.getProfileSub = this.userService
          //   .getProfileImage(this.post.userId, ImageType.PROFILE_IMAGE)
          //   .subscribe({
          //     next: (response) => this.profilePicture = 'data:image/png;base64,' + response.image,
          //     error: (error) => {}
          //   })
    }

  protected readonly PostType = PostType;
}
