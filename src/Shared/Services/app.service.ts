import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, catchError, throwError} from 'rxjs';
import {User} from '../Models/user.model';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';

@Injectable({providedIn: 'root'})
export class AppService {

	public readonly BASE_URL: string = 'http://localhost:8000/api';

	constructor(private http: HttpClient, private router: Router,private toast: NgToastService) {}

	public login(username: string, password: string): Observable<any> {
		const body = {username, password};
		return this.http
			.post<any>(`${this.BASE_URL}/auth/login`, body)
			.pipe(catchError(this.errorHandler));
	}

	public loadUserDetails(): Observable<User> {
		const headers = new HttpHeaders({"Authorization": `Bearer ${this.getToken()}`});
		return this.http.get<User>(`${this.BASE_URL}/user/profile`, {headers});
	}

	public getToken(): string {
		const token = localStorage.getItem("AUTH_TOKEN");
		if (token !== null) return token;
		throw new Error("Tocken is Empty");
	}

    private errorHandler(error: HttpErrorResponse): Observable<any> {
        console.log(error);
        if (error.status === 0) {
            return throwError(() => new Error('Something happened! Network Error'));
        }
        if (error.error && error.error.message) {
            return throwError(() => new Error(error.error.message));
        }
        return throwError(() => new Error('Something happened! Internal Server Error'));
    }    

    public logout(): void {
        localStorage.clear();
        this.router.navigate(['/login'])
    }

    
    public showSuccess(summary: string) {
        this.toast.success({ detail: "SUCCESS", summary: summary, duration: 5000 });
    }

    public showError(summary: string) {
        this.toast.error({ detail: "ERROR", summary: summary, duration: 5000 });
    }

    public showInfo(summary: string, sticky: boolean) {
        if (sticky)
            this.toast.info({detail:"INFO", summary: summary, sticky:true});
        else
            this.toast.info({ detail: "INFO", summary: summary, duration: 5000 });
    }

    public showWarn(summary: string) {
        this.toast.warning({ detail: "WARN", summary: summary, duration: 5000 });
    }
}