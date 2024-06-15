import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CommentDTO, CommentRequestDTO, Like, LikeRequest, Post, PostCreation, PostPage, PostType } from "../Models/post.model";
import { Injectable } from "@angular/core";
import { Observable, Subscription } from "rxjs";

export interface PostFile {
    postId: number;
    fileString: string;
    fileType: PostType;
    aspectRatio: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
    public readonly BASE_URL: string = 'http://localhost:8000/api/post';
    private postFileSubMap: Map<number, Subscription> = new Map<number, Subscription>();
    private getPostFilesSub!: Subscription;

    constructor(private http: HttpClient) { }

    public createPost(file: File, postRequest: PostCreation): Observable<Post> {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);
        formData.append('description', postRequest.description);
        formData.append('postType', postRequest.postType.toString());
        formData.append('aspectRatio', postRequest.aspectRatio.toString());
        formData.append('userId', postRequest.userId.toString());
        return this.http.post<Post>(`${this.BASE_URL}/create`, formData);
    }

    public getRandomPosts(): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.BASE_URL}/random?pageNo=0&pageSize=20`);
    }

    public getAllPosts(pageNo: number, pageSize: number): Observable<PostPage> {
        return this.http.get<PostPage>(`${this.BASE_URL}/all-posts?pageNo=${pageNo}&pageSize=${pageSize}`);
    }

    public getUserPosts(userId: number): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.BASE_URL}/user-posts`, { params: { userId: userId.toString() } });
    }

    public getPost(postId: number): Observable<Post> {
        return this.http.get<Post>(`${this.BASE_URL}/single-post`, { params: { postId: postId.toString() } });
    }

    public updatePost(post: Post): Observable<Post> {
        return this.http.put<Post>(`${this.BASE_URL}/update`, post);
    }

    private getFile(postId: number): Observable<Blob> {
        return this.http.get(`${this.BASE_URL}/files/${postId}`, { responseType: 'blob' });
    }

    public async getPostFile(postId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            this.getPostFilesSub = this.getFile(postId).subscribe({
                next: (blob) => { resolve(URL.createObjectURL(blob)) },
                error: (err) => { reject(err) }
            });
        });
    }

    public async getPostFiles(postList?: Post[], postIdList?: number[]): Promise<Map<number, string>> {
        if (!postList && !postIdList) {
            throw new Error('Either postList or postIdList must be provided.');
        }

        const postFileMap: Map<number, string> = new Map<number, string>();
        if (postIdList) {
            for(let postId of postIdList) {
                try {
                    const postFile = await this.getPostFile(postId);
                    postFileMap.set(postId, postFile);
                } 
                catch (err) {
                    console.error(`Error fetching post file for postId ${postId}:`, err);
                }
            }
        }
        else if (postList) {
            for(let post of postList) {
                try {
                    const postFile = await this.getPostFile(post.id);
                    postFileMap.set(post.id, postFile);
                } 
                catch (err) {
                    console.error(`Error fetching post file for postId ${post.id}:`, err);
                }
            }
        }
        return postFileMap;
    }

    public getAspectRatio(aspectRatio : number): string {
		if (aspectRatio > 1.5)
			return 'aspect-ratio-16-9';
		else if (aspectRatio < 0.6)
			return 'aspect-ratio-9-16';
		else if (aspectRatio < 1 && aspectRatio >= 0.8)
			return 'aspect-ratio-4-5';
		else
			return 'aspect-ratio-1-1';
    }
    
    //? POST END-POINTS ENDED
    //* COMMENT END-POINTS STARTS HERE

    public createComment(commentRequest: CommentRequestDTO): Observable<CommentDTO> {
        return this.http.post<CommentDTO>(`${this.BASE_URL}/add-comment`, commentRequest);
    }

    public getCommentsForPost(postId: number): Observable<CommentDTO[]> {
        return this.http.get<CommentDTO[]>(`${this.BASE_URL}/all-comments`, { params: { postId: postId.toString() } });
    }

    //? COMMENT END-POINTS ENDED
    //* LIKE END-POINTS STARTS HERE

    public addLike(likeDTO: LikeRequest): Observable<Like> {
        return this.http.post<Like>(`${this.BASE_URL}/add-like`, likeDTO);
    }

    public removeLike(likeDTO: LikeRequest): Observable<Like> {
        return this.http.delete<Like>(`${this.BASE_URL}/remove-like`, { body: likeDTO });
    }

    public getLikeCount(postId: number): Observable<number> {
        return this.http.get<number>(`${this.BASE_URL}/total-like`, { params: { postId: postId.toString() } });
    }

    public isUserLiked(likeDTO: LikeRequest): Observable<boolean> {
        return this.http.get<boolean>(
            `${this.BASE_URL}/is-liked`,
            { params: { userId: likeDTO.userId.toString(), postId: likeDTO.postId.toString() } }
        );
    }

    public getLikesForPost(postId: number): Observable<Like[]> {
        return this.http.get<Like[]>( 
            `${this.BASE_URL}/all-like`,
            { params: { postId: postId.toString() } }
        );
    }
}