export interface  ComplaintsDTO {
  id: number | null;
  senderId: number;
  reportedUser: number;
  date: Date;
  description: string;
}
export interface ComplaintsPage{
  contents : ComplaintsDTO[];
  pageNo : number;
  pageSize : number;
  totalElements : number;
  totalPages : number;
  isLast : boolean;
  hasNext : boolean;
}