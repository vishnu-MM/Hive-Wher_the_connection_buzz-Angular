import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class RegistrationService {
    public readonly BASE_URL = 'http://localhost:8000/api/auth';
    constructor(private http: HttpClient) { }

    public checkIsEmailAvailable(email: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.BASE_URL}/check-email?email=${email}`);
    }

    public checkIsUsernameAvailable(username: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.BASE_URL}/check-username?username=${username}`);
    }

    public registerUser(body: UserSignUpReq): Observable<any> {
        return this.http.post<any>(`${this.BASE_URL}/register`, body);
    }

    public sendOTP(email: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.BASE_URL}/send-otp?email=${email}`, {});
    }

    public verifyOTP(email: string, otp: string): Observable<any> {
        return this.http.get<any>(`${this.BASE_URL}/verify-otp?otp=${otp}&email=${email}`);
    }

    public getGoogleAuthUrl(): Observable<{ response: string; }> {
        return this.http.get<{ response: string; }>(`${this.BASE_URL}/google-auth-url`);
    }

    /*
    @GetMapping("google-auth-register")
      public ResponseEntity<Void> callback(@RequestParam("code") String code)
    */
    public googleAuthRegister(code: string): Observable<any> {
        return this.http.post<any>(`${this.BASE_URL}/google-auth-register`, { code });
    }
    
}

export interface UserSignUpReq {
    email: string;
    username: string;
    password: string;
}
