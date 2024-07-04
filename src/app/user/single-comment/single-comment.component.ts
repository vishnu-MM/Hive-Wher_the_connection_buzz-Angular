import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommentDTO } from "../../../Shared/Models/post.model";
import { formatDistanceToNow } from "date-fns";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'single-comment',
    templateUrl: './single-comment.component.html',
    styleUrls: ['./single-comment.component.css']
})
export class SingleCommentComponent implements OnInit, OnDestroy {
    @Input() comment!: CommentDTO;
    name: string = '';
    username: string = '';
    profilePicture: string = '';
    private getProfilePictureSub!: Subscription;
    private getUserSub!: Subscription;

    constructor(private userService: UserService, private appService: AppService) { }

    ngOnInit(): void {
        if (this.comment) this.getUserByComment().then();
    }

    ngOnDestroy(): void {
        if (this.getUserSub) this.getUserSub.unsubscribe();
        if (this.getProfilePictureSub) this.getProfilePictureSub.unsubscribe();
    }

    private async getUserByComment(): Promise<void> {
        this.getUserSub = this.userService.getProfileById(this.comment.userId).subscribe({
            next: (response) => {
                this.name = response.name;
                this.username = response.username;
            },
            error: (error) => {
                this.appService.showError("Could'nt load user details for a comment")
            }
        })
        this.profilePicture = "assets/default-banner.png"
        this.getProfilePictureSub = this.userService.getProfileImage(this.comment.userId, ImageType.PROFILE_IMAGE).subscribe({
            next: (response) => this.profilePicture = 'data:image/png;base64,' + response.image,
            error: (error) => { 
                if (error.status !== 400) {
                    this.appService.showError("Could'nt load user profile image for a comment")
                }
            }
        })
    }

    get getRelativeTime(): string {
        const parsedDate = new Date(this.comment.commentedDate.toString());
        return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
}
