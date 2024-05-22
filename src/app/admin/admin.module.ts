import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import {AdminRoutingModule} from "./admin-routing.module";
import {MatIconModule} from "@angular/material/icon";
import { UserManagementComponent } from './user-management/user-management.component';
import { PostManagementComponent } from './post-management/post-management.component';

@NgModule({
  declarations: [
    DashboardComponent,
    UserManagementComponent,
    PostManagementComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        MatIconModule
    ]
})
export class AdminModule {}
