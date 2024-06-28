import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { User } from 'src/Shared/Models/user.model';
import { AppService } from 'src/Shared/Services/app.service';
import { RegistrationService } from 'src/Shared/Services/registration.service';
import { USER_LOGIN } from 'src/Shared/Store/user.action';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit{

    constructor(private route: ActivatedRoute, 
                private userStore: Store<{ UserStore: User }>,
                private router: Router,
                private appService : AppService,
                private signUpService: RegistrationService){}
                
    ngOnInit(): void {
        const googleAuthCode = this.route.snapshot.queryParamMap.get("code");
        const googleAuthPrompt = this.route.snapshot.queryParamMap.get("prompt");
        const googleAuthScope = this.route.snapshot.queryParamMap.get("scope");
        if(googleAuthCode) {
            this.signUpService.googleAuthRegister(googleAuthCode).subscribe({
                next: response => {
                    localStorage.setItem("AUTH_TOKEN", response.token);
                    localStorage.setItem("CURRENT_USER", JSON.stringify({ role: response.role, id: response.userId }));
                    this.appService.showSuccess("Registration Successfully Completed");
                    this.userStore.dispatch(USER_LOGIN());
                    this.router.navigate(['/u/profile/update']);
                },
                error: err => {
                    this.appService.showError(err.error.message || "An unexpected error occurred");
                    setTimeout(() => { this.router.navigate(['signup']) }, 3000);
                }
            });
            
        }
    }

}
