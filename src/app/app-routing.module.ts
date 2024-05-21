import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginPageComponent} from "./login-page/login-page.component";
import { SignUpPageComponent } from './sign-up-page/sign-up-page.component';
import { VerifyOtpPageComponent } from './otp-verify-page/verify-otp-page.component';
import {adminGuard, authGuard, loginGuard} from "./auth.guard";

const routes: Routes = [
  { path: '', redirectTo: '/u/home', pathMatch: 'full' },
  { path : 'login',
    canActivate: [loginGuard],
    component : LoginPageComponent
  },
  { path : 'signup', component : SignUpPageComponent },
  { path : 'verify-otp', component : VerifyOtpPageComponent },
  {
    path: 'u',
    canActivate: [authGuard],
    loadChildren: () => import('./user/user.module').then(m => m.UserModule)
  },
  {
    path: 'a',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: '/u/home' }
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule {}
