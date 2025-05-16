export interface IUser {
  userId: string;
  orgId: string;
  unitId: string;
  firstName: string;
  lastName: string;
  status: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  password?:string;
  userType?:string;

}
