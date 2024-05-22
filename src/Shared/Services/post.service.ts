import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Post, PostCreation, PostPage} from "../Models/post.model";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Image} from "../Models/image.model";
import {UserPage} from "../Models/user.model";

@Injectable({ providedIn: 'root'})
export class PostService {
  public readonly BASE_URL : string = 'http://localhost:8000/api/post';
  constructor(private http : HttpClient) {}

  private authHeader() : HttpHeaders {
    const AuthToken = localStorage.getItem("AUTH_TOKEN");
    if (!AuthToken) { throw new Error("No Token"); }
    return new HttpHeaders().set('Authorization', `Bearer ${AuthToken}`);
  }

  public createPost(file: File, postRequest: PostCreation): Observable<Post> {
    const headers = this.authHeader();

    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('description', postRequest.description);
    formData.append('postType', postRequest.postType.toString());
    formData.append('userId', postRequest.userId.toString());

    return this.http.post<Post>(`${this.BASE_URL}/create`, formData, { headers });
  }

  public getRandomPosts() : Observable<Post[]> {
    const headers = this.authHeader();
    return this.http.get<Post[]>(`${this.BASE_URL}/random?pageNo=0&pageSize=20`, { headers });
  }

  public getImage(postId: number): Observable<Blob> {
    const headers = this.authHeader();
    return this.http.get(`${this.BASE_URL}/files/${postId}`, { headers, responseType: 'blob' });
  }

  public getAllPosts(pageNo: number) : Observable<PostPage> {
    const headers = this.authHeader();
    return this.http.get<PostPage>(`${this.BASE_URL}/all-posts?pageNo=${pageNo}&pageSize=8`,{ headers });
  }

// @GetMapping("single-post")
// public ResponseEntity<PostDTO> getPost(@RequestParam("postId") Long postId){
//   return new ResponseEntity<>(service.getPost(postId), HttpStatus.OK);
// }
//
//
// @GetMapping("")
// public ResponseEntity<List<PostDTO>> getPostsForUser(@RequestParam("postId") Long userId){
//   return new ResponseEntity<>(service.getPostsForUser(userId), HttpStatus.OK);
// }
//
// @DeleteMapping("delete")
// public ResponseEntity<Void> deletePost(@RequestParam("postId") Long postId){
//   try{
//     service.deletePost(postId);
//     return ResponseEntity.status(HttpStatus.OK).build();
//   }
//   catch(Exception e){
//     return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//   }
// }
//
// //POST END-POINTS ENDED
// //COMMENT END-POINTS STARTS HERE
//
// @PostMapping("add-comment")
// public ResponseEntity<CommentDTO> createComment(@RequestBody CommentRequestDTO commentRequest){
//   return new ResponseEntity<>(service.createComment(commentRequest), HttpStatus.CREATED);
// }
//
// @DeleteMapping("remove-comment")
// public ResponseEntity<Void> deleteComment(@RequestParam("commentId") Long commentId){
//   try{
//     service.deleteComment(commentId);
//     return ResponseEntity.status(HttpStatus.OK).build();
//   }
//   catch(Exception e){
//     return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//   }
// }
//
// @GetMapping("all-comments")
// public ResponseEntity<List<CommentDTO>> getCommentsForPost(@RequestParam("postId") Long postId){
//   return new ResponseEntity<>(service.getCommentsForPost(postId), HttpStatus.OK);
// }
//
// @GetMapping("single-comment")
// public ResponseEntity<CommentDTO> getComment(@RequestParam("commentId") Long commentId){
//   return new ResponseEntity<>(service.getComment(commentId), HttpStatus.OK);
// }
//
// @GetMapping("total-comment")
// public ResponseEntity<Long> getCommentCount(@RequestParam("postId") Long postId){
//   return ResponseEntity.ok(service.commentCount(postId));
// }
//
// //COMMENT END-POINTS ENDED
// //LIKE END-POINTS STARTS HERE
//
// @PostMapping("add-like")
// public ResponseEntity<LikeDTO> createLike(@RequestBody LikeRequestDTO likeDTO){
//   return new ResponseEntity<>(service.createLike(likeDTO), HttpStatus.OK);
// }
//
// @GetMapping("single-like")
// public ResponseEntity<LikeDTO> getLike(@RequestParam("likeId") Long likeId){
//   return ResponseEntity.ok().body(service.getLike(likeId));
// }
//
// @GetMapping("all-like")
// public ResponseEntity<List<LikeDTO>> getLikesForPost(@RequestParam("postId") Long postId){
//   return new ResponseEntity<>(service.getLikesForPost(postId), HttpStatus.OK);
// }
//
// @DeleteMapping("remove-like")
// public ResponseEntity<Void> deleteLike(@RequestParam("likeId") Long likeId){
//   try{
//     service.deleteLike(likeId);
//     return ResponseEntity.status(HttpStatus.OK).build();
//   }
//   catch(Exception e){
//     return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//   }
// }
//
// @GetMapping("total-like")
// public ResponseEntity<Long> getLikeCount(@RequestParam("postId")  Long postId){
//   return ResponseEntity.ok(service.likeCount(postId));
// }
}

