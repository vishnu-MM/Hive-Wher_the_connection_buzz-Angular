import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from "ngx-image-cropper";
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { User } from "../../../Shared/Models/user.model";
import { Store } from "@ngrx/store";
import { Subscription, zip } from "rxjs";
import { Modal } from 'bootstrap';
import { LOAD_USER, USER_LOGIN } from "../../../Shared/Store/user.action";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { RegistrationService } from "../../../Shared/Services/registration.service";
import { Router } from "@angular/router";
import { AppService } from "src/Shared/Services/app.service";

@Component({
    selector: 'update-profile',
    templateUrl: './update-profile.component.html',
    styleUrls: ['../shared-style.css', './update-profile.component.css']
})
export class UpdateProfileComponent implements OnInit, OnDestroy {
    //USER DETAILS UPDATE
    protected user!: User;
    protected currentUser!: User;
    protected phone!: string;
    protected otp!: any;
    protected isUsernameInUse: boolean = false;
    protected tryingToUpdate: boolean = false;

    //SUBSCRIPTION CLOSING
    private userStoreSub!: Subscription;
    private uploadImgSub!: Subscription;
    private getProfileSub!: Subscription;
    private getCoverSub!: Subscription;
    private updationSub!: Subscription;

    //IMAGE
    protected imageChangedEvent: Event | null = null;
    protected aspectRatio: number = 1;
    protected imageCroppedEvent!: ImageCroppedEvent | null;
    protected coverPicture!: string;
    protected profilePicture!: string;
    @ViewChild('CoverImage') coverImage!: ElementRef;
    @ViewChild('imageCropper') imageCropper!: ImageCropperComponent;


    //CONSTRUCTOR & LIFE-CYCLE METHODS
    constructor(private userStore: Store<{ UserStore: User }>,
        private appService: AppService,
        private signUpService: RegistrationService,
        private userService: UserService,
        private router: Router) { }

