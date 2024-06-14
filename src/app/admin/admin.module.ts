import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import {AdminRoutingModule} from "./admin-routing.module";
import {MatIconModule} from "@angular/material/icon";
import { UserManagementComponent } from './manage-user/manage-user.component';
import { PostManagementComponent } from './post-management/post-management.component';
import { ComplaintsComponent } from './complaints/complaints.component';
import { FormsModule } from '@angular/forms';
import { PostImageComponent } from './post-image/post-image.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { TopBarComponent } from './top-bar/top-bar.component';

@NgModule({
  declarations: [
    DashboardComponent,
    UserManagementComponent,
    PostManagementComponent,
    ComplaintsComponent,
    PostImageComponent,
    SideBarComponent,
    TopBarComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        MatIconModule,
        FormsModule
    ]
})
export class AdminModule {}
