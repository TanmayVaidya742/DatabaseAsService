import { Router } from 'express';
import {Routes} from '@interfaces/routes.interface';
import {TableController} from '@/controllers/table.controller';

class TableRoute implements Routes {
  public path = '/table';
  public router = Router();
  public tableController = new TableController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.get(`${this.path}`, this.tableController.getTables);
    this.router.get(`${this.path}/:dbName`, this.tableController.getTables);
    // this.router.post(`${this.path}`, this.tableController.createTable);
    this.router.post(`${this.path}/:dbName`, this.tableController.createTable);

  }
}

export default TableRoute;
