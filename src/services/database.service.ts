import { CreateDatabaseRequest, CreateTableRequest, UpdateTableRequest, TableColumn } from '../dtos/database.dto';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { mainPool, getPoolForDatabase } from '../utils/pool.utils';

export class DatabaseService {
  constructor() {}

  async createDatabase(userId: string, data: CreateDatabaseRequest) {
    const dbName = data.databaseName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const apiKey = uuidv4();
    const dbId = uuidv4();

    await mainPool.query(`CREATE DATABASE ${dbName}`);

    await mainPool.query(
      `INSERT INTO databases (db_id, db_name, user_id, api_key, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [dbId, dbName, userId, apiKey]
    );

    return {  
      dbid: dbId,
      dbname: dbName,
      apikey: apiKey,
      createdAt: new Date(),
    };
  }

  async getDatabases(userId: string) {
    const result = await mainPool.query(
      `SELECT db_id, db_name, api_key, created_at FROM databases WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async getDatabaseDetails(userId: string, dbName: string) {
    const result = await mainPool.query(
      `SELECT db_id, db_name, api_key, created_at FROM databases WHERE user_id = $1 AND db_name = $2`,
      [userId, dbName]
    );
    return result.rows[0] || null;
  }

  async deleteDatabase(userId: string, dbName: string) {
    await mainPool.query(
      `DELETE FROM databases WHERE user_id = $1 AND db_name = $2`,
      [userId, dbName]
    );

    await mainPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
  }

  async createTable(userId: string, dbName: string, data: CreateTableRequest) {
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
      `INSERT INTO tables (table_id, db_name, user_id, table_name, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [tableId, dbName, userId, data.tableName]
    );

    return {
      tableid: tableId,
      dbid: dbName,
      tablename: data.tableName,
      schema: data.columns,
      createdAt: new Date(),
    };
  }

  async getTables(userId: string, dbName: string) {
    const pool = getPoolForDatabase(dbName);
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    return result.rows.map(row => row.table_name);
  }

  async deleteTable(userId: string, dbName: string, tableName: string) {
    const pool = getPoolForDatabase(dbName);
    await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);

    await mainPool.query(
      `DELETE FROM tables WHERE user_id = $1 AND db_name = $2 AND table_name = $3`,
      [userId, dbName, tableName]
    );
  }

  async getTableData(userId: string, dbName: string, tableName: string) {
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
  ) {
    const pool = getPoolForDatabase(dbName);

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

    const schemaResult = await pool.query(`
      SELECT column_name AS name, data_type AS type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);

    return {
      tableid: tableName,
      dbid: dbName,
      tablename: tableName,
      schema: schemaResult.rows,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
