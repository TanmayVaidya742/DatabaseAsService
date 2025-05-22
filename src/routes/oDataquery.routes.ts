import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import ODataqueryController from '@/controllers/oDataquery.controller';
import authMiddleware from '@middlewares/auth.middleware';

class ODataqueryRoute implements Routes {
  public path = '/api/query';
  public router = Router();
  public oDataqueryController = new ODataqueryController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET data with filters
    this.router.get(`${this.path}/:dbname/:tablename`, authMiddleware, this.oDataqueryController.getData);
    
    // INSERT data
    this.router.post(`${this.path}/:dbname/:tablename/insert`, authMiddleware, this.oDataqueryController.insertData);
    
    // UPDATE data
    this.router.patch(`${this.path}/:dbname/:tablename`, authMiddleware, this.oDataqueryController.updateData);
    
    // DELETE data
    this.router.delete(`${this.path}/:dbname/:tablename`, authMiddleware, this.oDataqueryController.deleteData);
  }
}

export default ODataqueryRoute;