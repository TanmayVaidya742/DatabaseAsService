// controllers/table.controller.ts
import { TableModel } from '../models/table.model';
import { IColumn, ITableResponse } from '../interfaces/table.interface';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { TableService } from '@/services/table.service';

export class TableController {
  private tableService = new TableService();

  public getAllTables = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    //  const { tableName, columns, dbId } = req.body;
    const { dbId } = req.params;
    const { orgId } = req.user;
    
    const tableData = await this.tableService.getTables(dbId,orgId);
    return  res.status(200).json(tableData);

  }

  public createTable = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { tableName, columns, dbId } = req.body;
    const { dbName } = req.params;
    const { orgId, userId } = req.user;

    if (!dbName || !tableName || !columns) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Database name, table name, and schema are required',
      });
    }

    try {
      const result = await this.tableService.createTable(orgId, dbId, dbName, tableName, userId, columns);

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating table:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to create table',
      });
    }
  };

  public async getTableSchema(req: RequestWithUser, res: Response, next: NextFunction) {
    const { dbName, tableName } = req.params;

    try {
      const result = await this.tableModel.getTableSchema(dbName, tableName);

      if ('error' in result) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching table schema:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to fetch table schema',
      });
    }
  }

  public async updateTableSchema(req: RequestWithUser, res: Response, next: NextFunction) {
    const { dbName, tableName } = req.params;
    const { schema } = req.body;

    try {
      const result = await this.tableModel.updateTableSchema(dbName, tableName, schema);

      if ('error' in result) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error updating table schema:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to update table schema',
      });
    }
  }
}
