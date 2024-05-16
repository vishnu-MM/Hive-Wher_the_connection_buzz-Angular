import { Injectable } from "@angular/core";
import { AppService } from "../Services/app.service";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { LOAD_USER, USER_LOGIN } from "./user.action";
import { EMPTY, catchError, exhaustMap, map } from "rxjs";

@Injectable()
export class UserEffects {
  constructor( private actions: Actions, private service: AppService) { }

  _loadUser = createEffect( () => this.actions
      .pipe(
          ofType(USER_LOGIN),
          exhaustMap( (action) => {
              const userStateStr = localStorage.getItem('USER_DETAILS');
              if (userStateStr) {
                localStorage.removeItem('USER_DETAILS');
              }
              return this.service
                      .loadUserDetails()
                      .pipe(
                          map( (response) => {
                              localStorage.setItem('USER_DETAILS', JSON.stringify( response ) )
                              return LOAD_USER( response )
                          }),
                          catchError(() => EMPTY)
                      )
          })
      )
  );
}