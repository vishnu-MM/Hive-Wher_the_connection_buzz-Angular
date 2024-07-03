import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommentDTO} from "../../../Shared/Models/post.model";
import {User} from "../../../Shared/Models/user.model";
import {formatDistanceToNow} from "date-fns";
import {ImageType, UserService} from "../../../Shared/Services/user.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'single-comment',
  templateUrl: './single-comment.component.html',
  styleUrls: ['./single-comment.component.css']
})
export class SingleCommentComponent implements OnInit, OnDestroy{
    @Input() comment! : CommentDTO;
    name : string = '';
    username : string = '';
    profilePicture: string = '';
    private getProfilePictureSub!: Subscription;
    private getUserSub!: Subscription;

    constructor(private userService : UserService) {}

    ngOnInit(): void {
        if (this.comment) this.getUserByComment();
    }

    ngOnDestroy(): void {
        if (this.getUserSub) this.getUserSub.unsubscribe();
        if (this.getProfilePictureSub) this.getProfilePictureSub.unsubscribe();
    }

    async getUserByComment() {
        this.getUserSub = this.userService
            .getProfileById(this.comment.userId)
            .subscribe({
              next: (response) => {
                this.name = response.name;
                this.username = response.username;
              },
              error: (error) => {}
            })
        this.profilePicture = "assets/default-banner.png"
        this.getProfilePictureSub = this.userService.getProfileImage(this.comment.userId, ImageType.PROFILE_IMAGE)
            .subscribe({
              next: (response) => this.profilePicture = 'data:image/png;base64,' + response.image,
              error: (error) => {}
            })
    }

    get getRelativeTime(): string {
        const parsedDate = new Date(this.comment.commentedDate.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
}
