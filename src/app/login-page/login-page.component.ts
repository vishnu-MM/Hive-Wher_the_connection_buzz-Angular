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
  loginSub! : Subscription;

  constructor(private service : AppService,
              private router : Router,
              private userStore : Store<{UserStore : User}>) {}

  ngOnDestroy(): void {
    if ( this.loginSub !== undefined ) this.loginSub.unsubscribe()
    this.userStore
      .select('UserStore')
      .subscribe(data => {
        let user = {...data}
        console.log(user)
      });
  }

  onSubmit() {
    this.loginSub = this.service
        .login( this.username, this.password )
        .subscribe({
            next : (response)  => {
                if (response.token) {
                    localStorage.setItem("AUTH_TOKEN", response.token);
                    this.isLoginFailed = false;
                    this.userStore.dispatch(USER_LOGIN());
                    this.router.navigate(['/home'])
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
