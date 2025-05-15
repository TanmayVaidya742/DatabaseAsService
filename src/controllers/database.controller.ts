import { Request, Response, NextFunction } from 'express';
import { CreateDatabaseDto } from '../interfaces/database.interface';
import { DatabaseModel } from '../models/database.model';
import { Client } from 'pg';


export class DatabaseController {
  private databaseModel = DatabaseModel.getInstance();

  // public createDatabase = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const databaseData: CreateDatabaseDto = req.body;
      
  //     // Validate input
  //     if (!databaseData.name || !databaseData.host || !databaseData.username) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'Name, host, and username are required'
  //       });
  //     }

  //     const newDatabase = await this.databaseModel.create(databaseData);
      
  //     res.status(201).json({
  //       success: true,
  //       data: newDatabase,
  //       message: 'Database created successfully'
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

async createDatabase(req: Request, res: Response) {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Database name is required' });
    }

    try {
      // Connect to the default "postgres" database to issue CREATE DATABASE command
      const client = new Client({
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        port: Number(process.env.DB_PORT) || 5432,
        database: 'postgres',
      });

      await client.connect();

      // Sanitize DB name to prevent SQL injection
      const dbName = name.replace(/[^a-zA-Z0-9_]/g, '_');

      await client.query(`CREATE DATABASE "${dbName}"`);
      await client.end();

      return res.status(201).json({ success: true, message: `Database '${dbName}' created successfully` });
    } catch (error) {
      console.error('Error creating database:', error);
      return res.status(500).json({ success: false, message: 'Failed to create database', error });
    }
  }

  public getDatabases = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const databases = await this.databaseModel.findAll();
      
      res.status(200).json({
        success: true,
        data: databases,
        count: databases.length
      });
    } catch (error) {
      next(error);
    }
  };

  public getDatabase = async (req: Request, res: Response, next: NextFunction) => {
  const { dbName } = req.params;
  if (!dbName) {
    return res.status(400).json({ success: false, message: "Database name is required" });
  }

  try {
    // Connect to PostgreSQL server (default 'postgres' database)
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'postgres' // connect to default DB to check other DBs
    });

    await client.connect();

    const result = await client.query(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    await client.end();

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Database not found' });
    }

    // Database exists — you can send additional info if you want
    return res.status(200).json({ success: true, data: { name: dbName } });
  } catch (error) {
    next(error);
  }
};


  // public getDatabase = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { dbName } = req.params;
  //     const database = await this.databaseModel.findOne(dbName);
      
  //     if (!database) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Database not found'
  //       });
  //     }
      
  //     res.status(200).json({
  //       success: true,
  //       data: database
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public deleteDatabase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName } = req.params;
      const success = await this.databaseModel.delete(dbName);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Database not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Database deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}