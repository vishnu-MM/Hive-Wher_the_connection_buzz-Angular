import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { SpinnerService } from "../Services/spinner.service";

@Injectable({ providedIn: "root" })
export class LoadingSpinnerIntercepter implements HttpInterceptor {
  constructor(private spinnerService : SpinnerService) {}
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      this.spinnerService.requestStarted();
			return next.handle(request)
	}

  handle(next : any, request : any ) {
    return next.handle(request).pipe(
      tap({
        next: response => {
          if (response instanceof HttpResponse) {
            console.log('completed');
            
              this.spinnerService.requestEnded();
          }
        },
        error: error =>{
          if (error instanceof HttpErrorResponse) {
              this.spinnerService.resetSpinnet();
          }
        }
      })
    )
  }
}