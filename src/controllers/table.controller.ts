import { Request, Response, NextFunction } from 'express';
import { CreateTableDto, UpdateTableDto, TableDataQuery } from '../interfaces/table.interface';
import { TableModel } from '../models/table.model';

export class TableController {
  private tableModel = TableModel.getInstance();

  public createTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName } = req.params;
      const tableData: CreateTableDto = req.body;
      
      // Validate input
      if (!tableData.name || !tableData.columns || tableData.columns.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Table name and at least one column are required'
        });
      }

      const newTable = await this.tableModel.create(dbName, tableData);
      
      res.status(201).json({
        success: true,
        data: newTable,
        message: 'Table created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  public getTables = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName } = req.params;
      const tables = await this.tableModel.findAllInDatabase(dbName);
      
      res.status(200).json({
        success: true,
        data: tables,
        count: tables.length
      });
    } catch (error) {
      next(error);
    }
  };

  public getTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName, tableName } = req.params;
      const table = await this.tableModel.findOne(dbName, tableName);
      
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: table
      });
    } catch (error) {
      next(error);
    }
  };

  public getTableData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName, tableName } = req.params;
      const query: TableDataQuery = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        where: req.query.where ? JSON.parse(req.query.where as string) : undefined
      };
      
      const data = await this.tableModel.getTableData(dbName, tableName, query);
      
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };

  public updateTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName, tableName } = req.params;
      const updateData: UpdateTableDto = req.body;
      
      const updatedTable = await this.tableModel.update(dbName, tableName, updateData);
      
      if (!updatedTable) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedTable,
        message: 'Table updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dbName, tableName } = req.params;
      const success = await this.tableModel.delete(dbName, tableName);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Table not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Table deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}