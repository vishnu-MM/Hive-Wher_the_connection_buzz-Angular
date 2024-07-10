import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { User, UserOnline } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';
import { Role } from '../../Shared/Models/role';
import { WebSocketService } from '../../Shared/Services/web-socket.service';
import { RegistrationService } from 'src/Shared/Services/registration.service';
import { UserService } from 'src/Shared/Services/user.service';

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
    // DATA
    protected username: string = '';
    protected password: string = '';
    protected isLoginProcessing: boolean = false; 

    // ERROR HANDLING
    protected invalidUserType: boolean = false;
    protected isLoginFailed: boolean = false;
    protected loginClicked: boolean = false;
    protected errorMessage: string = '';
    protected googleAuthUrl: string = '';
    protected loading: boolean = false;

    // SUBSCRIPTIONS
    private userStoreSub!: Subscription;
    private loginSub!: Subscription;
    private loadOAuthUrlSub!: Subscription;

    // LIFE CYCLE AND CONSTRUCTOR
    constructor(private service: AppService,
                private router: Router,
                private userSerivce: UserService,
                private signUpService: RegistrationService, 
                private userStore: Store<{ UserStore: User }>,
                private webSocketService: WebSocketService) {}

    ngOnInit(): void {
        this.loading = false;
        this.loadOAuthUrl().then();
    }

    ngOnDestroy(): void {
        if (this.loginSub !== undefined) this.loginSub.unsubscribe();
        if (this.userStoreSub !== undefined) this.userStoreSub.unsubscribe();
        if (this.loadOAuthUrlSub !== undefined) this.loadOAuthUrlSub.unsubscribe();
    }

    // LOGIC

    private async loadOAuthUrl(): Promise<void> {
        this.loadOAuthUrlSub = this.signUpService.getGoogleAuthUrl().subscribe({
            next: (res: { response: string; }) => { 
                this.googleAuthUrl = res.response 
            },
        })
    }

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
            this.router.navigate(['/u/home']).then();
            this.webSocketService.initNotificationConnection(response.userId);
            this.webSocketService.initConnectionSocket(response.userId);
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

    protected get isValidEmail(): boolean {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(this.username.trim());
    }

    protected resetPassword(): void {
        this.loading = true;
        this.service.resetPassword(this.username);
    }
}