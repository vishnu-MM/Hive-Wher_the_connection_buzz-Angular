import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { User } from 'src/Shared/Models/user.model';
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
                private signUpService: RegistrationService){}
                
    ngOnInit(): void {
        const googleAuthCode = this.route.snapshot.queryParamMap.get("code");
        const googleAuthPrompt = this.route.snapshot.queryParamMap.get("prompt");
        const googleAuthScope = this.route.snapshot.queryParamMap.get("scope");
        console.log("googleAuthCode: "+ googleAuthCode);
        console.log("googleAuthPrompt: "+ googleAuthPrompt);
        console.log("googleAuthScope: "+ googleAuthScope);
        if(googleAuthCode) {
            this.signUpService.googleAuthRegister(googleAuthCode).subscribe({
                next: res => {
                    this.userStore.dispatch(USER_LOGIN());
                    this.router.navigate(['/u/profile/update'])
                },
                error: err => {}
            })
        }
    }

}
