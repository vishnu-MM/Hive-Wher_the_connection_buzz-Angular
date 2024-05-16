
/*
const routes: Routes = [
  { path : '', redirectTo : '/login', pathMatch: 'full'},
  { path : 'logout', redirectTo : '/login', pathMatch: 'full'},
  { path : 'login', component : LoginPageComponent },
  { path : 'signup', component : UserRegistrationComponent },
  {
    path : 'home',
    canActivate : [ authGuard ],
    loadChildren : () => import('src/app/user/user.module').then(m => m.UserModule)
  },
  {
    path : 'dashboard',
    canActivate : [ authGuard, adminGuard ],
    loadChildren : () => import('src/app/admin/admin.module').then(m => m.AdminModule)
  },
  { path : '**', component : UserHomeComponent }
];
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginPageComponent} from "./login-page/login-page.component";
import { SignUpPageComponent } from './sign-up-page/sign-up-page.component';
import { VerifyOtpPageComponent } from './verify-otp-page/verify-otp-page.component';

const routes: Routes = [
  { path: 'home', loadChildren: () => import('./user/user.module').then(m => m.UserModule) },
  { path : 'login', component : LoginPageComponent },
  { path : 'signup', component : SignUpPageComponent },
  { path : 'verify-otp', component : VerifyOtpPageComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule { }
