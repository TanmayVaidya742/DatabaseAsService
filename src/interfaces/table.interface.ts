
import { Multer } from 'multer';

export interface ITable {
  tableId: string;
  tableName: string;
  orgId: string;
  userId: string;
  unitId?: string;
  dbId: string;
  schema: [];
  createdAt: Date;
  updatedAt: Date;
  isPyramidDocument: boolean;
}

export interface ITableCreateRequest {
  tableName: string;
  columns?: IColumn[] | string;
  csvFile?: Express.Multer.File;
}

export interface ITableUpdateRequest {
  columns: IColumn[];
}

export interface IColumn {
  name: string;
  type: string;
  isNullable?: boolean;
  isUnique: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  columnDefault?: string | null;
}

export interface ITableResponse {
  message: string;
  schema?: Record<string, string>;
}

export interface ITableError {
  error: string;
  details?: string;
}
