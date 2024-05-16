import {Component, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';

@Component({selector: 'login-page',templateUrl: './login-page.component.html',styleUrls: ['./login-page.component.css']})
export class LoginPageComponent implements OnDestroy{

  username!: string;
  password!: string;
  isLoginFailed: boolean = false;
  loginSubscription! : Subscription;

  constructor(private service : AppService,
              private router : Router,
              private userStore : Store<{UserStore : User}>) {}

  ngOnDestroy(): void {
    if ( this.loginSubscription !== undefined ) this.loginSubscription.unsubscribe()
  }

  onSubmit() {
    this.loginSubscription = this.service
      .login( this.username, this.password )
      .subscribe({
          next : (response)  => {
              if (response.token) {
                  localStorage.setItem("AUTH_TOKEN", response.token);
                  console.log("LOGIN SUCCESS");
                  this.isLoginFailed = false;
                  this.userStore.dispatch(USER_LOGIN());
              }
              else {
                  this.isLoginFailed = true;
              }
          },
          error :(error: any) => {
              this.isLoginFailed = true;
              console.log("LOGIN FAILED");
              console.error(error.message);
          }
      });
  }
}
