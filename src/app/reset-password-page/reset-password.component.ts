import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { AppService } from 'src/Shared/Services/app.service';
import { RegistrationService } from 'src/Shared/Services/registration.service';

@Component({
  selector: 'reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
    protected email!: string;
    protected password: string = '';
    protected confirmPassword: string = '';
    protected isProcessing: boolean = false;

    constructor(private appService: AppService,
        private otpVerifiService: RegistrationService
    ){}

    ngOnInit(): void {
        const email = localStorage.getItem("EMAIL");
        if (!email) {
            this.appService.showError("Could'nt load user details");
            return;
        }
        this.email = email;
        this.startOtpTimer();
    }

    ngOnDestroy(): void {
        throw new Error('Method not implemented.');
    }

    // Password Related

    protected async onSubmit(): Promise<void> {
        if (!this.isOtpVerificationSuccess) {
            this.appService.showError('OTP Verification is In-Complete, Please Complete it.')
            return;
        }
        if (!this.isPasswordValid) {
            this.appService.showError('Week password, Try again')
            return;
        }
        if ( this.password !== this.confirmPassword) {
            this.appService.showError("Password & Confirm Passwords does'nt match.")
            return;
        }
        this.updatePassword().then();
    }

    private async updatePassword(): Promise<void> {
        this.appService.updatePassword(this.email, this.password).subscribe({
            next: res => {
                this.appService.showSuccess('Password Updated Successfullly, Please login again');
                this.appService.logout();
            },
            error: err => {
                this.appService.showError('Password Updated failed, Please try again');
                this.appService.logout();
            }
        })
    }

    private clear(): void {
        localStorage.removeItem("EMAIL");
    } 

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
        return this.confirmPassword === this.password;
    }

    get isPasswordLengthValid(): boolean {
        return this.password.length >= 8;
    }

    get isPasswordContainsAtLeastOneSmallLetter(): boolean {
        return /[a-z]/.test(this.password);
    }

    get isPasswordContainsAtLeastOneCapitalLetter(): boolean {
        return /[A-Z]/.test(this.password);
    }

    get isPasswordContainsAtLeastOneSpecialCharacter(): boolean {
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(this.password);
    }

    get isPasswordContainsAtLeastOneNumber(): boolean {
        return /\d/.test(this.password);
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

    //OTP Related
    protected isOtpVerificationSuccess: boolean = false;
    protected otp!: number;
    protected verifiying: boolean = false;
    protected resending: boolean = false;

    protected async verfifyOtp(): Promise<void> {
        if (!this.otp) {
            this.appService.showError("Invalid OTP, OTP can't be empty");
            return; 
        }
        const otpStr: string = this.otp.toString();
        if (otpStr.length !== 6) {
            this.appService.showError('Invalid OTP, OTP is 6-Digit long');
            return;
        }
        if (this.otpTimer === 0) {
            this.appService.showError('OTP expired, try again with Resend option');
            return;
        }
        this.verifiying = true;
        this.validateOtp(this.email, otpStr).then();
    }

    private async validateOtp(email: string, otp: string): Promise<void> {
        this.otpVerifiService.verifyOTP(email, otp).subscribe({
            next: res => {
                if (res === "SUCCESS") {
                    this.appService.showSuccess('OTP Verification is Successfully completed');
                    this.isOtpVerificationSuccess = true;
                } else if (res === "TIME_OUT") {
                    this.appService.showError('OTP expired, try again with Resend option');
                } else if (res === "INVALID_OTP") {
                    this.appService.showError('Invalid OTP, Please enter valid OTP');
                } else {
                    this.appService.showError('OTP Verification Failed, Something Went Wrong');
                }
                this.verifiying = false;
                this.stopOtpTimer();
            },
            error: err => {
                this.appService.showError(`Could'nt validate otp (${err.status})`)
                this.verifiying = false;
                this.stopOtpTimer();
            }
        })
    }

    protected async resentOtp(): Promise<void> {
        this.resending = true;
        this.stopOtpTimer();
        this.appService.sentOtpForPasswordRest(this.email).subscribe({
            next: res => {
                this.appService.showSuccess('OTP is again sented to your email');
                this.startOtpTimer();
                this.resending = false;
            },
            error: err => {
                this.appService.showError(`Could'nt resend OTP (${err.status})`);
                this.resending = false;
            }
        });
    }

    //Timer related 
    otpTimer: number = 180;
    otpMinutes: number = 0;
    otpSeconds: number = 0;
    private otpTimerSubscription!: Subscription;
    private otpVerifySub!: Subscription;
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
}