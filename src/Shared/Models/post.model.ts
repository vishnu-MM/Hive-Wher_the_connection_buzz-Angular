import {Timestamp} from "rxjs";
import {User} from "./user.model";

export interface Post {
  id: number;
  description: string;
  firstName: string;
  fileType: string;
  filePath: string;
  createdOn: Timestamp<string>;
  userId: number;
  isBlocked: boolean;
  postType: PostType;
}
export interface PostCreation {
  description : string;
  userId: number;
  postType: PostType;
}
export enum PostType {  IMAGE="IMAGE",VIDEO="VIDEO",TEXT_ONLY="TEXT_ONLY" }
export interface PostPage{
  contents : Post[];
  pageNo : number;
  pageSize : number;
  totalElements : number;
  totalPages : number;
  isLast : boolean;
  hasNext : boolean;
}
