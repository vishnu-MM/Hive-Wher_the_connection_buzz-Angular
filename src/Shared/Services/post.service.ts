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
    private postFileMap: Map<number, PostFile> = new Map<number, PostFile>();

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

    public getImage(postId: number): Observable<Blob> {
        return this.http.get(`${this.BASE_URL}/files/${postId}`, { responseType: 'blob' });
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

    async getPostFile(postList: Post[]): Promise<Map<number, PostFile>> {
        for (const post of postList) {
            if (this.postFileSubMap.has(post.id!)) {
                this.postFileSubMap.get(post.id!)!.unsubscribe();
            }
            this.getImage(post.id).subscribe({
                next: (blob) => {
                    const reader = new FileReader();
                    reader.onload = (event: any) => {
                        const fileStr = event.target.result;
                        const aspectRatio = this.getAspectRatio(post, event)
                        const postFile : PostFile = {
                            postId: post.id,
                            fileString: fileStr,
                            fileType: post.postType,
                            aspectRatio: aspectRatio
                        }
                        this.postFileMap.set(post.id, postFile );
                    };
                    reader.readAsDataURL(blob);
                },
                error: (error) => console.error('File loading failed', error)
            });
        }
        return this.postFileMap;
    }

    private getAspectRatio(post : Post, event : any) : string {
        let aspectRatio = 1;
        if (post.postType === PostType.IMAGE) {
            const img = new Image();
            img.onload = () => { aspectRatio = img.width / img.height; };
            img.src = event.target.result;
        }
        else if (post.postType === PostType.VIDEO) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => { aspectRatio = video.videoWidth / video.videoHeight; };
            video.src = event.target.result;
        }

        if (aspectRatio > 1.5)
			return 'aspect-ratio-16-9';
		else if (aspectRatio < 0.6)
			return 'aspect-ratio-9-16';
		else if (aspectRatio < 1 && aspectRatio >= 0.8)
			return 'aspect-ratio-4-5';
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