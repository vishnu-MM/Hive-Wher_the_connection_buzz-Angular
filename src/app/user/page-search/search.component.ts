import { ImageType, UserService } from 'src/Shared/Services/user.service';
import { Component, OnDestroy } from '@angular/core';
import { User } from 'src/Shared/Models/user.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.css', '../shared-style.css']
})
export class SearchComponent implements OnDestroy {
    protected searchText: string = '';
    protected result: User[] = [];
    protected noResult: boolean = false;
    protected loading: boolean = false;
    protected isSearching: boolean = false;
    protected userProfileImageMap: Map<number, string> = new Map<number, string>();
    private getProfileSub!: Subscription;
    private searchSub!: Subscription;

    constructor(private userService: UserService,
                private appService: AppService,
                private router: Router) { }

    ngOnDestroy(): void {
        if (this.getProfileSub) this.getProfileSub.unsubscribe();
        if (this.searchSub) this.searchSub.unsubscribe();
    }

    protected search(): void {
        if (this.searchText === '' || this.searchText.trim() === '') {
            this.appService.showWarn("Search field can't be empty");
            this.searchText = '';
            return;
        }
        if (this.searchSub) this.searchSub.unsubscribe();
        this.noResult = false;
        this.loading = true;
        this.isSearching = true;
    
        // Encode the search text
        const encodedSearchText = encodeURIComponent(this.searchText.trim());
    
        this.searchSub = this.userService.search(encodedSearchText).subscribe({
            next: res => {
                if (res.length === 0) {
                    this.noResult = true;
                }
                else {
                    this.result = res;
                    this.loadUserProfilePictures(res).then();
                }
                this.loading = false;
            },
            error: err => {
                this.appService.showError(`Something went wrong, can't Search (${err.status})`);
                this.loading = false;
            }
        })
    }

    private async loadUserProfilePictures(userList: User[]): Promise<void> {
        this.userProfileImageMap = await this.userService.loadProfilePiture(userList, ImageType.PROFILE_IMAGE);
    }

    protected navigateToUser(id: number): void {
        this.router.navigate(['/u/user', id]);
    }

    clearSearch(): void {
        this.searchText = '';
        this.noResult = false;
        this.result = [];
        this.loading = false;
        this.isSearching = false;
        if(this.searchSub) this.searchSub.unsubscribe();
    }
}