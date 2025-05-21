// routes/table.routes.ts
import express, { Router } from 'express';
import multer from 'multer';
import { Pool } from 'pg';
import { TableController } from '../controllers/table.controller';
import { TableModel } from '../models/table.model';
import authMiddleware from '@/middlewares/auth.middleware';
import path from 'path';
import fs from 'fs';
import { Routes } from '@/interfaces/routes.interface';

// Configure upload directory
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// Create multer instance with CSV validation
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class  TableRoute implements Routes{
  public path = "/table";
  public router = Router();
  public tableController = new TableController();
constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
  // Table operations
  this.router.post(
    `${this.path}/:dbName/tables`,
    authMiddleware,
    upload.single('csvFile'),
    this.tableController.createTable
  );

  this.router.get(`${this.path}/:dbId/tables`,authMiddleware,this.tableController.getAllTables);
  }
}
export default TableRoute;