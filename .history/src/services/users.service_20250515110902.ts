import { DB } from "@/databases";  // Make sure this path is correct
import { IUser } from "@/interfaces/users.interface";
import { or, where } from "sequelize";

export default class UserService {
  public userModel = DB.UserModel;

  public async addUsers(userData: IUser): Promise<IUser> {
    // Create a new user
    const user = await this.userModel.create(userData);
    return user;
  }
}