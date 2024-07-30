import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ShortenPipe } from 'src/app/shorten.pipe';
import { Post, PostType } from 'src/Shared/Models/post.model';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { PostService } from 'src/Shared/Services/post.service';
import { ImageType, UserService } from 'src/Shared/Services/user.service';

@Component({
    selector: 'post-preview',
    templateUrl: './post-preview.component.html',
    styleUrls: ['./post-preview.component.css']
})
export class PostPreviewComponent implements OnChanges, OnDestroy {
    @Input('postId') postIdInput!: string;
    private postId: number = 0;
    private post!: Post;
    private user!: User;

    protected username: string = 'username';
    protected description: string = '';
    protected postFile: string = '';
    protected profileImage: string = 'assets/no-profile-image.png';
    protected postType: PostType = PostType.IMAGE;
    protected readonly PostType = PostType;

    private loadPostSub!: Subscription;
    private loadUserDetailsSub!: Subscription;
    private loadUserImageSub!: Subscription;

    constructor(private userService: UserService,
        private router: Router,
        private postService: PostService,
        private appService: AppService) { }

    ngOnChanges(changes: SimpleChanges): void {
        const postIdStr: string = changes['postIdInput'].currentValue;
        this.postId = parseInt(postIdStr);
        this.loadPost().then();
    }

    ngOnDestroy(): void {
        if (this.loadPostSub) this.loadPostSub.unsubscribe();
        if (this.loadUserDetailsSub) this.loadUserDetailsSub.unsubscribe();
        if (this.loadUserImageSub) this.loadUserImageSub.unsubscribe();
    }

    private async loadPost(): Promise<void> {
        this.loadPostSub = this.postService.getPost(this.postId).subscribe({
            next: value => {
                this.post = value;
                this.description = value.description;
                this.postType = value.postType;
                this.loadUserDetails(value.userId).then();
                this.loadUserImage(value.userId).then();
                if (value.postType !== PostType.TEXT_ONLY) this.loadPostFile();
            },
            error: err => {
                this.appService.showError(`Could'nt load post (${err.status})`)
            }
        })
    }

    private async loadPostFile(): Promise<void> {
        this.postService.getPostFile(this.postId)
            .then((res: string) => this.postFile = res)
            .catch((err: any) => this.appService.showError(`Error Happed while fetching the post file ${err}`));
    }

    private async loadUserDetails(userId: number): Promise<void> {
        this.loadUserDetailsSub = this.userService.getProfileById(userId).subscribe({
            next: res => {
                this.user = res;
                this.username = '@' + res.username;
            },
            error: err => {
                this.appService.showError(`Error While Fetching User Details ${err.status}`);
            }
        });
    }

    private async loadUserImage(userId: number): Promise<void> {
        this.loadUserImageSub = this.userService.getProfileImage(userId, ImageType.PROFILE_IMAGE).subscribe({
            next: res => {
                this.profileImage = 'data:image/png;base64,' + res.image;
            },
            error: err => {
                this.profileImage = 'assets/no-profile-image.png';
                this.appService.showError(`Error while fetching user image ${err.status}`);
            }
        });
    }

    protected navigateTo(): void {
        this.router.navigate([`/u/post`, this.postId]);
    }
}