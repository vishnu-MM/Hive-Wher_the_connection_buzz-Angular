import {Injectable} from '@angular/core';
import SockJS from 'sockjs-client';
import {CompatClient, Stomp} from '@stomp/stompjs';
import {Observable, Subject} from 'rxjs';
import {HttpClient, HttpParams} from "@angular/common/http";
import { Group } from '../Models/group.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private stompClient: CompatClient | null = null;
  public messageSubject = new Subject<string>();
  public message$ = this.messageSubject.asObservable();
  public readonly BASE_URL: string = 'http://localhost:8083/ws';

  constructor(private http: HttpClient) {}

  initConnectionSocket(userId: string): void {
    const socket: WebSocket = new SockJS(this.BASE_URL);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, () => {
      console.log('Connected to WebSocket');
      if (this.stompClient) {
        this.stompClient.subscribe(`/user/${userId}/queue/messages`, (message: any) => {
          // console.log("getting some this from " + message.body)
          this.showMessage(message.body);
        });
      }
    });
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
    }
  }

  showMessage(message: string): void {
    this.messageSubject.next(message);
  }

  sendMessage(message: string, receiverId: string, senderId: string): Observable<void> {
    console.log({ content: message, recipientId: receiverId, senderId: senderId })
    return new Observable<void>((observer) => {
      if (!this.stompClient || !this.stompClient.connected) {
        console.error('WebSocket connection not established.');
        observer.error('WebSocket connection not established.');
        return;
      }

      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify({ content: message, recipientId: receiverId, senderId: senderId }),
      });

      observer.next();
      observer.complete();
    });
  }

  private baseUrl = 'http://localhost:8083';
  public getMessages(senderId: number, recipientId: number): Observable<MessageDTO[]> {
    const params = new HttpParams()
      .set('senderId', senderId.toString())
      .set('recipientId', recipientId.toString());

    return this.http.get<MessageDTO[]>(`${this.baseUrl}/messages`, { params });
  }

  public getusers(userId: number): Observable<number[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<number[]>(`${this.baseUrl}/get-users`, { params });
  }

  public getGroups(userId: number): Observable<number[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<number[]>(`${this.baseUrl}/groups`, { params });
  }

  public createGroup(group: Group): Observable<Group> {
    return this.http.post<Group>(`${this.baseUrl}/new-group`, group);
  }


}


export interface MessageDTO {
  id : string;
  chatId : string;
  senderId : string;
  recipientId : string;
  content : string;
  timestamp : Date;
}
