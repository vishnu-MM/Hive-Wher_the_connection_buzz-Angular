import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
    selector: 'top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {
    @Input('showSearchAndFilter') showSearchAndFilter: boolean = true;
    @Input('isSearchResultShowing') isSearchResultShowing: boolean = false;
    @Output('search') searchQuery = new EventEmitter<string>();
    @Output('clear') clearSearchResultEvent = new EventEmitter<void>();
    @Output('toggleFilter') toggleFilterEvent = new EventEmitter<void>();
    searchString: string = '';
    isValidSearch: boolean = true;

    protected search(): void {
        this.isValidSearch = (this.searchString !== '' && this.searchString.trim() !== '');
        if (this.isValidSearch) {
            this.searchQuery.emit(this.searchString);
        }
    }

    protected clearSearchResult(): void {
        if (this.isSearchResultShowing){
            this.searchString = '';
            this.clearSearchResultEvent.emit();
        }
    }

    protected toggleFilter(): void {
        this.toggleFilterEvent.emit();
    }
}
