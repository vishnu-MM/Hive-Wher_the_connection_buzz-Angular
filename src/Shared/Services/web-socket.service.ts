import {CompatClient, Stomp} from "@stomp/stompjs";
import {Observable, Subject} from "rxjs";
import {Injectable} from "@angular/core";
import SockJS from "sockjs-client";
import { NotificationDTO, NotificationPage } from "../Models/NotificationDTO";
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class WebSocketService {
	public readonly WEB_SOCKET_URL: string = 'http://localhost:8083/ws';
	private notificationStompClient: CompatClient | null = null;
	public notificationSubject: Subject<NotificationDTO> = new Subject<NotificationDTO>();
	public notification$ : Observable<NotificationDTO> = this.notificationSubject.asObservable();

  constructor(private http: HttpClient) {}

	public initNotificationConnection(userId: number): void {
		const destination : string = `/user/${userId}/queue/notification`;
		const socket: WebSocket = new SockJS(this.WEB_SOCKET_URL);

		this.notificationStompClient = Stomp.over(socket);

		this.notificationStompClient.connect({}, () => {
			if (this.notificationStompClient) {
				console.log('Connected to WebSocket');
				this.notificationStompClient.subscribe(
					destination,
					(notification: any) => { this.loadNotification(notification.body); }
				);
			}
		});
	}

	loadNotification(notification: NotificationDTO): void {
		console.log("getting Notification " + notification)
		this.notificationSubject.next(notification);
	}

	disconnectNotificationConnection(): void {
		console.log('getting call')
		if (this.notificationStompClient)
			this.notificationStompClient.disconnect(() => { console.log('Disconnected from WebSocket') });
	}

  private baseUrl = 'http://localhost:8083';
  public getNotifications(userId: number, pageNo: number): Observable<NotificationPage> {
    const pageSize = 10;
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('pageSize', pageSize.toString())
      .set('pageNo', pageNo.toString());

    return this.http.get<NotificationPage>(`${this.baseUrl}/notifications`, { params });
  }
}