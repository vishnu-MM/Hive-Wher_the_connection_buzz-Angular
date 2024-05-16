import {Component, OnDestroy} from '@angular/core';
import {RegistrationService, UserSignUpReq} from "../../Shared/Services/registration.service";
import {Subscription, zip} from "rxjs";

@Component({
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.component.html',
  styleUrls: ['./sign-up-page.component.css']
})
export class SignUpPageComponent implements OnDestroy{
  userSignUpReq: UserSignUpReq = {email: "", username: "", password: ""}
  confirmPassword: string = "";
  isEmailInUse ! : boolean;
  isUsernameInUse! : boolean;
  isEmailInUseSub! : Subscription;
  isUsernameInUseSub! : Subscription;
  registrationSub! : Subscription;


  constructor(private signUpService : RegistrationService) {}

  ngOnDestroy(): void {
    if ( this.isEmailInUseSub !== undefined) this.isEmailInUseSub.unsubscribe()
    if ( this.isUsernameInUseSub !== undefined) this.isUsernameInUseSub.unsubscribe()
    if ( this.registrationSub !== undefined) this.registrationSub.unsubscribe();
  }

  onSubmit(): void {
    this.registrationSub = zip(
        this.signUpService.checkIsUsernameAvailable(this.userSignUpReq.username),
        this.signUpService.checkIsEmailAvailable(this.userSignUpReq.email)
    )
    .subscribe(([isEmailInUse, isUsernameInUse]) => {
        this.isEmailInUse = isEmailInUse;
        this.isUsernameInUse = isUsernameInUse;

        if (!isEmailInUse && !isUsernameInUse) {
          this.registrationSub = this.signUpService
            .registerUser(this.userSignUpReq)
            .subscribe({
              next: (response) => {
                localStorage.setItem("AUTH_TOKEN_TEMP", response.token);
                console.log("REGISTRATION SUCCESS");
              },
              error: (error) => {
                console.error('Error while registering user:', error);
              }
            });
        }
        else if ( this.registrationSub !== undefined){
          this.registrationSub.unsubscribe();
          console.log("UNSUBED")
        }
    });
  }



  // VALIDATION LOGIC FOR EMAIL

  get isEmailValid() : boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.userSignUpReq.email);
  }

  // VALIDATION LOGIC FOR USERNAME

  get isUsernameValid(): boolean {
    return (
      this.isUsernameLengthValid &&
      (!this.isUsernameOnlyUnderscores) &&
      this.isUsernameOnlyContainsLettersNumbersAnd_
    )
  }

  get isUsernameOnlyContainsLettersNumbersAnd_(): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(this.userSignUpReq.username);
  }

  get isUsernameOnlyUnderscores(): boolean {
    const usernameOnlyUnderscoresRegex = /^_+$/;
    return usernameOnlyUnderscoresRegex.test(this.userSignUpReq.username);
  }

  get isUsernameLengthValid(): boolean {
    return this.userSignUpReq.username.length >= 4;
  }

  // VALIDATION LOGIC PASSWORD

  get isPasswordValid(): boolean {
    return (
      this.isPasswordLengthValid &&
      this.isPasswordContainsAtLeastOneNumber &&
      this.isPasswordContainsAtLeastOneSmallLetter &&
      this.isPasswordContainsAtLeastOneCapitalLetter &&
      this.isPasswordContainsAtLeastOneSpecialCharacter
    )
  }

  get isPasswordsMatch(): boolean {
    return this.confirmPassword === this.userSignUpReq.password;
  }

  get isPasswordLengthValid(): boolean {
    return this.userSignUpReq.password.length >= 8;
  }

  get isPasswordContainsAtLeastOneSmallLetter(): boolean {
    return /[a-z]/.test(this.userSignUpReq.password);
  }

  get isPasswordContainsAtLeastOneCapitalLetter(): boolean {
    return /[A-Z]/.test(this.userSignUpReq.password);
  }

  get isPasswordContainsAtLeastOneSpecialCharacter(): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(this.userSignUpReq.password);
  }

  get isPasswordContainsAtLeastOneNumber(): boolean {
    return /\d/.test(this.userSignUpReq.password);
  }

  // PREVENT SUBMISSION WITH INVALID DATA
  get isFormDataValid() : boolean {
    return (
        this.isEmailValid && this.isUsernameValid &&
        this.isPasswordValid && this.isPasswordsMatch
    );
  }
}
