import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import { ComplaintsDTO, ComplaintsPage } from "../Models/complaints.model";

@Injectable({ providedIn: 'root'})
export class AdminService {
  public readonly BASE_URL: string = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  private authHeader() : HttpHeaders {
    const AuthToken = localStorage.getItem("AUTH_TOKEN");
    if (!AuthToken) { throw new Error("No Token"); }
    return new HttpHeaders().set('Authorization', `Bearer ${AuthToken}`);
  }

  public blockUser(userId : number, reason: string) : Observable<void> {
    const headers = this.authHeader();
    return this.http.put<void>(`${this.BASE_URL}/block-user?userId=${userId}&reason=${reason}`,null, { headers })
  }

  public unblockUser(userId : number) : Observable<void> {
    const headers = this.authHeader();
    return this.http.put<void>(`${this.BASE_URL}/unblock-user?userId=${userId}`,null, { headers })
  }

  public getAllComplaints(pageNo : number, pageSize : number) : Observable<ComplaintsPage> {
      const BASE_URL : string = 'http://localhost:8000/api/user';
      return this.http.get<ComplaintsPage>(`${BASE_URL}/all-complaints?pageNo=${pageNo}&pageSize=${pageSize}`);
  }
}
