import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/database.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import multer from 'multer';

// Extend the Request interface to include the file property
declare module 'express' {
  interface Request {
    file?: multer.File;
  }
}

export class DatabaseController {
  private databaseService = new DatabaseService();

  // public createDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  //   const { databaseName } = req.body;
  //   const { userId, orgId } = req.user;

  //   try {
  //     const result = await this.databaseService.createDatabase(databaseName, userId, orgId);
  //     res.status(201).json(result);
  //   } catch (error) {
  //     console.error('Error in createDatabase:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // };

  // public getDatabases = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const result = await this.databaseService.getDatabases();
  //     res.status(200).json(result);
  //   } catch (error) {
  //     console.error('Error in getDatabases:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // };


public createDatabase = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const { databaseName } = req.body;
  const { userId, orgId } = req.user; // Get from authenticated user

  try {
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name is required'
      });
    }

    const result = await this.databaseService.createDatabase(
      databaseName, 
      userId, 
      orgId
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createDatabase:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create database'
    });
  }
};
  public getDatabases = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId; // Get userId from authenticated user
    const orgId = req.user.orgId;
    const result = await this.databaseService.getDatabases(userId , orgId);
    
    
    res.status(200).json({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    console.error('Error in getDatabases:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
  public createTable = async (req: Request, res: Response, next: NextFunction) => {
    const { dbName } = req.params;
    const { tableName, columns } = req.body;
    const csvFile = req.file;

    try {
      const result = await this.databaseService.createTable(dbName, tableName, columns, csvFile);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createTable:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

   public getDatabasesByDbId = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
   const dbName = req.query.dbName.toString();
   const dbId = req.query.dbId.toString();

    const result = await this.databaseService.getDatabasesByDbId(dbId , dbName);
    
    
    res.status(200).json({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    console.error('Error in getDatabases:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
}