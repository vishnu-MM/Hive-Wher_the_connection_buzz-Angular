import { Role } from "../Models/role";
import { User } from "../Models/user.model";

export const UserState: User = {
  id: null,
  name: "",
  username: "",
  email: "",
  phone: "",
  aboutMe: "",
  role: Role.USER,
  joinDate: new Date()
};
