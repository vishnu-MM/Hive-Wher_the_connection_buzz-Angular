import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {User, UserPage} from "../Models/user.model";
import {Image} from "../Models/image.model";
import { ComplaintsDTO } from "../Models/complaints.model";

@Injectable({ providedIn: 'root'})
export class UserService {
  public readonly BASE_URL : string = 'http://localhost:8000/api/user';
  constructor(private http : HttpClient) {}

  private authHeader() : HttpHeaders {
      const AuthToken = localStorage.getItem("AUTH_TOKEN");
      if (!AuthToken) { throw new Error("No Token"); }
      return new HttpHeaders().set('Authorization', `Bearer ${AuthToken}`);
  }

  // /profile : Get : @RequestHeader(name = "Authorization")
  public getMyProfile() : Observable<User> {
      const headers = this.authHeader();
      return this.http.get<User>(`${this.BASE_URL}/profile`, { headers });
  }

  // /profile/{id} : Get
  public getProfileById(id : number) : Observable<User> {
    const headers = this.authHeader();
    return this.http.get<User>(`${this.BASE_URL}/profile/${id}`, { headers });
  }

  // /update Put @RequestBody UserDTO
  public updateProfile(user : User) : Observable<User> {
    const headers = this.authHeader();
    return this.http.put<User>(`${this.BASE_URL}/update`, user, { headers });
  }

  // /upload/image Post @RequestParam("image") @RequestParam("type")
  public uploadProfileImage(file : File, imageType : ImageType ) : Observable<Image> {
    const headers = this.authHeader();
    const formData: FormData = new FormData();
    formData.append('image', file, file.name);
    formData.append('type', ImageType[imageType]);
    return this.http.post<Image>(`${this.BASE_URL}/upload/image`, formData, { headers });
  }

  // /image Get @RequestParam("userID") @RequestParam("type")
  public getProfileImage(userId : number, type : ImageType) : Observable<Image> {
    const headers = this.authHeader();
    return this.http.get<Image>(`${this.BASE_URL}/image?userID=${userId}&type=${ImageType[type]}`, { headers });
  }

  // /exists-profile/{id} Get Boolean
  public isProfileExists(userId : number) : Observable<Boolean> {
    const headers = this.authHeader();
    return this.http.get<Boolean>(`${this.BASE_URL}/exists-profile/${userId}`, { headers });
  }

  // /user-count Get Number
  public getUserCount() : Observable<Number> {
    const headers = this.authHeader();
    return this.http.get<Number>(`${this.BASE_URL}/user-count`, { headers });
  }

  public getAllUsers(pageNo: number) : Observable<UserPage> {
    const headers = this.authHeader();
    const pageSize = 12;
    return this.http.get<UserPage>(`${this.BASE_URL}/all-users?pageNo=${pageNo}&pageSize=${pageSize}`,{ headers });
  }

  public search(searchText : string) : Observable<User[]> {
    return this.http.get<User[]>(`${this.BASE_URL}/search?searchQuery=${searchText}`);
  }

  public reportAUser(complaintsDTO: ComplaintsDTO): Observable<void> {
    console.log(complaintsDTO);
    return this.http.post<void>(`${this.BASE_URL}/report-user`, complaintsDTO);
  }

}

export enum ImageType { COVER_IMAGE,PROFILE_IMAGE }
