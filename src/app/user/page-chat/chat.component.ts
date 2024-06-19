import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MessageService } from "../../../Shared/Services/message.service";
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { DomSanitizer } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Group, MessageDTO, MessageType } from 'src/Shared/Models/chat.model';

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
    allUsers: User[] = [];
    receiver!: User | undefined;
    userProfileImageMap: Map<number, string> = new Map<number, string>();
    private getProfileSubs = new Map<number, Subscription>();
    pageNo: number = 0;

    @ViewChild('chatBody') private chatBody!: ElementRef;
    @ViewChild('NewGroup') newGroup!: TemplateRef<any>;
    @ViewChild('NewChat') newChat!: TemplateRef<any>;
    private dialogRef!: MatDialogRef<any>;
    private dialogRefNewChat!: MatDialogRef<any>;
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
    showGroups: boolean = false;
    groups: Group[] = [];
    group!: Group | undefined;

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
                    console.log(message)
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
                    for (let userId of value) {
                        this.loadUser(userId, false).then();
                    }
                },
                error: err => {
                }
            });
    }

    openNewChat() {
        this.loadAllUsers().then()
        this.dialogRefNewChat = this.dialog.open(this.newChat);
    }

    async loadAllUsers(): Promise<void> {
        this.userService.getAllUsers(this.pageNo, 20).subscribe({
            next: res => {
                this.allUsers = res.contents;
                this.pageNo++;
                this.loadUserProfilePictures(res.contents).then();
            },
            error: err => {}
        })
    }

    chatWithUser(user: User) {
        this.group = undefined;
        this.receiver = user;
        this.loadPreviousChats(user.id!.toString());
    }

    async loadPreviousChats(receiverId: string) {
        if (this.currentUser.id) {
            let messageType: MessageType;
            if (this.receiver) {
                messageType = MessageType.PRIVATE;
            }
            else if (this.group) {
                messageType = MessageType.GROUP;
            }
            else {
                return;
            }
            console.log("loading")
            this.messageService.getMessages(this.currentUser.id, receiverId, messageType)
                .subscribe({
                    next: value => {
                        this.messages = value;
                        console.log(value)
                        console.log(this.messages)
                        this.scrollToBottom();
                    },
                    error: err => {
                        console.log('Error while fetching old chat'+err)
                    }
                });
        }
    }

    sendMessage() {
        let message: MessageDTO | null = this.getMessageObject();
        console.log(message)
        if (message !== null) {
            this.messageService.sendMessage(message)
                .subscribe({
                    next: () => {
                        console.log(message);
                        this.newMessage = '';
                        this.messages.push(message!)
                        this.scrollToBottom();
                    },
                    error: err => {
                        console.error('Error sending message', err);
                    }
                });
        }
    }

    private getMessageObject(): MessageDTO | null {
        if (!(this.newMessage.trim() && this.currentUser && this.currentUser.id)) {
            return null;
        }
        console.log(this.group)
        if (this.receiver && this.receiver.id) {
            return {
                chatId: "",
                content: this.newMessage,
                id: "",
                recipientId: this.receiver.id.toString(),
                senderId: this.currentUser.id.toString(),
                timestamp: (new Date()).toString(),
                messageType: MessageType.PRIVATE
            }
        }
        else if (this.group && this.group.id) {
            return {
                chatId: "",
                content: this.newMessage,
                id: "",
                recipientId: this.group.id.toString(),
                senderId: this.currentUser.id.toString(),
                timestamp: (new Date()).toString(),
                messageType: MessageType.GROUP
            }
        }
        return null;
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
            for (let userId of this.inGroupUsers.keys()) {
                this.userIds.push(userId.toString());
            }

            const group: Group = {
                id: null,
                groupName: this.groupName.trim(),
                membersId: this.userIds,
                imageData: null,
                imageName: null,
                imageType: null
            }
            this.close();
            this.messageService.createGroup(group).subscribe({
                next: res => { console.log(res) },
                error: err => {
                    console.log('error while creating group')
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
        this.dialogRefNewChat.close();
    }

    open() {
        if (this.friendsList.length > 0) {
            for (let user of this.friendsList) {
                if (user === this.currentUser) continue;
                this.notInGroupUsers.set(user.id!, user);
            }
            this.inGroupUsers.set(this.currentUser.id!, this.currentUser);
            this.dialogRef = this.dialog.open(this.newGroup);
        }
    }

    async loadGroupsList(id: number) {
        this.messageService.getGroups(id)
            .subscribe({
                next: value => {
                    this.groups = value
                },
                error: err => {
                }
            });
    }

    chatInGroup(group: Group) {
        this.receiver = undefined;
        this.group = group;
        this.loadPreviousChats(group.id!);
    }

    isMessageComming(message: MessageDTO): boolean {
        if (this.receiver) {
            return (message.senderId === this.receiver.id!.toString() && message.senderId !== this.currentUser.id?.toString());
        }
        else if (this.group) {
            return (message.senderId !== this.currentUser.id?.toString() && message.recipientId === this.group.id);
            
        }
        else {
            return false;
        }
    }

    isMessageGoing(message: MessageDTO) {
        if (this.receiver) {
            return (message.senderId === this.currentUser!.id?.toString());
        }
        else if (this.group) {
            return (message.senderId === this.currentUser.id?.toString() && message.recipientId === this.group.id);
        }
        else {
            return false;
        }
    }
}
