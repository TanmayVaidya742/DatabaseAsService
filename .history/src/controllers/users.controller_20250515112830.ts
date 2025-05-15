import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { IUser } from '@interfaces/users.interface';
import userService from '@services/users.service';

class UsersController {
  public userService = new userService();

  public createUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const users = await this.orgService.addOrganization(userData)
      res.status(201).json({ data: orgaization, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
