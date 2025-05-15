import { DB } from "@/databases";  // Make sure this path is correct
import { IUser } from "@/interfaces/users.interface";
import { promises } from "dns";
import { or, where } from "sequelize";

export default class UserService {
  public userModel = DB.UserModel;

  public async addUsers(userData: IUser): Promise<IUser> {
    // Create a new user
    const user = await this.userModel.create(userData);
    return user;
  }


  public async getAllUsers(userData: IUser): Promise<IUser> {
    const users = await this.userModel.findByPk(userData.);

    return users ;
  }







}