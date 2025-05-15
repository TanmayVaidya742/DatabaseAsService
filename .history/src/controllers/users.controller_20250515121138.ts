import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { IUser } from '@interfaces/users.interface';
import userService from '@services/users.service';
import { get } from 'http';

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
      // Get query params for filtering (if needed)
      const { orgId, email } = req.query;
      
      const findOptions = {
        where: {
          ...(orgId && { orgId }),
          ...(email && { email })
        }
      };

      const users = await this.userService.getAllUsers(findOptions);
      
      res.status(200).json({ 
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
