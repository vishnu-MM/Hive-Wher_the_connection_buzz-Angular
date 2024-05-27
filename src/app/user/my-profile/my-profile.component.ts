import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {User, UserResponse} from "../../../Shared/Models/user.model";
import {Subscription} from "rxjs";
import {Store} from "@ngrx/store";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {Router} from "@angular/router";
import {USER_LOGIN} from "../../../Shared/Store/user.action";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {PostService} from "../../../Shared/Services/post.service";
import {Post, PostType} from "../../../Shared/Models/post.model";

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit, AfterViewInit, OnDestroy{
  currentUser! :User;
  coverPicture! : string;
  profilePicture! : string;
  friendsCount: number = 0;
  posts : Post[] = [];
  protected readonly PostType = PostType;
  postFiles: Map<number, string> = new Map<number, string>();
  aspectRatio: Map<number, string> = new Map<number, string>();
  showListView : boolean = true;

  //SUBSCRIPTION for CLOSING
  private userStoreSub! : Subscription;
  private getProfileSub!: Subscription;
  private getCoverSub!: Subscription;
  private getAllPostsSub!: Subscription;
  private getPostFileSub!: Subscription;
  @ViewChild('postModal') postModal!: TemplateRef<any>;
  private dialogRef!: MatDialogRef<any>;

  //CONSTRUCTOR & LIFE-CYCLE METHODS
  constructor(private userStore: Store<{ UserStore: User }>,
              private userService : UserService,
              private postService : PostService,
              private dialog: MatDialog, private router : Router) {}

  ngOnInit() : void {
      this.userStore.dispatch(USER_LOGIN());
      this.userStoreSub = this.userStore.select('UserStore')
        .subscribe(data => {
            this.currentUser = {...data}
            if ( this.currentUser.id ) {
                this.getProfileImage();
                this.getCoverImage();
            }
        });
      this.getAllPostsByUser();
  }

  ngOnDestroy() : void {
      if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
      if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
      if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
      if (this.getAllPostsSub != undefined) this.getAllPostsSub.unsubscribe()
      if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe()
  }

  ngAfterViewInit(): void {
    // if (this.postVideoElement) {
    //   this.respondToVisibility( this.postVideoElement.nativeElement, (isVisible) => {
    //     if ( !this.postVideoElement.nativeElement.paused && !isVisible)  this.pauseVideo();
    //   });
    // }
  }

  // LOGIC
  async getCoverImage() {
    this.coverPicture = "assets/LoginSignUpBg.jpg"
    this.getCoverSub = this.userService
      .getProfileImage(this.currentUser.id!, ImageType.COVER_IMAGE)
      .subscribe({
        next: (response) => this.coverPicture = 'data:image/png;base64,' + response.image,
        error: (error) => {}
      })
  }

  async getProfileImage() {
    this.profilePicture = "assets/LoginSignUpBg.jpg"
    this.getProfileSub = this.userService
      .getProfileImage(this.currentUser.id!, ImageType.PROFILE_IMAGE)
      .subscribe({
        next: (response) => {
          this.profilePicture = 'data:image/png;base64,' + response.image
        },
        error: (error) => {}
      })
  }

  async getAllPostsByUser() {
      const userStr = localStorage.getItem('CURRENT_USER');
      if (userStr) {
          const user: UserResponse = JSON.parse(userStr);
          this.getAllPostsSub = this.postService.getUserPosts(user.id).subscribe({
              next: posts => {
                this.posts = posts;
                this.getPostFile();
              },
              error: err => {}
          })
      }
  }

  // async getPostFile() {
  //   for (const post of this.posts) {
  //     if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe();
  //     this.getPostFileSub = this.postService.getImage(post.id)
  //       .subscribe({
  //         next: (blob) => {
  //           const reader = new FileReader();
  //           reader.onload = (event: any) => {
  //             this.postFiles.set(post.id, event.target.result);
  //             this.aspectRatio.set(post.id, this.calculateAspectRatioClass());
  //           };
  //           reader.readAsDataURL(blob);
  //         },
  //         error: (error) => console.error('Image loading failed', error)
  //
  //       });
  //   }
  // }

  async getPostFile() {
    for (const post of this.posts) {
      if (this.getPostFileSub != undefined) this.getAllPostsSub.unsubscribe();
      this.getPostFileSub = this.postService.getImage(post.id)
        .subscribe({
          next: (blob) => {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              this.postFiles.set(post.id, event.target.result);

              if (post.postType === 'IMAGE') {
                // Create an image element to calculate the aspect ratio
                const img = new Image();
                img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  this.aspectRatio.set(post.id, this.calculateAspectRatioClass(aspectRatio));
                };
                img.src = event.target.result;
              } else if (post.postType === 'VIDEO') {
                // Create a video element to calculate the aspect ratio
                const video = document.createElement('video');
                video.onloadedmetadata = () => {
                  const aspectRatio = video.videoWidth / video.videoHeight;
                  this.aspectRatio.set(post.id, this.calculateAspectRatioClass(aspectRatio));
                };
                video.src = event.target.result;
              }
            };
            reader.readAsDataURL(blob);
          },
          error: (error) => console.error('File loading failed', error)
        });
    }
  }

  private calculateAspectRatioClass(aspectRatio: number): string {
    if (aspectRatio > 1.5)
      return 'aspect-ratio-16-9';
    else if (aspectRatio < 0.6)
      return 'aspect-ratio-9-16';
    else if (aspectRatio < 1 && aspectRatio >= 0.8)
      return 'aspect-ratio-4-5';
    return 'aspect-ratio-1-1';
  }

  openModal(): void {
    this.dialogRef = this.dialog.open(this.postModal);
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  logout() {
    this.closeModal();
    localStorage.clear();
    this.router.navigate(['/login'])
  }

  playVideo() {

  }
}
