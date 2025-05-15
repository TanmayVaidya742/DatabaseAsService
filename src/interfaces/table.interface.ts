export interface ITable {
  name: string;
  databaseName: string;
  schema: {
    columns: {
      name: string;
      type: string; // PostgreSQL specific types
      constraints?: string[];
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableDto {
  name: string;
  columns: {
    name: string;
    type: string;
    constraints?: string[];
  }[];
}

export interface UpdateTableDto {
  columns?: {
    name: string;
    type: string;
    constraints?: string[];
  }[];
  newName?: string;
}

export interface TableDataQuery {
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
}