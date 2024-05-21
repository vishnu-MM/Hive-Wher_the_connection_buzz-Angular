import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Post, PostType} from "../../../Shared/Models/post.model";
import {PostService} from "../../../Shared/Services/post.service";
import {Subscription} from "rxjs";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {User} from "../../../Shared/Models/user.model";
import {formatDistanceToNow} from "date-fns";

@Component({
  selector: 'single-post',
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent implements AfterViewInit , OnInit, OnDestroy{
  @Input("post") post! : Post;
  aspectRatioClass: string = '';
  postImage!: string;
  postServiceSub!: Subscription;
  user!: User;
  name : string = '';
  username : string = '';
  @ViewChild('postImageElement') postImageElement!: ElementRef<HTMLImageElement>;
  getProfileSub!: Subscription;
  profilePicture!: string;


  constructor(private postService: PostService,
              private userService: UserService,) {}

  ngOnInit(): void {
    if (this.post && this.post.postType === PostType.IMAGE) {
      this.postServiceSub = this.postService
        .getImage(this.post.id)
        .subscribe({
          next: (blob) => {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              this.postImage = event.target.result;
            };
            reader.readAsDataURL(blob);
          },
          error: (error) => {
            console.error('Image loading failed', error);
          }
        });
    }
    this.getUserByPost();
  }

  ngOnDestroy(): void {
    if (this.postServiceSub) this.postServiceSub.unsubscribe();
    if (this.getProfileSub) this.getProfileSub.unsubscribe();

  }

  ngAfterViewInit(): void {
    if (this.postImageElement) {
      const imgElement = this.postImageElement.nativeElement;
      imgElement.onload = () => {
        const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        this.calculateAspectRatioClass(aspectRatio);
      };
    }
  }

  private calculateAspectRatioClass(aspectRatio: number): void {
    if (aspectRatio > 1.5) {
      this.aspectRatioClass = 'aspect-ratio-16-9';
    } else if (aspectRatio < 0.6) {
      this.aspectRatioClass = 'aspect-ratio-9-16';
    } else if (aspectRatio < 1 && aspectRatio >= 0.8) {
      this.aspectRatioClass = 'aspect-ratio-4-5';
    } else {
      this.aspectRatioClass = 'aspect-ratio-1-1';
    }
  }

  protected readonly PostType = PostType;

  private getUserByPost() {
    this.userService
        .getProfileById(this.post.userId)
        .subscribe({
          next: (response) => {
            this.name = response.name;
            this.username = response.username;
            this.user = response;
          },
          error: (error) => {}
        })
    this.profilePicture = "assets/LoginSignUpBg.jpg"
    this.getProfileSub = this.userService
        .getProfileImage(this.post.userId, ImageType.PROFILE_IMAGE)
        .subscribe({
          next: (response) => this.profilePicture = 'data:image/png;base64,' + response.image,
          error: (error) => {}
        })
  }

  get getRelativeTime(): string {
    // Convert the date string to a Date object
    const parsedDate = new Date(this.post.createdOn.toString());
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }
}
