import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from "rxjs";
import { RegistrationService } from "../../Shared/Services/registration.service";
import { Router } from "@angular/router";
import { USER_LOGIN } from "../../Shared/Store/user.action";
import { Store } from "@ngrx/store";
import { User, UserResponse } from "../../Shared/Models/user.model";

@Component({
    selector: 'app-verify-otp-page',
    templateUrl: './verify-otp-page.component.html',
    styleUrls: ['./verify-otp-page.component.css']
})
export class VerifyOtpPageComponent implements OnInit, OnDestroy {
    //FOR TIMER
    otpTimer: number = 180;
    otpMinutes: number = 0;
    otpSeconds: number = 0;

    //FOR DATA
    otp: string = "";
    private email!: string | null;

    //FOR SUBSCRIPTION CLOSING
    private otpTimerSubscription!: Subscription;
    private otpVerifySub!: Subscription;

    //FOR ERROR HANDLING
    timeOut!: boolean;
    invalidOtp!: boolean;
    someThingWentWrong!: boolean;

    constructor(private signUpService: RegistrationService,
        private router: Router,
        private userStore: Store<{ UserStore: User }>) { }

    ngOnInit(): void {
        const userRes = localStorage.getItem("CURRENT_USER")
        if(!userRes) {
            return;
        }
        const user: UserResponse = JSON.parse(userRes);
        if ((!user.email) && user.email === ''){
            return;
        }
        this.email = user.email!;
        this.startOtpTimer();
    }

    ngOnDestroy(): void {
        this.stopOtpTimer();
        if (this.otpVerifySub) this.otpVerifySub.unsubscribe();
    }


    resendOtp(): void {
        this.stopOtpTimer();
        if (this.email !== null) {
            this.signUpService.sendOTP(this.email).subscribe({
                next: (response) => console.log(response),
                error: (error) => console.error(error)
            })
        }
        this.otpTimer = 180;
        this.startOtpTimer();
    }

    verifyOtp(): void {
        if (this.timeOut)
            this.timeOut = false;
        if (this.invalidOtp)
            this.invalidOtp = false;
        if (this.someThingWentWrong)
            this.someThingWentWrong = false;
        if (this.email) {
            this.otpVerifySub = this.signUpService.verifyOTP(this.email, this.otp).subscribe({
                    next: (response) => {
                        if (response === "SUCCESS") {
                            this.userStore.dispatch(USER_LOGIN());
                            this.router.navigate(['/u/profile/update'])
                        } else if (response === "TIME_OUT") {
                            this.timeOut = true;
                        } else if (response === "INVALID_OTP") {
                            this.invalidOtp = true
                        } else {
                            this.someThingWentWrong = true;
                        }
                    },
                    error: (error) => {
                        this.someThingWentWrong = true;
                        console.error(error);
                    }
                });
        }
    }

    startOtpTimer(): void {
        this.updateOtpDisplay();
        this.otpTimerSubscription = interval(1000)
            .subscribe(() => {
                if (this.otpTimer > 0) {
                    this.otpTimer--;
                    this.updateOtpDisplay();
                }
                else {
                    this.stopOtpTimer();
                }
            });
    }

    stopOtpTimer(): void {
        if (this.otpTimerSubscription) this.otpTimerSubscription.unsubscribe();
    }

    updateOtpDisplay(): void {
        this.otpMinutes = Math.floor(this.otpTimer / 60);
        this.otpSeconds = this.otpTimer % 60;
    }

    validateOtp() {
        if (this.otp.length > 6) this.otp = this.otp.substring(0, 6);
    }

    get containsOnlyNumbers(): boolean {
        return /^[0-9]+$/.test(this.otp);
    }

    get getMaskedEmail(): string {
        if (this.email) {
            const parts = this.email.split('@');
            const username = parts[0];
            const maskedUsername = username.slice(0, -2).replace(/./g, '*') + username.slice(-2);
            return maskedUsername + '@' + parts[1];
        }
        return "";
    }
}
