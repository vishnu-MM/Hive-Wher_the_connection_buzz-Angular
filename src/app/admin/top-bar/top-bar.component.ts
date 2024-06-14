import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
    selector: 'top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {
    @Input('isSearchResultShowing') isSearchResultShowing: boolean = false;
    @Output('search') searchQuery = new EventEmitter<string>();
    @Output('clear') clearSearchResultEvent = new EventEmitter<void>();
    searchString: string = '';
    isValidSearch: boolean = true;

    search() {
        this.isValidSearch = (this.searchString !== '' && this.searchString.trim() !== '');
        if (this.isValidSearch) {
            this.searchQuery.emit(this.searchString);
        }
    }

    clearSearchResult() {
        if (this.isSearchResultShowing)
            this.clearSearchResultEvent.emit();
    }
}
