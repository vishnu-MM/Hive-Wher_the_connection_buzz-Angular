import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import {AdminRoutingModule} from "./admin-routing.module";
import {MatIconModule} from "@angular/material/icon";



@NgModule({
  declarations: [
    DashboardComponent
  ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        MatIconModule
    ]
})
export class AdminModule { }
