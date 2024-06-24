import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, catchError, throwError} from 'rxjs';
import {User} from '../Models/user.model';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})
export class AppService {

	public readonly BASE_URL: string = 'http://localhost:8000/api';

	constructor(private http: HttpClient, private router: Router) {}

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

    public errorHandler(error: HttpErrorResponse): Observable<any> {
        console.log(error);
        if (error.status === 0) {
            return throwError(() => new Error('Something happened! Network Error'));
        }
        if (error.error && error.error.message) {
            return throwError(() => new Error(error.error.message));
        }
        return throwError(() => new Error('Something happened! Internal Server Error'));
    }    

    logout() {
        localStorage.clear();
        this.router.navigate(['/login'])
    }
}