    ngOnInit(): void {
        this.userStore.dispatch(USER_LOGIN());
        this.userStoreSub = this.userStore.select('UserStore').subscribe(data => {
            this.currentUser = { ...data }
            if (this.currentUser) {
                this.user = { ...this.currentUser }
                console.log(this.user)
            }
            if (this.user.id) {
                this.getProfileImage();
                this.getCoverImage();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.userStoreSub != undefined) this.userStoreSub.unsubscribe()
        if (this.uploadImgSub != undefined) this.userStoreSub.unsubscribe()
        if (this.getProfileSub != undefined) this.getProfileSub.unsubscribe()
        if (this.getCoverSub != undefined) this.getCoverSub.unsubscribe()
        if (this.updationSub != undefined) this.updationSub.unsubscribe()
    }

    protected async updateProfile(): Promise<void> {
        this.tryingToUpdate = true;
        this.user.username = this.user.username.trim();

        if (this.isUsernameInValid) {
            return;
        }

        const isUsernameChanged: boolean = this.user.username !== this.currentUser.username;
        if (this.user.username !== this.currentUser.username) {
            const isInUse = await this.checkUsernameInUse();
            if (isInUse) {
                this.isUsernameInUse = true;
                this.appService.showWarn("Username is already in use by another user")
                return;
            }
        }

        if (this.updationSub != undefined) this.updationSub.unsubscribe()
        this.updationSub = this.userService.updateProfile(this.user).subscribe({
            next: (response) => {
                this.userStore.dispatch(LOAD_USER(response))
                if (isUsernameChanged) {
                    this.appService.showInfo("Profile Updation was success, \n Username has been changes,\n Re-Login Requires", true)
                    this.appService.logout();
                }
                else {
                    this.router.navigate(['/u/profile']);
                }
            },
            error: (error) => {
                this.appService.showError(`Could'nt update profile, Try again (${error.status})`)
            }
        })
    }

    private async checkUsernameInUse(): Promise<boolean> {
        try {
            const isInUse = await this.signUpService.checkIsUsernameAvailable(this.user.username).toPromise();
            return isInUse!;
        } catch (error) {
            this.appService.showError("Could'nt check is username available, \n Please continue with exiting username")
            this.user.username = this.currentUser.username;
            return false;
        }
    }

    // VALIDATION LOGIC FOR USERNAME

    get isUsernameInValid(): boolean {
        return (this.isUsernameEmpty ||
            this.isUsernameLengthInValid ||
            this.isUsernameOnlyUnderscores ||
            this.isUsernameNotOnlyContainsLettersNumbersAnd_);
    }

    get isUsernameNotOnlyContainsLettersNumbersAnd_(): boolean {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        return this.tryingToUpdate && !usernameRegex.test(this.user.username);
    }

    get isUsernameOnlyUnderscores(): boolean {
        const usernameOnlyUnderscoresRegex = /^_+$/;
        return this.tryingToUpdate && usernameOnlyUnderscoresRegex.test(this.user.username.trim());
    }

    get isUsernameLengthInValid(): boolean {
        return this.tryingToUpdate && this.user.username.length < 4;
    }

    get isUsernameEmpty(): boolean {
        return this.tryingToUpdate &&
            (this.user.username === '' || this.user.username.trim() === '');
    }

    // PROFILE IMAGES RELATED
    triggerCoverImageUpload(): void {
        this.aspectRatio = 4;
        this.triggerImageUpload()
    }

    triggerProfileImageUpload(): void {
        this.aspectRatio = 1;
        this.triggerImageUpload()
    }

    triggerImageUpload(): void {
        const fileInput = document.getElementById('imageInput') as HTMLInputElement;
        if (fileInput) { fileInput.click(); }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {

            this.imageChangedEvent = event;
            this.showModal();
        }
    }

    showModal(): void {
        const modalElement = document.getElementById('image-crop');
        if (modalElement) {
            const myModal = new Modal(modalElement);
            myModal.show();
        }
    }

    cropAndSave(): void {
        this.imageCropper.crop();
        if (this.imageCroppedEvent) {
            let imageType: ImageType = ImageType.PROFILE_IMAGE;
            if (this.aspectRatio === 4) imageType = ImageType.COVER_IMAGE;

            const file = this.blobToFile(this.imageCroppedEvent.blob!, `USER-${this.user.id}-${ImageType[imageType]}.png`);
            
            if (file.size > 200 * 1024 * 1024) {
                this.appService.showError('File size exceeds the limit of 200MB.');
                return;
            }

            this.uploadImgSub = this.userService.uploadProfileImage(file, imageType).subscribe({
                next: value => { 
                    if (this.aspectRatio === 4) {
                        this.getCoverImage(); 
                        this.appService.showSuccess("Cover Photo upadated successfully")

                    }
                    else {
                        this.getProfileImage();
                        this.appService.showSuccess("Profile Picture upadated successfully")
                    }
                },
                error: error => { 
                    this.uploadImgSub.unsubscribe() 
                    const img = (this.aspectRatio === 4)? 'Cover Photo' : 'Profile Picture';
                    this.appService.showError(`${img} upadate failed, Try again (${error.status})`)
                }
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
    imageCropped(event: ImageCroppedEvent): void {
        this.imageCroppedEvent = event;
    }
    imageLoaded(image: LoadedImage): void {/*console.log("Invoked [imageLoaded]")*/ }
    cropperReady(): void {/*console.log("Invoked [cropperReady]")*/ }
    loadImageFailed(): void {/*console.log("Invoked [loadImageFailed]")*/ }

    getCoverImage() {
        this.coverPicture = "assets/default-banner.png"
        this.getCoverSub = this.userService
            .getProfileImage(this.user.id!, ImageType.COVER_IMAGE)
            .subscribe({
                next: (response) =>
                    this.coverPicture = 'data:image/png;base64,' + response.image,
                error: (error) => { }
            })
    }

    getProfileImage() {
        this.profilePicture = "assets/default-banner.png"
        this.getProfileSub = this.userService
            .getProfileImage(this.user.id!, ImageType.PROFILE_IMAGE)
            .subscribe({
                next: (response) => {
                    this.profilePicture = 'data:image/png;base64,' + response.image
                },
                error: (error) => { }
            })
    }
}
