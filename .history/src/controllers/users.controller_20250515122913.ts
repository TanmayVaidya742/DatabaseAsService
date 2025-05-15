import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { IUser } from '@interfaces/users.interface';
import userService from '@services/users.service';
import { get } from 'http';
import { WhereOptions } from 'sequelize';

class UsersController {
  public userService = new userService();

  public createUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const users = await this.userService.addUsers(userData)
      res.status(201).json({ data: users, message: 'User has been created successfully' });
    } catch (error) {
      next(error);
    }
  };

    public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get and validate query parameters
      const { orgId } = req.query;
      
      // Create typed where clause
      const where: WhereOptions<IUser> = {};
      
      if (orgId && typeof orgId === 'string') {
        where.orgId = orgId;
      }
      
  
      const users = await this.userService.getAllUsers({ where });
      
      res.status(200).json({ 
        data: users,
        count: users.length,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };




  public deleteUsers = async (req: Request, res:Response,next:NextFunction)=>
  {
    try{
      const {id} = req.params

      const where: WH



      const deleteUsers = await this.deleteUsers()
    }
  }



}

export default UsersController;
