import {Component, OnDestroy, OnInit} from '@angular/core';
import {MessageDTO, MessageService} from "../../../Shared/Services/MessageService";
import {User, UserResponse} from "../../../Shared/Models/user.model";
import {UserService} from "../../../Shared/Services/user.service";

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  searchText: string = '';
  newMessage: string = '';
  messages: MessageDTO[] = [];
  currentUser!: User;
  friendsList: User[] = [];
  receiver!: User;

  constructor(private messageService: MessageService, private userService: UserService) {}

  ngOnDestroy(): void {
    this.messageService.disconnect();
  }

  ngOnInit(): void {
    const userStr = localStorage.getItem('CURRENT_USER');
    console.log(userStr);
    if (userStr) {
      const user: UserResponse = JSON.parse(userStr);

      this.loadCurrentUser(user.id);
      this.loadFriendsList();

      this.messageService.initConnectionSocket(user.id.toString());

      this.messageService.message$.subscribe(message => {
        console.log('New message received in component:', message);
        this.addMessage(JSON.parse(message));
      });
    }
  }

  private addMessage(message: MessageDTO): void {
      this.messages.push(message);
  }

  async loadCurrentUser(id: number) {
    this.userService.getProfileById(id)
      .subscribe({
        next: value => {
          this.currentUser = value;
          console.log(this.currentUser);
        },
        error: err => {}
      });
  }

  async loadFriendsList() {
    this.userService.getAllUsers(0)
      .subscribe({
        next: value => {
          this.friendsList = value.contents;
          console.log(value);
          console.log(this.friendsList);
        },
        error: err => {}
      });
  }

  chatWithUser(user: User) {
    this.receiver = user;
    this.loadPreviousChats(user.id!);
  }

  async loadPreviousChats(receiverId: number) {
    if (this.currentUser.id) {
      this.messageService.getMessages(this.currentUser.id, receiverId)
        .subscribe({
          next: value => {
            this.messages = value;
            console.log(value);
          },
          error: err => {}
        });
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.currentUser && this.receiver && this.currentUser.id  && this.receiver.id) {
      let message : MessageDTO = {
        chatId: "",
        content: this.newMessage,
        id: "",
        recipientId: this.receiver.id.toString(),
        senderId: this.currentUser.id.toString(),
        timestamp: new Date()
      }
      console.log(message)

      this.messageService.sendMessage(this.newMessage, this.receiver.id.toString(), this.currentUser.id.toString())
        .subscribe({
          next: () => {
            this.newMessage = '';
            this.messages.push(message)
          },
          error: err => {
            console.error('Error sending message', err);
          }
        });
    }
  }
}
