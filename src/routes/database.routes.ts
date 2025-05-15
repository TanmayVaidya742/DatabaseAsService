import { Router } from 'express';
import { DatabaseController } from '../controllers/database.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';
import { apiKeyMiddleware } from '../middlewares/apiKeyMiddleware';


class DatabaseRoute implements Routes {
  public path = '/databases'; // route prefix
  public router = Router();
  public databaseController = new DatabaseController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Apply auth middleware to all routes under this router
    // this.router.use(authMiddleware);
      this.router.use(apiKeyMiddleware);

    // Database routes
    this.router.post(`${this.path}/create-database`, this.databaseController.createDatabase);
    this.router.get(`${this.path}`, this.databaseController.getDatabases);
    this.router.get(`${this.path}/:dbName`, this.databaseController.getDatabaseDetails);
    this.router.delete(`${this.path}/:dbName`, this.databaseController.deleteDatabase);

    // Table routes
    this.router.post(`${this.path}/:dbName/tables`, this.databaseController.createTable);
    this.router.get(`${this.path}/:dbName/tables`, this.databaseController.getTables);
    this.router.delete(`${this.path}/:dbName/tables/:tableName`, this.databaseController.deleteTable);
    this.router.get(`${this.path}/:dbName/tables/:tableName/data`, this.databaseController.getTableData);
    this.router.put(`${this.path}/:dbName/tables/:tableName`, this.databaseController.updateTableStructure);
  }
}

export default DatabaseRoute;
