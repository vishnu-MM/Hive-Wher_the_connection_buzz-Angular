import { createAction, props } from "@ngrx/store";
import { User } from "../Models/user.model";

export const USER_LOGIN = createAction('SAVE_CURRENT_USER');
export const LOGOUT = createAction('CLEAR_CURRENT_USER');
export const LOAD_USER = createAction('USER_LOGIN_EFFECT', props<User>() );
