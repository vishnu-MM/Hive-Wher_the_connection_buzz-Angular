import {Timestamp} from "rxjs";
import {User} from "./user.model";

export interface Post {
  id: number;
  description: string;
  fileName: string;
  fileType: string;
  filePath: string;
  aspectRatio: number;
  createdOn: Timestamp<string>;
  userId: number;
  isBlocked: boolean;
  postType: PostType;
}
export interface PostCreation {
  description : string;
  userId: number;
  postType: PostType;
  aspectRatio: number;
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
export interface LikeRequest {
  userId:number;
  postId:number;
}
export interface Like {
  id : number;
  userId : number;
  likedDate : Date;
  postId : number;
}

export interface CommentDTO {
    id : number;
    comment : string;
    commentedDate : Timestamp<string>;
    userId : number;
    isBlocked : boolean;
    postId : number;
}
export interface CommentRequestDTO {
    comment : string;
    userId : number;
    postId : number;
}
