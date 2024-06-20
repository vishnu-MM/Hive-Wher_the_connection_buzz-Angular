import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MessageService } from "../../../Shared/Services/message.service";
import { User, UserResponse } from "../../../Shared/Models/user.model";
import { ImageType, UserService } from "../../../Shared/Services/user.service";
import { Subscription } from "rxjs";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import RecordRTC from 'recordrtc';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Group, MessageDTO, MessageFileType, MessageType } from 'src/Shared/Models/chat.model';
import { CloudinaryModule } from '@cloudinary/ng';
import { Cloudinary, CloudinaryImage } from '@cloudinary/url-gen';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/Shared/Services/app.service';

@Component({
    selector: 'chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
    //Common
    private readonly cloudinaryUrl = `https://api.cloudinary.com/v1_1/${environment.CLOUD_NAME}/upload`;
    // Subscription
    private getMessageSub!: Subscription;
    private getProfileById!: Subscription;
    private getProfileSub!: Subscription;
    private loadFriendsListSub!: Subscription;
    private loadAllUsersSub!: Subscription;
    private loadPreviousChatsSub!: Subscription;
    private createNewGroupSub!: Subscription;
    private loadGroupsListSub!: Subscription;
    private getProfileSubs = new Map<number, Subscription>();

    constructor(private messageService: MessageService,
                private appService: AppService,
                private userService: UserService,
                private cdr: ChangeDetectorRef,
                private dialog: MatDialog,
                private dom: DomSanitizer) {}

    ngOnInit(): void {
        const userStr = localStorage.getItem('CURRENT_USER');
        if (userStr) {
            this.configureCloudinary();
            const user: UserResponse = JSON.parse(userStr);
            this.initConnectionAndSubscibeToMessage(user.id.toString());
            this.loadUser(user.id, true).then();
            this.loadFriendsList(user.id).then();
            this.loadGroupsList(user.id).then();
        } 
        else {
            this.appService.logout()
        }
    }

    ngOnDestroy(): void {
        this.messageService.disconnect();
        if (this.getMessageSub) this.getMessageSub.unsubscribe();
        if (this.getProfileById) this.getProfileById.unsubscribe();
        if (this.getProfileSub) this.getProfileSub.unsubscribe();
        if (this.loadFriendsListSub) this.loadFriendsListSub.unsubscribe();
        if (this.loadAllUsersSub) this.loadAllUsersSub.unsubscribe();
        if (this.loadPreviousChatsSub) this.loadPreviousChatsSub.unsubscribe();
        if (this.createNewGroupSub) this.createNewGroupSub.unsubscribe();
        if (this.loadGroupsListSub) this.loadGroupsListSub.unsubscribe();
        //todo: close private getProfileSubs = new Map<number, Subscription>();
    }

    private initConnectionAndSubscibeToMessage(userId: string): void {
        this.messageService.initConnectionSocket(userId);
        this.getMessageSub = this.messageService.message$.subscribe(message => {
            this.addNewMessage(JSON.parse(message));
        });
    }

    private configureCloudinary(): void {
        const cld = new Cloudinary({ cloud: { cloudName: environment.CLOUD_NAME } });
    }

    // USER RELATED
    protected searchText: string = '';
    protected currentUser!: User;
    protected allUsers: User[] = [];
    protected friendsList: User[] = [];
    protected receiver!: User | undefined;
    protected userProfileImageMap: Map<number, string> = new Map<number, string>();
    protected pageNo: number = 0;
    protected pageSize: number = 20;
    protected hasNext: boolean = false;
    
    private async loadUser(id: number, isCurrentUser: boolean): Promise<void> {
        this.getProfileById = this.userService.getProfileById(id).subscribe({
                next: value => {
                    if (isCurrentUser) {
                        this.currentUser = value; 
                        this.loadUserProfilePictures([value]).then();
                    }              
                    else {
                        this.friendsList.push(value);                
                        this.loadUserProfilePictures(this.friendsList).then();
                    }
                },
                error: err => { 
                    console.log(err);
                }
            });
    }

    private async loadFriendsList(id: number): Promise<void> {
        this.loadFriendsListSub = this.messageService.getusers(id).subscribe({
                next: value => {
                    for (let userId of value) { this.loadUser(userId, false).then(); }
                },
                error: err => {
                }
            });
    }

    private async loadAllUsers(): Promise<void> {
        this.loadAllUsersSub = this.userService.getAllUsers(this.pageNo, this.pageSize).subscribe({
            next: res => {
                this.allUsers = res.contents;
                this.pageNo++;
                this.hasNext = res.hasNext;
                this.loadUserProfilePictures(res.contents).then();
            },
            error: err => { }
        })
    }

    private async loadUserProfilePictures(userList: User[]): Promise<void> {
        for (let user of userList) {
            if (this.userProfileImageMap.has(user.id!)) 
                continue;
            this.userProfileImageMap.set(
                user.id!, 
                await this.getUserProfilePicture(user.id!)
            );
        }
    }

    private async getUserProfilePicture(userId: number): Promise<string> {
        if (this.getProfileSubs.has(userId)) {
            this.getProfileSubs.get(userId)!.unsubscribe();
        }

        return new Promise((resolve, reject) => {
            const subscription = this.getProfileSub = this.userService
                .getProfileImage(userId, ImageType.PROFILE_IMAGE).subscribe({
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
    
    protected chatWithUser(user: User): void {
        this.group = undefined;
        this.receiver = user;
        this.loadPreviousChats(user.id!.toString());
    }

    // MESSAGE RELATED
    protected newMessage: string = '';
    protected messages: MessageDTO[] = [];
    protected sendingSpinner: boolean = false;
    @ViewChild('NewGroup') 
    private newGroup!: TemplateRef<any>;
    @ViewChild('NewChat') 
    private newChat!: TemplateRef<any>;
    private dialogRefNewGroup!: MatDialogRef<any>;
    private dialogRefNewChat!: MatDialogRef<any>;
    protected readonly MessageFileType = MessageFileType;

    private addNewMessage(message: MessageDTO): void {
        this.messages.push(message);
        this.scrollToBottom();
    }

    private async loadPreviousChats(receiverId: string): Promise<void> {
        if (!this.currentUser.id) { return; }
    
        let messageType: MessageType;
        if (this.receiver) { messageType = MessageType.PRIVATE; }
        else if (this.group) { messageType = MessageType.GROUP; }
        else { return; }
         
        this.loadPreviousChatsSub = this.messageService
        .getMessages(this.currentUser.id, receiverId, messageType).subscribe({
            next: value => {
                this.messages = value;
                this.scrollToBottom();
            },
            error: err => {
                console.log('Error while fetching old chat' + err)
            }
        });
    }

    protected sendMessage(): void {
        if (this.recordedBlob) {
            this.sendingSpinner= true;
            this.uploadAudio();
        }
        else {
            let message: MessageDTO | null = this.getMessageObject(MessageFileType.TEXT_ONLY);
            if (message !== null) { this.sendMessageHelper(message).then(); }
        }
    }

    private async sendMessageHelper(message: MessageDTO): Promise<void> {
        this.messageService.sendMessage(message)
            .subscribe({
                next: () => {
                    this.newMessage = '';
                    this.messages.push(message!)
                    if (this.sendingSpinner) this.sendingSpinner= false;
                    this.scrollToBottom();
                },
                error: err => {
                    console.error('Error sending message', err);
                }
            });
    }

    private getMessageObject(messageFileType: MessageFileType): MessageDTO | null {
        if (!(this.newMessage.trim() && this.currentUser && this.currentUser.id)) {
            return null;
        }

        if (this.receiver && this.receiver.id) {
            return {
                chatId: "",
                content: this.newMessage,
                id: "",
                recipientId: this.receiver.id.toString(),
                senderId: this.currentUser.id.toString(),
                timestamp: (new Date()).toString(),
                messageType: MessageType.PRIVATE,
                messageFileType: messageFileType
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
                messageType: MessageType.GROUP,
                messageFileType: messageFileType
            }
        }
        return null;
    }

    // VOICE-MESSAGE RELATED
    protected recording: boolean = false;
    private record: any;
    private error!: string;
    protected url!: any;
    protected isAudioReadyToSent: boolean = false;
    private recordedBlob!: Blob | undefined;

    private async uploadAudio(): Promise<void> {
        if (!this.recordedBlob) { return; }

        const formData = new FormData();
        formData.append('file', this.recordedBlob, 'recording.wav');
        formData.append('upload_preset', environment.UPLOAD_PRESET);
        formData.append('cloud_name', environment.CLOUD_NAME);

        try {
            const response = await fetch(this.cloudinaryUrl, { method: 'POST', body: formData });
            const data = await response.json();
            this.clearRecording();
            this.newMessage = data.secure_url;
            let message: MessageDTO | null = this.getMessageObject(MessageFileType.AUDIO);
            if (message !== null) {
                this.sendMessageHelper(message);
            }
        } catch (error) {
            console.error('Error uploading audio:', error);
        }
    }

    protected toggleStartStopRecording(): void {
        if (this.recording) { this.stopRecording(); }
        else { this.startRecording(); }
    }

    private startRecording(): void {
        this.recording = true;
        this.clearRecording();
        let mediaConstraints = { video: false, audio: true };
        navigator.mediaDevices.getUserMedia(mediaConstraints).then(
            this.successCallback.bind(this), this.errorCallback.bind(this)
        );
    }

    private stopRecording(): void {
        this.record.stop(this.processRecording.bind(this));
        this.recording = false;
        this.isAudioReadyToSent = true;
    }

    private successCallback(stream: MediaStream): void {
        let options = { mimeType: 'audio/wav' };
        let StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
        this.record = new StereoAudioRecorder(stream, options);
        this.record.record();
    }

    private errorCallback(error: any): void {
        this.error = 'Something went wrong';
        console.log(this.error, error);
    }

    private processRecording(blob: Blob): void {
        this.url = URL.createObjectURL(blob);
        this.recordedBlob = blob;
    }

    protected sanitize(url: string): SafeUrl {
        return this.dom.bypassSecurityTrustUrl(url);
    }

    protected clearRecording(): void {
        if (this.recordedBlob) this.recordedBlob = undefined;
        if (this.url) this.url = undefined;
        this.isAudioReadyToSent = false;
    }

    // GROUP RELATED
    protected groups: Group[] = [];
    protected group!: Group | undefined;
    protected groupName: string = '';
    private userIds: string[] = [];
    protected notInGroupUsers: Map<number, User> = new Map<number, User>;
    protected inGroupUsers: Map<number, User> = new Map<number, User>;
    protected showGroups: boolean = false;

    private async loadGroupsList(id: number): Promise<void> {
        this.loadGroupsListSub = this.messageService.getGroups(id).subscribe({
            next: value => { this.groups = value },
            error: err => { }
        });
    }
    
    protected createNewGroup(): void {
        if (this.groupName !== '' || this.groupName.trim() !== '') { return; }

        for (let userId of this.inGroupUsers.keys()) {
            this.userIds.push(userId.toString());
        }

        const group: Group = { 
            id: null, groupName: this.groupName.trim(), membersId: this.userIds,
            imageData: null, imageName: null, imageType: null
        }
        
        this.createNewGroupSub = this.messageService.createGroup(group).subscribe({
            next: res => { 
                this.groups.unshift(res);
                this.closeNewGroup();
            },
            error: err => {
                console.log('error while creating group' + err)
            }
        })
    }

    protected addToGroup(id: number): void {
        if (!this.notInGroupUsers.has(id)) { return; }
        const user: User = this.notInGroupUsers.get(id)!;
        this.notInGroupUsers.delete(id)
        this.inGroupUsers.set(id, user);
    }

    protected removeFromGroup(id: number): void {
        if (!this.inGroupUsers.has(id)) { return; }
        const user: User = this.inGroupUsers.get(id)!;
        this.inGroupUsers.delete(id)
        this.notInGroupUsers.set(id, user);
    }

    protected open(): void {
        if (this.friendsList.length <= 0) { return; }
        for (let user of this.friendsList) {
            if (user === this.currentUser) { continue; }
            this.notInGroupUsers.set(user.id!, user);
        }
        if ( this.allUsers.length === 0 && this.pageNo === 0){
            this.loadAllUsers().then( () => {
                for(let user of this.allUsers) {
                    if (user === this.currentUser || this.notInGroupUsers.has(user.id!)) { 
                        continue; 
                    }
                    this.notInGroupUsers.set(user.id!, user);
                }
            })
        }
        else {
            for(let user of this.allUsers) {
                if (user === this.currentUser || this.notInGroupUsers.has(user.id!)) { 
                    continue; 
                }
                this.notInGroupUsers.set(user.id!, user);
            }
        }
        this.inGroupUsers.set(this.currentUser.id!, this.currentUser);
        this.dialogRefNewGroup = this.dialog.open(this.newGroup);
    }

    protected chatInGroup(group: Group): void {
        this.receiver = undefined;
        this.group = group;
        this.loadPreviousChats(group.id!);
    }

    protected onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.uploadImage(file);
        }
    }

    protected uploadImage(mediaFile: File): void {
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("upload_preset", environment.UPLOAD_PRESET);
        formData.append("cloud_name", environment.CLOUD_NAME);

        fetch(this.cloudinaryUrl, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    }

    //OTHER-OR-GENARAL

    protected openNewChat(): void {
        if ( this.allUsers.length === 0 && this.pageNo === 0)
            this.loadAllUsers().then()
        this.dialogRefNewChat = this.dialog.open(this.newChat);
    }

    protected closeNewChat(): void {
        this.dialogRefNewChat.close();
    }

    @ViewChild('chatBody') private chatBody!: ElementRef;
    private scrollToBottom(): void {
        try {
            this.cdr.detectChanges();
            this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
        } catch (err) {
            console.error('Error while scrolling:', err);
        }
    }

    protected closeNewGroup(): void {
        this.dialogRefNewGroup.close();
    }

    protected isMessageComming(message: MessageDTO): boolean {
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

    protected isMessageGoing(message: MessageDTO) {
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

    protected isOnlyTextMsg(messageFileType: MessageFileType): boolean {
        return ((MessageFileType.TEXT_ONLY === messageFileType) || (
            !(MessageFileType.VIDEO === messageFileType) &&
            !(MessageFileType.AUDIO === messageFileType) &&
            !(MessageFileType.IMAGE === messageFileType))
        )
    }

    Number(senderId: string): number {
        return Number(senderId);
    }
}
