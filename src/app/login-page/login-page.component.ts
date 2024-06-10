import {Component, OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';
import {Role} from "../../Shared/Models/role";
import {WebSocketService} from "../../Shared/Services/web-socket.service";

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnDestroy{
    // DATA
    username: string= '';
    password: string= '';

    // ERROR HANDLING
    somethingWentWrong: boolean = false;
    isLoginFailed: boolean = false;
    loginClickedWithNoUsername: boolean = false;
    loginClickedWithNoPassword: boolean = false;

    // SUBSCRIPTIONS
    private userStoreSub!: Subscription;
    private loginSub! : Subscription;

    // LIFE CYCLE AND CONSTRUCTOR
    constructor(private service : AppService,
                private router : Router,
                private userStore : Store<{UserStore : User}>,
                private webSocketService : WebSocketService ) {}

    ngOnDestroy(): void {
      if ( this.loginSub !== undefined ) this.loginSub.unsubscribe()
      if ( this.userStoreSub !== undefined ) this.userStoreSub.unsubscribe()
    }

    // LOGIC
    onSubmit() {
      this.isLoginFailed = false;
      this.somethingWentWrong = false;
      this.loginClickedWithNoUsername = this.username === '';
      this.loginClickedWithNoPassword = this.password === '';

      if ( (!this.loginClickedWithNoUsername) && (!this.loginClickedWithNoPassword))
          this.loginSub = this.service
              .login( this.username, this.password )
              .subscribe({
                  next : (response)  => {
                      this.isLoginFailed = (response.token);

                      if (this.isLoginFailed) {
                          localStorage.setItem("AUTH_TOKEN", response.token);
                          localStorage.setItem("CURRENT_USER", JSON.stringify({role : response.role, id : response.userId}));
                          this.userStore.dispatch(USER_LOGIN());

                          if (response.role === Role.USER) {
                              this.webSocketService.initNotificationConnection(response.userId);
                              this.router.navigate(['/u/home']).then();
                          }
                          else if (response.role === Role.ADMIN)
                              this.router.navigate(['/a/dashboard'])
                          else
                              this.somethingWentWrong = true;
                        }
                  },
                  error :(error: any) => {
                      this.isLoginFailed = true;
                      console.log("LOGIN FAILED\n" + error.message);
                  }
            });
    }
}
