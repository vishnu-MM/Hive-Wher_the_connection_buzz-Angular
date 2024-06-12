import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthHeaderIntercepter } from "./auth-header.intercepter";
import { LoadingSpinnerIntercepter } from "./loading.intercepter";

export const HttpIntercepterProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthHeaderIntercepter,
    multi: true
  },
  // {
  //   provide: HTTP_INTERCEPTORS,
  //   useClass: LoadingSpinnerIntercepter,
  //   multi: true
  // }
]