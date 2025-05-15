import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { IUser } from '@interfaces/users.interface';
import userService from '@services/users.service';

class UsersController {
  public userService = new userService();

  public createUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const users = await this.userService.addUsers(userData)
      res.status(201).json({ data: users, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public getAllUsers = async(req: Request, res: Response,next:NextFunction)=>{
    try{
      const userData = req.body;
      const users = await this.userService.getAllUsers(userData)
      res.status(201).json({data: users, mesaa})
    }
  }
}

export default UsersController;
