import { createReducer, on } from "@ngrx/store";
import { UserState } from "./user.state";
import { LOAD_USER, USER_LOGIN } from "./user.action";

export function userReducer(state : any , action : any ) {
  let newState = _userReducer( state, action )
  return newState;
}

const _userReducer = createReducer( UserState,
  on(USER_LOGIN, (state) => { return { ...state } }),
  on(LOAD_USER, (state,action) => {
    return {
        ...state,
        id : action.id,
        name: action.name,
        username: action.username,
        email: action.email,
        phone: action.phone,
        role : action.role,
        aboutMe : action.aboutMe,
        joinDate : action.joinDate
    }
  })
);