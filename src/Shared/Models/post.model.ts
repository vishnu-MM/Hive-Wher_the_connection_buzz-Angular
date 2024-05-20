import {Timestamp} from "rxjs";

export interface Post {
  id: number;
  description: string;
  firstName: string;
  fileType: string;
  filePath: string;
  createdAt: Timestamp<string>;
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
