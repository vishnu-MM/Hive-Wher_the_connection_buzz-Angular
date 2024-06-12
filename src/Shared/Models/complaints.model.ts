export interface  ComplaintsDTO {
  id: number | null;
  senderId: number;
  reportedUser: number;
  date: Date;
  description: string;
}