export interface Group {
    id: string | null;
    groupName: string;
    membersId: string[];
    imageData: File | null;
    imageName: string | null;
    imageType: string | null;
}
