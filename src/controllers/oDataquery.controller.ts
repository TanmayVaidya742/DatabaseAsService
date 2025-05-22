import { NextFunction, Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import ODataquery from '@/services/oDataquery.service';

class ODataqueryController {
  public oDataquery = new ODataquery();

  public getData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbname, tablename } = req.params;
      const filters = req.body.filter || {};
      
      const result = await this.oDataquery.getData(dbname, tablename, filters);
      res.status(200).json({
        message: result.data.length === 0 ? 'No matching rows found' : 'Matching rows found',
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  public insertData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbname, tablename } = req.params;
      const data = req.body.data;
      
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        res.status(400).json({ error: 'Invalid or empty data object in request body' });
        return;
      }

      const result = await this.oDataquery.insertData(dbname, tablename, data);
      res.status(201).json({
        message: 'Row inserted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public updateData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbname, tablename } = req.params;
      const { filter, data } = req.body;
      
      if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
        res.status(400).json({ error: 'Invalid or missing filter object' });
        return;
      }

      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        res.status(400).json({ error: 'Invalid or missing data object' });
        return;
      }

      const result = await this.oDataquery.updateData(dbname, tablename, filter, data);
      
      if (result.length === 0) {
        res.status(404).json({ message: 'No matching rows found to update' });
        return;
      }

      res.status(200).json({
        message: 'Row(s) updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public deleteData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dbname, tablename } = req.params;
      const { filter } = req.body;
      
      if (!filter || Object.keys(filter).length === 0) {
        res.status(400).json({ error: 'Filter object is required to delete rows' });
        return;
      }

      const result = await this.oDataquery.deleteData(dbname, tablename, filter);
      
      if (result.rowCount === 0) {
        res.status(404).json({ message: 'No matching rows found to delete' });
        return;
      }

      res.status(200).json({
        message: 'Rows deleted successfully',
        deleted: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ODataqueryController;