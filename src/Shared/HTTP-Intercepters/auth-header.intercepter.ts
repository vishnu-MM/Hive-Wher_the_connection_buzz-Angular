import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthHeaderIntercepter implements HttpInterceptor {

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (request.url.includes('/api/auth')) { 
			return next.handle(request)
		}
		else {
			const authToken : string = this.authHeader();
			const newRequest = request.clone({
				setHeaders: { Authorization : authToken }
			})
			return next.handle(newRequest)
		}
	}

	private authHeader() : string {
		const AuthToken = localStorage.getItem("AUTH_TOKEN");
		if (!AuthToken) { throw new Error("No Token"); }
		return `Bearer ${AuthToken}`;
	}
}