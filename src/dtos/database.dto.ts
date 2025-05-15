import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    orgId?: string;
    unitId?: string;
    // add more fields as needed
  };
}

export interface CreateDatabaseRequest {
  databaseName: string;
}

export interface CreateTableRequest {
  tableName: string;
  columns: TableColumn[];
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isNotNull?: boolean;
  isUnique?: boolean;
  default?: any;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface UpdateTableRequest {
  addColumns?: TableColumn[];
  removeColumns?: string[];
}
