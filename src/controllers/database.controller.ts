import { Response, NextFunction } from 'express';
import { DatabaseService } from '../services/database.service';
import { RequestWithUser } from '../dtos/database.dto';

export class DatabaseController {
  private databaseService = new DatabaseService();

  public createDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.createDatabase(req.user.userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getDatabases = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.getDatabases(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public getDatabaseDetails = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.getDatabaseDetails(req.user.userId, req.params.dbName);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public deleteDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await this.databaseService.deleteDatabase(req.user.userId, req.params.dbName);
      res.json({ message: 'Database deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  public createTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.createTable(req.user.userId, req.params.dbName, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getTables = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.getTables(req.user.userId, req.params.dbName);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public deleteTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await this.databaseService.deleteTable(req.user.userId, req.params.dbName, req.params.tableName);
      res.json({ message: 'Table deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getTableData = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.getTableData(req.user.userId, req.params.dbName, req.params.tableName);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  public updateTableStructure = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const result = await this.databaseService.updateTableStructure(
        req.user.userId,
        req.params.dbName,
        req.params.tableName,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
