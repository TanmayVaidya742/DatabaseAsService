import { hash } from 'bcrypt';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { IUser } from '@interfaces/users.interface';
import { isEmpty } from '@utils/util';
import { DB } from '@/databases';


export default class UserModel{


  public userModel = DB.
}

class UserService {
  // public async findAllUser(): Promise<IUser[]> {
  //   const users: IUser[] = await this.users.findAll();
  //   return users;
  // }

  // public async findUserById(userId: string): Promise<IUser> {
  //   if (isEmpty(userId)) throw new HttpException(400, "UserId is empty");

  //   const findUser: IUser = await this.users.findOne({ _id: userId });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   return findUser;
  // }
 public userMOdel = DB.UserModel;
      public async addOrganization(orgData: IOrganization): Promise<IOrganization> {
        let org :IOrganization;
         org = await this.orgModel.findOne({
            where: 
            {
                orgName: orgData.orgName,
            },
            raw: true,
        });

        if(org) {
            return org;
        }
        else {
            org = await this.orgModel.create(orgData);
        }
        return org;
      }

  // public async updateUser(userId: string, userData: CreateUserDto): Promise<IUser> {
  //   if (isEmpty(userData)) throw new HttpException(400, "userData is empty");

  //   if (userData.email) {
  //     const findUser: IUser = await this.users.findOne({ email: userData.email });
  //     if (findUser && findUser._id != userId) throw new HttpException(409, `This email ${userData.email} already exists`);
  //   }

  //   if (userData.password) {
  //     const hashedPassword = await hash(userData.password, 10);
  //     userData = { ...userData, password: hashedPassword };
  //   }

  //   const updateUserById: IUser = await this.users.findByIdAndUpdate(userId, { userData });
  //   if (!updateUserById) throw new HttpException(409, "User doesn't exist");

  //   return updateUserById;
  // }

  // public async deleteUser(userId: string): Promise<IUser> {
  //   const deleteUserById: IUser = await this.users.findByIdAndDelete(userId);
  //   if (!deleteUserById) throw new HttpException(409, "User doesn't exist");

  //   return deleteUserById;
  // }
}

export default UserService;
