import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageDTO, MessageService } from "../../../Shared/Services/message.service";
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';

@Component({
    selector: 'chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
    searchText: string = '';
    newMessage: string = '';
    messages: MessageDTO[] = [];
    currentUser!: User;
    friendsList: User[] = [];
    receiver!: User;
    userProfileImageMap: Map<number, string> = new Map<number, string>();
    private getProfileSubs = new Map<number, Subscription>();


    @ViewChild('chatBody') private chatBody!: ElementRef;
    private getMessageSub!: Subscription;
    private getProfileById!: Subscription;
    private getProfileSub!: Subscription;
    // Voice Message related
    recording: boolean = false;
    record: any;
    error!: string;
    url!: any;
    isAudioReadyToSent: boolean = false;

    constructor(private messageService: MessageService,
        private userService: UserService,
        private cdr: ChangeDetectorRef,
        private dom: DomSanitizer) { }

    ngOnInit(): void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);

            this.loadCurrentUser(user.id).then();
            this.loadFriendsList().then();

            this.messageService.initConnectionSocket(user.id.toString());

            this.getMessageSub = this.messageService.message$
                .subscribe(message => {
                    this.addMessage(JSON.parse(message));
                });
        } else {
            //todo logout
        }
    }

    ngOnDestroy(): void {
        this.messageService.disconnect();
        if (this.getMessageSub) this.getMessageSub.unsubscribe();
        if (this.getProfileById) this.getProfileById.unsubscribe();
        if (this.getProfileSub) this.getProfileSub.unsubscribe();
    }

    ngAfterViewInit(): void {
        this.scrollToBottom();
    }

    private addMessage(message: MessageDTO): void {
        this.messages.push(message);
        this.scrollToBottom();
    }

    async loadCurrentUser(id: number) {
        this.getProfileById = this.userService.getProfileById(id)
            .subscribe({
                next: value => {
                    this.currentUser = value;
                },
                error: err => {
                    console.log(err);
                }
            });
    }

    async loadFriendsList() {
        this.userService.getAllUsers(0,10)
            .subscribe({
                next: value => {
                    this.friendsList = value.contents;
                    this.loadUserProfilePictures(this.friendsList).then();
                },
                error: err => {
                }
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
                        this.scrollToBottom();
                    },
                    error: err => {
                        console.log(err)
                    }
                });
        }
    }

    sendMessage() {
        if (this.newMessage.trim() && this.currentUser && this.receiver && this.currentUser.id && this.receiver.id) {
            let message: MessageDTO = {
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
                        this.scrollToBottom();
                    },
                    error: err => {
                        console.error('Error sending message', err);
                    }
                });
        }
    }

    private scrollToBottom(): void {
        try {
            this.cdr.detectChanges();
            this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
        } catch (err) {
            console.error('Error while scrolling:', err);
        }
    }


    private async loadUserProfilePictures(userList: User[]) {
        for (let user of userList) {
            let userId: number = user.id!;
            this.userProfileImageMap.set(userId, await this.getUserProfilePicture(userId));
        }
    }

    getUserProfilePicture(userId: number): Promise<string> {
        if (this.getProfileSubs.has(userId)) {
            this.getProfileSubs.get(userId)!.unsubscribe();
        }

        return new Promise((resolve, reject) => {
            const subscription = this.getProfileSub = this.userService
                .getProfileImage(userId, ImageType.PROFILE_IMAGE)
                .subscribe({
                    next: (response) => {
                        const imageUrl = 'data:image/png;base64,' + response.image;
                        resolve(imageUrl);
                    },
                    error: (error) => {
                        resolve('assets/no-profile-image.jpg');
                    }
                });
            this.getProfileSubs.set(userId, subscription);
        });
    }

    // Audio Related

    startRecording() {
        this.recording = true;
        let mediaConstraints = { video: false, audio: true }
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(
                this.successCallback.bind(this),
                this.errorCallback.bind(this)
            )
    }

    successCallback(stream: any) {
        let options = { mimeType: 'audio/wav' };
        let StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
        this.record = new StereoAudioRecorder(stream, options);
        this.record.record();
    }

    errorCallback(stream: any) {
        this.error = 'Something went wrong';
        console.log(this.error);
    }

    stopRecording() {
        this.recording = false;
        this.record.stop(this.processRecording.bind(this));
        this.isAudioReadyToSent = true;
    }

    processRecording(blob: any) {
        this.url = URL.createObjectURL(blob);
        console.log(this.url);
    }

    sanitize(url: string) {
        return this.dom.bypassSecurityTrustUrl(url)
    }
}
