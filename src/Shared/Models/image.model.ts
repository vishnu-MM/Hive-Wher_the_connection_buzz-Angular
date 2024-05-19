import {ImageType} from "../Services/user.service";

export interface Image {
    id : number;
    name : string;
    type : string;
    image : Blob;
    imageType : ImageType;
    userID : number;
}
