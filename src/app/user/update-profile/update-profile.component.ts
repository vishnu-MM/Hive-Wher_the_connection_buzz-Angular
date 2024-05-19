import {ImageCroppedEvent, ImageCropperComponent, LoadedImage} from "ngx-image-cropper";
import {AfterContentInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {User} from "../../../Shared/Models/user.model";
import {Store} from "@ngrx/store";
import {Subscription} from "rxjs";
import {Modal} from 'bootstrap';
import {USER_LOGIN} from "../../../Shared/Store/user.action";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {Image} from "../../../Shared/Models/image.model";

@Component({ selector: 'update-profile', templateUrl: './update-profile.component.html',  styleUrls: ['./update-profile.component.css'] })
export class UpdateProfileComponent implements OnInit, OnDestroy{
  //USER DETAILS UPDATE
  user! :User;
  phone! : string;
  otp!: any;

  //SUBSCRIPTION CLOSING
  private userStoreSub! : Subscription;
  private uploadImgSub!: Subscription;
  private getProfileSub!: Subscription;
  private getCoverSub!: Subscription;

  //IMAGE
  imageChangedEvent: Event | null = null;
  aspectRatio: number = 1;
  imageCroppedEvent!: ImageCroppedEvent | null;
  coverPicture! : string;
  profilePicture! : string;
  @ViewChild('CoverImage') coverImage!: ElementRef;
  @ViewChild('imageCropper') imageCropper!: ImageCropperComponent;


  //CONSTRUCTOR & LIFE-CYCLE METHODS
  constructor(private userStore: Store<{ UserStore: User }>,
              private userService : UserService) {}

  ngOnInit() : void {
      this.userStore.dispatch(USER_LOGIN());
      this.userStoreSub = this.userStore
      .select('UserStore')
      .subscribe(data => {
        this.user = {...data}
        if (this.user.id) {
          this.getProfileImage();
          this.getCoverImage();
        }
      });
  }

  ngOnDestroy() : void {
    if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
    if (this.uploadImgSub != undefined) this.userStoreSub.unsubscribe()
    if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
    if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
  }


  //PROFILE DATA'S RELATED
  updateProfile() {
      this.user.name = this.user.name.trim();
      this.user.aboutMe = this.user.aboutMe.trim();
      this.user.username = this.user.username.trim();
      this.user.phone = this.user.phone.trim();

  }


  // PROFILE IMAGES RELATED
  triggerCoverImageUpload() : void {
    this.aspectRatio = 4;
    this.triggerImageUpload()
  }

  triggerProfileImageUpload() : void {
    this.aspectRatio = 1;
    this.triggerImageUpload()
  }

  triggerImageUpload() : void {
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) { fileInput.click(); }
  }

  onFileSelected(event: Event) : void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        this.imageChangedEvent = event;
        this.showModal();
    }
  }

  showModal() : void {
      const modalElement = document.getElementById('image-crop');
      if (modalElement) {
          const myModal = new Modal(modalElement);
          myModal.show();
      }
  }

  cropAndSave() : void {
      this.imageCropper.crop();
      if ( this.imageCroppedEvent ) {
        let imageType : ImageType = ImageType.PROFILE_IMAGE;
        if ( this.aspectRatio  === 4 ) imageType = ImageType.COVER_IMAGE;

        const file = this.blobToFile(this.imageCroppedEvent.blob!, `USER-${this.user.id}-${ImageType[imageType]}.png`);

        this.uploadImgSub = this.userService
          .uploadProfileImage(file, imageType)
          .subscribe({
            next: value => this.getCoverImage(),
            error: error => this.uploadImgSub.unsubscribe()
          });
      }
  }

  private blobToFile(blob: Blob, fileName: string): File {
    const b: any = blob;
    // A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModifiedDate = new Date();
    b.name = fileName;

    // Cast to a File() type
    return <File>blob;
  }


  // CROPPER RELATED
  imageCropped(event: ImageCroppedEvent) : void {
    this.imageCroppedEvent = event;
  }
  imageLoaded(image: LoadedImage) : void {/*console.log("Invoked [imageLoaded]")*/}
  cropperReady() : void {/*console.log("Invoked [cropperReady]")*/}
  loadImageFailed() : void {/*console.log("Invoked [loadImageFailed]")*/}

  getCoverImage() {
    this.coverPicture = "assets/LoginSignUpBg.jpg"
    this.getCoverSub = this.userService
        .getProfileImage(this.user.id!, ImageType.COVER_IMAGE)
        .subscribe({
          next: (response) =>
                this.coverPicture = 'data:image/png;base64,' + response.image,
          error: (error) => {}
        })
  }

  getProfileImage() {
    console.log("getting")
    this.profilePicture = "assets/LoginSignUpBg.jpg"
    this.getProfileSub = this.userService
        .getProfileImage(this.user.id!, ImageType.PROFILE_IMAGE)
        .subscribe({
          next: (response) => {
            this.profilePicture = 'data:image/png;base64,' + response.image
            console.log(this.profilePicture + " pt")
          },
          error: (error) => {}
        })
  }
}
