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
}