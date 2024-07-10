import { CompatClient, Stomp } from "@stomp/stompjs";
import { Observable, Subject } from "rxjs";
import { Injectable } from "@angular/core";
import { NotificationPage } from "../Models/NotificationDTO";
import { HttpClient, HttpParams } from "@angular/common/http";
import SockJS from "sockjs-client";
import { UserOnline } from "../Models/user.model";
import { UserService } from "./user.service";

@Injectable({ providedIn: 'root' })
export class WebSocketService {
    public readonly WEB_SOCKET_URL: string = 'http://localhost:8083/ws';
    private notificationStompClient: CompatClient | null = null;
    public notificationSubject: Subject<string> = new Subject<string>();
    public notification$: Observable<string> = this.notificationSubject.asObservable();

    constructor(private http: HttpClient, private userService: UserService) { }

    public initNotificationConnection(userId: number): void {
        const destination: string = `/user/${userId}/queue/notification`;
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

    private baseUrl = 'http://localhost:8083';
    public getNotifications(userId: number, pageNo: number): Observable<NotificationPage> {
        const pageSize = 10;
        const params = new HttpParams()
            .set('userId', userId.toString())
            .set('pageSize', pageSize.toString())
            .set('pageNo', pageNo.toString());

        return this.http.get<NotificationPage>(`${this.baseUrl}/notifications`, { params });
    }

    // Online/Offline Connection
    private onlineUpdateStompClient: CompatClient | null = null;
    public onlineUpdateSubject: Subject<string> = new Subject<string>();
    public onlineUpdate$: Observable<string> = this.onlineUpdateSubject.asObservable();

    initConnectionSocket(userId: number): void {
        const destination: string = `/user/${userId}/queue/online`;
        const socket: WebSocket = new SockJS(this.WEB_SOCKET_URL);
        this.onlineUpdateStompClient = Stomp.over(socket);

        this.onlineUpdateStompClient.connect({}, () => {
            this.sentUserOnlineUpdateHelper(userId, true);
            if (this.onlineUpdateStompClient) {
                this.onlineUpdateStompClient.subscribe(destination, (message: any) => {
                    this.showMessage(message.body);
                });
            }
        });
    }

    disconnect(): void {
        if (this.onlineUpdateStompClient) { this.onlineUpdateStompClient.disconnect(() => {}); }
    }

    showMessage(message: string): void {
        const userStatus: UserOnline = JSON.parse(message);
        let list: number[] = [];
        const savedListStr = localStorage.getItem('ONLINE_USERS');
        if (savedListStr) {
            const savedList: number[] = JSON.parse(savedListStr);
            list.unshift(...savedList);
        }
        if (userStatus.isOnline) {
            const updatedList = list.filter(userId => userId !== userStatus.userId ); 
            if (list.length === updatedList.length)
                list.unshift(userStatus.userId);
        }
        else {
            list = list.filter(userId => userId !== userStatus.userId );            
        }
        localStorage.setItem('ONLINE_USERS', JSON.stringify(list));
        this.onlineUpdateSubject.next(message);
    }

    sendMessage(message: UserOnline): Observable<void> {
        return new Observable<void>((observer) => {
            if (!this.onlineUpdateStompClient || !this.onlineUpdateStompClient.connected) {
                observer.error('WebSocket connection not established.');
                return;
            }
            const destination = '/app/update';
            const body = JSON.stringify(message);
            this.onlineUpdateStompClient.publish({ destination: destination, body: body });
            observer.next();
            observer.complete();
        });
    }

    public async sentUserOnlineUpdateHelper(userId: number, isOnline: boolean): Promise<void> {
        this.userService.getUserFriendsids(userId).subscribe({
            next: res => {
                if (res.length !== 0) {
                    const userReq: UserOnline = { userId: userId, friendList: res, isOnline: isOnline };
                    this.sendMessage(userReq).subscribe({
                        next: () => { 
                            if (!isOnline) { this.disconnect(); }
                         },
                        error: err => { console.error(err) }
                    })
                }
            },
            error: err => { console.error(err) }
        });
    }

}