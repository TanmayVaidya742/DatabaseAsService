import { DB } from "@/databases";  // Make sure this path is correct
import { IUser } from "@/interfaces/users.interface";
import { promises } from "dns";
import { FindOptions, or, where } from "sequelize";

export default class UserService {
  public userModel = DB.UserModel;

  public async addUsers(userData: IUser): Promise<IUser> {
    // Create a new user
    const user = await this.userModel.create(userData);
    return user;
  }


  // public async getAllUsers(userData: IUser): Promise<IUser> {
  //   const getUserById = await this.userModel.findByPk(userData.userId);

  //   return getUserById ;
  // }



    public async getAllUsers(options?: FindOptions<IUser>): Promise<IUser[]> {
    const users = await this.userModel.findAll(options);
    return users.map(user => user.toJSON() as IUser);
  }







}