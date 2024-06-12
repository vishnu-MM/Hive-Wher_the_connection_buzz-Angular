import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {UserManagementComponent} from "./user-management/user-management.component";
import {PostManagementComponent} from "./post-management/post-management.component";
import { ComplaintsComponent } from './complaints/complaints.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component:  DashboardComponent },
  { path: 'users', component:  UserManagementComponent },
  { path: 'posts', component:  PostManagementComponent },
  { path: 'complaints', component:  ComplaintsComponent },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AdminRoutingModule { }
