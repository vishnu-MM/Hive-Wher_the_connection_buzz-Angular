import {Component, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';
import {Role} from "../../Shared/Models/role";

@Component({selector: 'login-page',templateUrl: './login-page.component.html',styleUrls: ['./login-page.component.css']})
export class LoginPageComponent implements OnDestroy{

  username!: string;
  password!: string;
  somethingWentWrong: boolean = false;
  isLoginFailed: boolean = false;
  loginSub! : Subscription;
  private userStoreSub!: Subscription;

  constructor(private service : AppService,
              private router : Router,
              private userStore : Store<{UserStore : User}>) {}

  ngOnDestroy(): void {
    if ( this.loginSub !== undefined ) this.loginSub.unsubscribe()
    if ( this.userStoreSub !== undefined ) this.userStoreSub.unsubscribe()
  }

  onSubmit() {
    this.isLoginFailed = false;
    this.somethingWentWrong = false;

    this.loginSub = this.service
        .login( this.username, this.password )
        .subscribe({
            next : (response)  => {
                if (response.token) {
                    localStorage.setItem("AUTH_TOKEN", response.token);
                    this.isLoginFailed = false;
                    this.userStore.dispatch(USER_LOGIN());

                    this.userStoreSub = this.userStore
                      .select('UserStore')
                      .subscribe(data => {
                        let currentUser : User = {...data}
                        localStorage.setItem("CURRENT_USER", JSON.stringify(data));
                        console.log(data)
                        if (data.role === Role.USER) {
                            this.router.navigate(['/u/home'])
                        }
                        else if (data.role === Role.ADMIN) {
                            this.router.navigate(['/a/dashboard'])
                        }
                        else {
                            this.somethingWentWrong = true;
                        }
                    });
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
