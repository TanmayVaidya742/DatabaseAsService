import { Router } from 'express';
import { DatabaseController } from '../controllers/database.controller';
import {Routes} from '@interfaces/routes.interface'; // adjust path if needed

export class DatabaseRoute implements Routes {
  public path = '/database';
  public router = Router();
  public controller = new DatabaseController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.controller.createDatabase);
    this.router.get(`${this.path}`, this.controller.getDatabases);
    this.router.get(`${this.path}/:dbName`, this.controller.getDatabase);
    this.router.delete(`${this.path}/:dbName`, this.controller.deleteDatabase);
  }
}
