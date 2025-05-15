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


  public async getAllUsers(options?: FindOptions<IUser>): Promise<IUser[]> {
    const users = await this.userModel.findAll(options);
    return users.map(user => user.toJSON() as IUser);
  }


 public async deleteUsers(where: WhereOptions<IUser>): Promise<number> {
    // For hard delete:
    const deletedCount = await this.userModel.destroy({ where });
    return deletedCount;

    // If you're using soft delete (paranoid: true), you might want to use:
    // const result = await this.userModel.update(
    //   { deletedAt: new Date() },
    //   { where }
    // );
    // return result[0]; // number of affected rows
  }

}