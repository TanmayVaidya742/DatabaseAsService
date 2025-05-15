import { IUser } from '@interfaces/users.interface';

export interface Database {
  dbid: string;
  dbname: string;
  user: IUser;
  apikey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseTable {
  tableid: string;
  dbid: string;
  tablename: string;
  schema: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
