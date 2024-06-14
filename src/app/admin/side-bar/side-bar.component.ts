import { Component } from '@angular/core';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {
    constructor(private appService : AppService){}
    logout() {
        this.appService.logout();
    }
}