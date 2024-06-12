import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root'})
export class AdminService {
  public readonly BASE_URL: string = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {
  }
  private authHeader() : HttpHeaders {
    const AuthToken = localStorage.getItem("AUTH_TOKEN");
    if (!AuthToken) { throw new Error("No Token"); }
    return new HttpHeaders().set('Authorization', `Bearer ${AuthToken}`);
  }

  public blockUser(userid : number) : Observable<void> {
    const headers = this.authHeader();
    return this.http.put<void>(`${this.BASE_URL}/block-user?userId=${userid}`,null, { headers })
  }

  public unblockUser(userid : number) : Observable<void> {
    const headers = this.authHeader();
    return this.http.put<void>(`${this.BASE_URL}/unblock-user?userId=${userid}`,null, { headers })
  }

  // @GetMapping("all-complaints")
  // public ResponseEntity<ComplaintsPage> getAllComplaints(@RequestParam(defaultValue = "0") Integer pageNo,
  //                                                        @RequestParam(defaultValue = "10") Integer pageSize) {
  //     return ResponseEntity.ok(complaintsService.findAll(pageNo, pageSize));
  // }
}
