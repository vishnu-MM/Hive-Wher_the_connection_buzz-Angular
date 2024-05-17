import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {User} from "../Models/user.model";

@Injectable({ providedIn: 'root'})
export class RegistrationService {
  public readonly BASE_URL = 'http://localhost:8000/api/auth';
  constructor(private http : HttpClient) {}

  public checkIsEmailAvailable(email : string): Observable<boolean> {
      return this.http.get<boolean>(`${this.BASE_URL}/check-email?email=${email}`);
  }

  public checkIsUsernameAvailable(username : string): Observable<boolean> {
      return this.http.get<boolean>(`${this.BASE_URL}/check-username?username=${username}`);
  }

  public registerUser( body: UserSignUpReq ): Observable<any> {
      return this.http.post<any>(`${this.BASE_URL}/register`,body);
  }

  public sendOTP(email : string) : Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/send-otp?email=${email}`,{});
  }

  public verifyOTP(email : string, otp : string) : Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/verify-otp?otp=${otp}&email=${email}`);
  }
}

export interface UserSignUpReq {
  email: string;
  username : string;
  password : string;
}
