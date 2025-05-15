import { NextFunction, Request, Response } from 'express';
import { CreateUserDto } from '@dtos/users.dto';
import { User } from '@interfaces/users.interface';
import userService from '@services/users.service';

class UsersController {
  public userService = new userService();

  public createUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgData = req.body;
        const orgaization = await this.orgService.addOrganization(orgData)
      res.status(201).json({ data: orgaization, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
