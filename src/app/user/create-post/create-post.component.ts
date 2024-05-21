import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Store} from "@ngrx/store";
import {User} from "../../../Shared/Models/user.model";
import {USER_LOGIN} from "../../../Shared/Store/user.action";
import {Subscription} from "rxjs";
import {PostCreation, PostType} from "../../../Shared/Models/post.model";
import {PostService} from "../../../Shared/Services/post.service";


@Component({
  selector: 'create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit, OnDestroy{
  imageChangedEvent!: Event;
  @Output() showModal = new EventEmitter<Event>();
  @Input() file!: File;
  @Input() previewImg!: string;
  @Input() aspectRatio!: number;
  description!: string;
  userStoreSub!: Subscription;
  currentUser!: User;
  postServiceSub!: Subscription;

  constructor(private userStore: Store<{ UserStore: User }>,
              private postService : PostService) {}

  ngOnInit() : void {
    this.userStore.dispatch(USER_LOGIN());
    this.userStoreSub = this.userStore
      .select('UserStore')
      .subscribe(data => this.currentUser = {...data});
  }

  ngOnDestroy() {
      this.userStoreSub.unsubscribe();
      if (this.postServiceSub) this.postServiceSub.unsubscribe();
  }

  triggerImageUpload() : void {
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) { fileInput.click(); }
  }

  onFileSelected(event: Event) : void {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
          this.imageChangedEvent = event;
          this.showModal.emit(this.imageChangedEvent);
      }
  }

  post() : void {
      if (this.file) {
          if (this.file.type.startsWith('image/')) {
              let postCreation : PostCreation = {
                  description: (this.description) ? this.description.trim() : '',
                  postType: PostType.IMAGE,
                  userId: this.currentUser.id!
              }
            this.postServiceSub = this.postService
              .createPost(this.file, postCreation)
              .subscribe({
                next: value => {
                  this.description = '';
                  this.previewImg = '';
                },
                error: error => {}
              });
          }
          else if (this.file.type.startsWith('video/')) {
              let postCreation : PostCreation = {
                description: this.description.trim(),
                postType: PostType.VIDEO,
                userId: this.currentUser.id!
              }
          }
      }
      else {
          let postCreation : PostCreation = {
            description: this.description.trim(),
            postType: PostType.TEXT_ONLY,
            userId: this.currentUser.id!
          }
      }
  }
}
