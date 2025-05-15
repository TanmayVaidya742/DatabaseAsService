import { DB } from "@/databases";
import { IUser } from "@/interfaces/users.interface";
import { or } from "sequelize";

export default class UserService{
  public userModel = DB.UserModel;

  public async addUsers(userData: IUser): Promise<IUser>{
    let user: IUser;
    user = await this.or
  }




}