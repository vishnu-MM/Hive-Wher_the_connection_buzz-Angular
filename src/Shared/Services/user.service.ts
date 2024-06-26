import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, Subscription } from "rxjs";
import { User, UserPage } from "../Models/user.model";
import { Image } from "../Models/image.model";
import { ComplaintsDTO, ComplaintsPage } from "../Models/complaints.model";
import { UserFilter } from "../Models/filter.model";

export enum ImageType { COVER_IMAGE, PROFILE_IMAGE }

@Injectable({ providedIn: 'root' })
export class UserService implements OnDestroy {
    public readonly BASE_URL: string = 'http://localhost:8000/api/user';
    private profilePictureMap: Map<number, string> = new Map<number, string>();
    private ProfileSubMap = new Map<number, Subscription>();

    constructor(private http: HttpClient) {}

    ngOnDestroy(): void {
        for (const key of this.ProfileSubMap.keys()) {
            if (this.ProfileSubMap.has(key)) {
                this.ProfileSubMap.get(key)!.unsubscribe();
            }
        }
    }


    public getMyProfile(): Observable<User> {
        return this.http.get<User>(`${this.BASE_URL}/profile`);
    }

    public getProfileById(id: number): Observable<User> {
        return this.http.get<User>(`${this.BASE_URL}/profile/${id}`);
    }

    public updateProfile(user: User): Observable<User> {
        return this.http.put<User>(`${this.BASE_URL}/update`, user);
    }

    public uploadProfileImage(file: File, imageType: ImageType): Observable<Image> {
        const formData: FormData = new FormData();
        formData.append('image', file, file.name);
        formData.append('type', ImageType[imageType]);
        return this.http.post<Image>(`${this.BASE_URL}/upload/image`, formData);
    }

    public getProfileImage(userId: number, type: ImageType): Observable<Image> {
        return this.http.get<Image>(`${this.BASE_URL}/image?userID=${userId}&type=${ImageType[type]}`);
    }

    public isProfileExists(userId: number): Observable<Boolean> {
        return this.http.get<Boolean>(`${this.BASE_URL}/exists-profile/${userId}`);
    }

    // /user-count Get Number
    public getUserCount(): Observable<Number> {
        return this.http.get<Number>(`${this.BASE_URL}/user-count`);
    }

    public getAllUsers(pageNo: number, pageSize: number): Observable<UserPage> {
        return this.http.get<UserPage>(`${this.BASE_URL}/all-users?pageNo=${pageNo}&pageSize=${pageSize}`);
    }

    public search(searchText: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.BASE_URL}/search?searchQuery=${searchText}`);
    }

    public complaintsSearch(searchText: string): Observable<ComplaintsDTO[]> {
        return this.http.get<ComplaintsDTO[]>(`${this.BASE_URL}/complaints-search?searchQuery=${searchText}`);
    }

    public reportAUser(complaintsDTO: ComplaintsDTO): Observable<void> {
        return this.http.post<void>(`${this.BASE_URL}/report-user`, complaintsDTO);
    }

    public async loadProfilePiture(userList: User[], imageType: ImageType): Promise<Map<number, string>> {
        for (let user of userList) {
            if (this.ProfileSubMap.has(user.id!)) {
                this.ProfileSubMap.get(user.id!)!.unsubscribe();
            }
            this.getProfileImage(user.id!, imageType)
                .subscribe({
                    next: res => {
                        const imageUrl = 'data:image/png;base64,' + res.image;
                        this.profilePictureMap.set(user.id!, imageUrl);
                    },
                    error: (error) => {
                        const imageUrl = 'assets/no-profile-image.jpg';
                        this.profilePictureMap.set(user.id!, imageUrl);
                    }
                })
        }
        return this.profilePictureMap;
    }

    public fetchData(filter: string): Observable<Map<string, number>> {
        return this.http.get<Map<string, number>>(`${this.BASE_URL}/user-count-date?filterBy=${filter}`);
    }

    public filter(userFilter: UserFilter): Observable<UserPage> {
        const url = `${this.BASE_URL}/filter`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<UserPage>(url, userFilter, { headers });
    }

    public complaintFilter(filter: UserFilter): Observable<ComplaintsPage> {
        const url = `${this.BASE_URL}/complaint-filter`;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<ComplaintsPage>(url, filter, { headers });
    }
}
