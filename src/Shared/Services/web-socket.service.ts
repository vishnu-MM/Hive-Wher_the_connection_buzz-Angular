import {CompatClient, Stomp} from "@stomp/stompjs";
import {Observable, Subject} from "rxjs";
import {Injectable} from "@angular/core";
import SockJS from "sockjs-client";

@Injectable({providedIn: 'root'})
export class WebSocketService {
	public readonly WEB_SOCKET_URL: string = 'http://localhost:8083/ws';
	private notificationStompClient: CompatClient | null = null;
	public notificationSubject: Subject<string> = new Subject<string>();
	public notification$ : Observable<string> = this.notificationSubject.asObservable();
	
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
	
	loadNotification(notification: string): void {
		console.log("getting Notification " + notification)
		this.notificationSubject.next(notification);
	}
	
	disconnectNotificationConnection(): void {
		console.log('getting call')
		if (this.notificationStompClient)
			this.notificationStompClient.disconnect(() => { console.log('Disconnected from WebSocket') });
	}
}