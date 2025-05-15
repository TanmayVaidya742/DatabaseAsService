import { DB } from "@/databases";
import { IUser } from "@/interfaces/users.interface";

export default class UserService{
  public userModel = DB.UserModel;

  public async addUsers(userData: IUser): Promise<IUser>{
    let
  }




}