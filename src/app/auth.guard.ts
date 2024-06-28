import { CanActivateFn, Router } from '@angular/router';
import { inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { User, UserResponse } from "../Shared/Models/user.model";
import { USER_LOGIN } from "../Shared/Store/user.action";
import { Role } from "../Shared/Models/role";
import { catchError, map, of, take } from "rxjs";
import { UserService } from "../Shared/Services/user.service";
import { AppService } from 'src/Shared/Services/app.service';


export const authGuard: CanActivateFn = (route, state) => {
    const router: Router = inject(Router);
    const token = localStorage.getItem('AUTH_TOKEN');
    if (token) { return true; }
    else {
        router.navigate(['/login']);
        return false;
    }
};

export const loginGuard: CanActivateFn = (route, state) => {
    const router: Router = inject(Router);
    const userStore: Store<{ UserStore: User }> = inject(Store<{ UserStore: User }>);
    const token = localStorage.getItem('AUTH_TOKEN');

    return userStore
        .select('UserStore')
        .pipe(
            take(1),
            map(currentUser => {
                if (token) {
                    if (currentUser && currentUser.role === Role.USER) { router.navigate(['/u/home']) }
                    else if (currentUser && currentUser.role === Role.ADMIN) { router.navigate(['/a/dashboard']) }
                    return false;
                }
                else { return true; }
            })
        );
};

export const adminGuard: CanActivateFn = (route, state) => {
    const router: Router = inject(Router);
    const userService: UserService = inject(UserService);
    const appService: AppService = inject(AppService)
    const token = localStorage.getItem('AUTH_TOKEN');
    if (!token) {
        router.navigate(['/login']);
        return false;
    }
    const userStr = localStorage.getItem('CURRENT_USER');
    if (userStr) {
        const user: UserResponse = JSON.parse(userStr);
        if (user.role === Role.ADMIN) {
            return true;
        }
        else if (user.role === Role.USER) {
            router.navigate(['/u/home'])
            return false;
        }
        else {
            console.log("User is neither User nor Admin");            
            appService.logout();
            return false;
        }
    }
    else {
        console.log("CURRENT_USER is null");
        appService.logout();
        return false;
    }
};
