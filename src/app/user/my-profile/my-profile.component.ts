import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {User} from "../../../Shared/Models/user.model";
import {Subscription, zip} from "rxjs";
import {ImageCroppedEvent, ImageCropperComponent, LoadedImage} from "ngx-image-cropper";
import {Store} from "@ngrx/store";
import {RegistrationService} from "../../../Shared/Services/registration.service";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {Router} from "@angular/router";
import {LOAD_USER, USER_LOGIN} from "../../../Shared/Store/user.action";
import {Modal} from "bootstrap";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit, OnDestroy{
  currentUser! :User;
  coverPicture! : string;
  profilePicture! : string;

  //SUBSCRIPTION for CLOSING
  private userStoreSub! : Subscription;
  private getProfileSub!: Subscription;
  private getCoverSub!: Subscription;

  @ViewChild('postModal') postModal!: TemplateRef<any>;
  private dialogRef!: MatDialogRef<any>;

  //CONSTRUCTOR & LIFE-CYCLE METHODS
  constructor(private userStore: Store<{ UserStore: User }>,
              private userService : UserService,
              private dialog: MatDialog, private router : Router) {}


  ngOnInit() : void {
    this.userStore.dispatch(USER_LOGIN());
    this.userStoreSub = this.userStore
      .select('UserStore')
      .subscribe(data => {
          this.currentUser = {...data}
          if ( this.currentUser.id ) {
              this.getProfileImage();
              this.getCoverImage();
          }
      });
  }

  ngOnDestroy() : void {
    if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
    if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
    if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
  }

  getCoverImage() {
    this.coverPicture = "assets/LoginSignUpBg.jpg"
    this.getCoverSub = this.userService
      .getProfileImage(this.currentUser.id!, ImageType.COVER_IMAGE)
      .subscribe({
        next: (response) =>
          this.coverPicture = 'data:image/png;base64,' + response.image,
        error: (error) => {}
      })
  }

  getProfileImage() {
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

  openModal(): void { this.dialogRef = this.dialog.open(this.postModal); }
  closeModal(): void { this.dialogRef.close(); }
  logout() {
    this.closeModal();
    localStorage.clear();
    this.router.navigate(['/login'])
  }
}
