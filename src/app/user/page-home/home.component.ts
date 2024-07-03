import { Component, OnInit, ViewChild } from '@angular/core';
import { Modal } from "bootstrap";
import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from "ngx-image-cropper";
import { PostType } from "../../../Shared/Models/post.model";
import { USER_LOGIN } from "../../../Shared/Store/user.action";
import { Store } from "@ngrx/store";
import { User } from "../../../Shared/Models/user.model";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    // CREATE POST RELATED
    imageCroppedEvent!: ImageCroppedEvent;
    userStoreSub!: Subscription;
    imageChangedEvent!: Event;
    aspectRatio: number = 1;
    file!: File;
    currentUser!: User;
    @ViewChild('imageCropper') imageCropper!: ImageCropperComponent;
    previewImg!: string;

    //SHOW POST RELATED
    constructor(private userStore: Store<{ UserStore: User }>) { }

    ngOnInit(): void {
        this.userStore.dispatch(USER_LOGIN());
        this.userStoreSub = this.userStore
            .select('UserStore')
            .subscribe(data => {
                this.currentUser = { ...data }
            });
    }

    // CREATE POST RELATED
    showModal(event: any): void {
        this.imageChangedEvent = event;
        const modalElement = document.getElementById('image-crop');
        if (modalElement) {
            const myModal = new Modal(modalElement);
            myModal.show();
        }
    }

    cropAndSave(): void {
        this.imageCropper.crop();
        if (this.imageCroppedEvent) {
            this.file = this.blobToFile(this.imageCroppedEvent.blob!, `POST-${PostType.IMAGE}-${this.currentUser.id}-USER.png`)
            this.convertFileToBase64(this.file).then(base64 => {
                this.previewImg = base64;
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

    private convertFileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }


    // CROPPER RELATED
    imageCropped(event: ImageCroppedEvent): void {
        this.imageCroppedEvent = event;
    }
    imageLoaded(image: LoadedImage): void {/*console.log("Invoked [imageLoaded]")*/ }
    cropperReady(): void {/*console.log("Invoked [cropperReady]")*/ }
    loadImageFailed(): void {/*console.log("Invoked [loadImageFailed]")*/ }
}
