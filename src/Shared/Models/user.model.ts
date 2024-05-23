import { Role } from "./role";

export interface User {
  id : number | null;
  name : string;
  username : string;
  email : string;
  phone : string;
  aboutMe : string;
  role : Role;
  joinDate : Date;
  isBlocked : boolean;
}
export interface UserPage{
  contents : User[];
  pageNo : number;
  pageSize : number;
  totalElements : number;
  totalPages : number;
  isLast : boolean;
  hasNext : boolean;
}
export interface UserResponse {
    id : number;
    role : Role;
}
