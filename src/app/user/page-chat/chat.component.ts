import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MessageDTO, MessageService } from "../../../Shared/Services/message.service";
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Group } from 'src/Shared/Models/group.model';

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
    userProfileImageMap: Map<number, string> = new Map<number, string>();
    private getProfileSubs = new Map<number, Subscription>();


    @ViewChild('chatBody') private chatBody!: ElementRef;
    @ViewChild('NewGroup') newGroup!: TemplateRef<any>;
    private dialogRef!: MatDialogRef<any>;
    private getMessageSub!: Subscription;
    private getProfileById!: Subscription;
    private getProfileSub!: Subscription;

    // Voice Message related
    recording: boolean = false;
    record: any;
    error!: string;
    url!: any;
    isAudioReadyToSent: boolean = false;

    //Gropu Related
    groupName: string = '';
    userIds: string[] = [];
    notInGroupUsers: Map<number, User> = new Map<number, User>;
    inGroupUsers: Map<number, User> = new Map<number, User>;

    constructor(private messageService: MessageService,
        private userService: UserService,
        private cdr: ChangeDetectorRef,
        private dialog: MatDialog,
        private dom: DomSanitizer) { }

    ngOnInit(): void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            const user: UserResponse = JSON.parse(userStr);

            this.loadUser(user.id, true).then();
            this.loadFriendsList(user.id).then();
            this.loadGroupsList(user.id).then();

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

    private addMessage(message: MessageDTO): void {
        this.messages.push(message);
        this.scrollToBottom();
    }

    async loadUser(id: number, isCurrentUser: boolean) {
        this.getProfileById = this.userService.getProfileById(id)
            .subscribe({
                next: value => {
                    if (isCurrentUser) {
                        this.currentUser = value;
                    }
                    this.friendsList.push(value);                    
                    this.loadUserProfilePictures(this.friendsList).then();
                },
                error: err => {
                    console.log(err);
                }
            });
    }

    async loadFriendsList(id: number) {
        this.messageService.getusers(id)
            .subscribe({
                next: value => {
                    for ( let userId of value) {
                        this.loadUser(userId, false).then();
                    }                    
                },
                error: err => {
                }
            });
    }

    async loadGroupsList(id: number) {
        this.messageService.getGroups(id)
            .subscribe({
                next: value => {
                    for ( let res of value) {
                       console.log(res)
                    }                    
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

    createNewGroup() {
        if (this.groupName !== '' || this.groupName.trim() !== '') {
            for (let userId of this.inGroupUsers.keys()){
                this.userIds.push(userId.toString());
            }

            const group: Group = {
                id: null,
                groupName: this.groupName.trim() ,
                membersId: this.userIds,
                imageData: null,
                imageName: null,
                imageType: null
            }
            this.close();
            this.messageService.createGroup(group).subscribe({
                next: res => { console.log(res) },
                error: err => { 
                    console.log( 'error while creating group' )
                    console.log(err)
                }
            })
            
        }
    }

    addToGroup(id: number) {
        if (this.notInGroupUsers.has(id)) {
            const user: User = this.notInGroupUsers.get(id)!;
            this.notInGroupUsers.delete(id)
            this.inGroupUsers.set(id, user);
     }
    }

    removeFromGroup(id: number) {
        if (this.inGroupUsers.has(id)) {
            const user: User = this.inGroupUsers.get(id)!;
            this.inGroupUsers.delete(id)
            this.notInGroupUsers.set(id, user);
     }
    }

    close() {
        this.dialogRef.close();
    }

    open() {
        if (this.friendsList.length > 0) {          
            for(let user of this.friendsList) {
                if (user === this.currentUser) continue;
                this.notInGroupUsers.set(user.id!, user);
            }
            this.inGroupUsers.set(this.currentUser.id!, this.currentUser);
            this.dialogRef = this.dialog.open(this.newGroup);
        }
    }
}
