import { CreateDatabaseRequest, CreateTableRequest, UpdateTableRequest, TableColumn } from '../dtos/database.dto';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { mainPool, getPoolForDatabase } from '../utils/pool.utils';
import { Database, DatabaseTable } from '../models/database.model';

export class DatabaseService {
  constructor() {}

  async createDatabase(userId: string, data: CreateDatabaseRequest): Promise<Database> {
    const dbName = data.databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const apiKey = uuidv4();
    const dbId = uuidv4();

    await mainPool.query(`CREATE DATABASE ${dbName}`);

    await mainPool.query(
      `INSERT INTO databases (db_id, db_name, user_id, api_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [dbId, dbName, userId, apiKey]
    );

    return {
      dbid: dbId,
      dbname: dbName,
      apikey: apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: userId }
    };
  }

  async getDatabases(userId: string): Promise<Database[]> {
    const result = await mainPool.query(
      `SELECT db_id as dbid, db_name as dbname, api_key as apikey, 
              created_at as "createdAt", updated_at as "updatedAt", user_id as "user.id"
       FROM databases WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async getDatabaseDetails(userId: string, dbName: string): Promise<Database> {
    const result = await mainPool.query(
      `SELECT db_id as dbid, db_name as dbname, api_key as apikey, 
              created_at as "createdAt", updated_at as "updatedAt", user_id as "user.id"
       FROM databases WHERE user_id = $1 AND db_name = $2`,
      [userId, dbName]
    );
    return result.rows[0];
  }

  async deleteDatabase(userId: string, dbName: string): Promise<void> {
    await mainPool.query('BEGIN');
    try {
      await mainPool.query(
        `DELETE FROM tables WHERE user_id = $1 AND db_name = $2`,
        [userId, dbName]
      );
      
      await mainPool.query(
        `DELETE FROM databases WHERE user_id = $1 AND db_name = $2`,
        [userId, dbName]
      );
      
      await mainPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await mainPool.query('COMMIT');
    } catch (error) {
      await mainPool.query('ROLLBACK');
      throw error;
    }
  }

  async createTable(userId: string, dbName: string, data: CreateTableRequest): Promise<DatabaseTable> {
    const pool = getPoolForDatabase(dbName);
    const tableId = uuidv4();

    const columnsSql = data.columns
      .map((col: TableColumn) => {
        let line = `"${col.name}" ${col.type}`;
        if (col.isPrimaryKey) line += ' PRIMARY KEY';
        if (col.isNotNull) line += ' NOT NULL';
        if (col.isUnique) line += ' UNIQUE';
        if (col.default !== undefined) line += ` DEFAULT ${col.default}`;
        if (col.foreignKey) {
          line += ` REFERENCES "${col.foreignKey.table}"("${col.foreignKey.column}")`;
        }
        return line;
      })
      .join(', ');

    await pool.query(`CREATE TABLE IF NOT EXISTS "${data.tableName}" (${columnsSql})`);

    await mainPool.query(
      `INSERT INTO tables (table_id, db_name, user_id, table_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [tableId, dbName, userId, data.tableName]
    );

    const schema = data.columns.reduce((acc, col) => {
      acc[col.name] = col.type;
      return acc;
    }, {} as Record<string, string>);

    return {
      tableid: tableId,
      dbid: dbName,
      tablename: data.tableName,
      schema,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getTables(userId: string, dbName: string): Promise<string[]> {
    const result = await mainPool.query(
      `SELECT table_name FROM tables WHERE user_id = $1 AND db_name = $2`,
      [userId, dbName]
    );
    return result.rows.map(row => row.table_name);
  }

  async deleteTable(userId: string, dbName: string, tableName: string): Promise<void> {
    const pool = getPoolForDatabase(dbName);
    
    await mainPool.query('BEGIN');
    try {
      await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);
      
      await mainPool.query(
        `DELETE FROM tables WHERE user_id = $1 AND db_name = $2 AND table_name = $3`,
        [userId, dbName, tableName]
      );
      
      await mainPool.query('COMMIT');
    } catch (error) {
      await mainPool.query('ROLLBACK');
      throw error;
    }
  }

  async getTableData(userId: string, dbName: string, tableName: string): Promise<{ schema: any[], data: any[] }> {
    const pool = getPoolForDatabase(dbName);

    const schemaResult = await pool.query(`
      SELECT column_name AS name, data_type AS type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);

    const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);

    return {
      schema: schemaResult.rows,
      data: dataResult.rows,
    };
  }

  async updateTableStructure(
    userId: string,
    dbName: string,
    tableName: string,
    data: UpdateTableRequest
  ): Promise<DatabaseTable> {
    const pool = getPoolForDatabase(dbName);

    await mainPool.query('BEGIN');
    try {
      // Add new columns
      for (const column of data.addColumns || []) {
        let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${column.name}" ${column.type}`;
        if (column.isNotNull) sql += ' NOT NULL';
        if (column.isUnique) sql += ' UNIQUE';
        if (column.default !== undefined) sql += ` DEFAULT ${column.default}`;
        if (column.foreignKey) {
          sql += ` REFERENCES "${column.foreignKey.table}"("${column.foreignKey.column}")`;
        }
        await pool.query(sql);
      }

      // Remove columns
      for (const columnName of data.removeColumns || []) {
        await pool.query(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${columnName}"`);
      }

      // Update table metadata
      await mainPool.query(
        `UPDATE tables SET updated_at = NOW() 
         WHERE user_id = $1 AND db_name = $2 AND table_name = $3`,
        [userId, dbName, tableName]
      );

      const schemaResult = await pool.query(`
        SELECT column_name AS name, data_type AS type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);

      await mainPool.query('COMMIT');

      return {
        tableid: tableName,
        dbid: dbName,
        tablename: tableName,
        schema: schemaResult.rows.reduce((acc, row) => {
          acc[row.name] = row.type;
          return acc;
        }, {} as Record<string, string>),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      await mainPool.query('ROLLBACK');
      throw error;
    }
  }
}