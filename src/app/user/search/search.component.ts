import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/Shared/Models/user.model';
import { ImageType, UserService } from 'src/Shared/Services/user.service';

@Component({ selector: 'app-search', templateUrl: './search.component.html', styleUrls: ['./search.component.css']})
export class SearchComponent implements OnInit, OnDestroy {
	private getProfileById!: Subscription;
	private getProfileSub!: Subscription;
  searchText : string = '';
  result : User[] = [];
	userProfileImageMap : Map<number, string> = new Map<number, string>();
  private getProfileSubs = new Map<number, Subscription>();

  constructor(private userService : UserService, private router : Router) {}
  ngOnInit(): void {}
  ngOnDestroy(): void {
		if (this.getProfileById) this.getProfileById.unsubscribe();
		if (this.getProfileSub) this.getProfileSub.unsubscribe();
  }

  search() {
    if(this.searchText.trim() !== '')
    this.userService.search(this.searchText.trim())
    .subscribe({
      next: res => {
        this.result = res;
        this.loadUserProfilePictures(res).then();
      },
      error: err => {console.log(err);
      }
    })
  }
  private async loadUserProfilePictures(userList: User[]) {
		for (let user of userList ) {
			let userId : number  = user.id!;
			this.userProfileImageMap.set(userId, await this.getUserProfilePicture(userId));
		}
	}

	getUserProfilePicture(userId: number): Promise<string> {
		if (this.getProfileSubs.has(userId)) {
			this.getProfileSubs.get(userId)!.unsubscribe();
		}

		return new Promise((resolve, reject) => {
			 const subscription = this.getProfileSub = this.userService
				.getProfileImage(userId, ImageType.PROFILE_IMAGE)
				.subscribe({
					next: (response) => {
						const imageUrl = 'data:image/png;base64,' + response.image;
						resolve(imageUrl);
					},
					error: (error) => {
						resolve('assets/Screenshot%202024-04-29%20152644.png');
					}
				});
			 this.getProfileSubs.set(userId, subscription);
		});
	}

  navigateToUser(id: number) {
			this.router.navigate(['/u/user', id]);
	}
}