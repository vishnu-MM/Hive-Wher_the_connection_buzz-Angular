import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';
import { Role } from '../../Shared/Models/role';
import { WebSocketService } from '../../Shared/Services/web-socket.service';

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnDestroy {
    // DATA
    protected username: string = '';
    protected password: string = '';
    protected isLoginProcessing: boolean = false; 

    // ERROR HANDLING
    protected invalidUserType: boolean = false;
    protected isLoginFailed: boolean = false;
    protected loginClicked: boolean = false;
    protected errorMessage: string = '';

    // SUBSCRIPTIONS
    private userStoreSub!: Subscription;
    private loginSub!: Subscription;

    // LIFE CYCLE AND CONSTRUCTOR
    constructor(private service: AppService,
                private router: Router,
                private userStore: Store<{ UserStore: User }>,
                private webSocketService: WebSocketService) {}

    ngOnDestroy(): void {
        if (this.loginSub !== undefined) this.loginSub.unsubscribe();
        if (this.userStoreSub !== undefined) this.userStoreSub.unsubscribe();
    }

    // LOGIC

    private resetFields(): void {
        this.isLoginProcessing = true;
        this.isLoginFailed = false;
        this.errorMessage = '';
        this.loginClicked = false;
    }

    private isTryingToLogingWithOutValidCredentials() : boolean {
        this.loginClicked = true; 
        return (this.username === '' || this.password === '')
    }

    protected async onSubmit() : Promise<void> {
        if (this.isTryingToLogingWithOutValidCredentials()) {
            return;
        }   
        this.resetFields();
        this.login().then();        
    }

    private async login(): Promise<void> {
        this.loginSub = this.service.login(this.username, this.password).subscribe({
            next: (response: any) => {
                if (response.token === null)
                    this.loginFailed(response);
                else
                    this.loginSuccess(response);
                this.isLoginProcessing = false;
            },
            error: (error: any) => {
                this.loginFailed(error);
                this.isLoginProcessing = false;
            }
        });
    }


    private loginSuccess(response :any ) : void {
        if (response.role === Role.USER) {
            this.loginSuccessHelper(response);
            this.webSocketService.initNotificationConnection(response.userId);
            this.router.navigate(['/u/home']).then();
        } 
        else if (response.role === Role.ADMIN) {
            this.loginSuccessHelper(response);
            this.router.navigate(['/a/dashboard']);
        } 
        else {
            this.invalidUserType = true;
        }
    }

    private loginSuccessHelper(response :any ) : void {
        localStorage.setItem("AUTH_TOKEN", response.token);
        localStorage.setItem("CURRENT_USER", JSON.stringify({ role: response.role, id: response.userId }));
        this.userStore.dispatch(USER_LOGIN());
    }

    private loginFailed(error :any ) : void {
        this.isLoginFailed = true;
        this.errorMessage = error.message;
        console.log("LOGIN FAILED\n" + error.message);
        console.log(error);
    }
}