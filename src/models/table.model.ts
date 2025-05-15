import { ITable, CreateTableDto, UpdateTableDto, TableDataQuery } from '../interfaces/table.interface';
import { DatabaseModel } from './database.model';
import { Pool } from 'pg';

export class TableModel {
  private static instance: TableModel;
  private tables: Record<string, ITable> = {};

  private constructor() {}

  public static getInstance(): TableModel {
    if (!TableModel.instance) {
      TableModel.instance = new TableModel();
    }
    return TableModel.instance;
  }

  public async create(dbName: string, tableData: CreateTableDto): Promise<ITable> {
    const timestamp = new Date();
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    const columns = tableData.columns.map(col => 
      `"${col.name}" ${col.type} ${col.constraints?.join(' ') || ''}`
    ).join(', ');

    await pool.query(`CREATE TABLE "${tableData.name}" (${columns})`);

    const newTable: ITable = {
      name: tableData.name,
      databaseName: dbName,
      schema: {
        columns: tableData.columns
      },
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.tables[`${dbName}.${tableData.name}`] = newTable;
    return newTable;
  }

  public async findAllInDatabase(dbName: string): Promise<ITable[]> {
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    const result = await pool.query(`
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_catalog = $1
    `, [dbName]);

    return Promise.all(result.rows.map(async (row) => {
      const tableKey = `${dbName}.${row.name}`;
      if (this.tables[tableKey]) {
        return this.tables[tableKey];
      }

      // If table not in cache, get its schema
      const columns = await this.getTableColumns(dbName, row.name);
      return {
        name: row.name,
        databaseName: dbName,
        schema: { columns },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }));
  }

  private async getTableColumns(dbName: string, tableName: string): Promise<any[]> {
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    const result = await pool.query(`
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    return result.rows.map(row => ({
      name: row.name,
      type: row.type,
      constraints: [
        ...(row.is_nullable === 'NO' ? ['NOT NULL'] : []),
        ...(row.column_default ? [`DEFAULT ${row.column_default}`] : [])
      ]
    }));
  }

  public async getTableData(
    dbName: string, 
    tableName: string,
    query: TableDataQuery = {}
  ): Promise<any[]> {
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    let whereClause = '';
    const values: any[] = [];
    let paramIndex = 1;

    if (query.where) {
      const conditions = Object.entries(query.where).map(([key, value]) => {
        values.push(value);
        return `"${key}" = $${paramIndex++}`;
      });
      whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

    const limit = query.limit ? `LIMIT $${paramIndex++}` : '';
    if (query.limit) values.push(query.limit);

    const offset = query.offset ? `OFFSET $${paramIndex++}` : '';
    if (query.offset) values.push(query.offset);

    const result = await pool.query(
      `SELECT * FROM "${tableName}" ${whereClause} ${limit} ${offset}`,
      values
    );

    return result.rows;
  }

  public async update(
    dbName: string, 
    tableName: string, 
    updateData: UpdateTableDto
  ): Promise<ITable> {
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    if (updateData.newName) {
      await pool.query(`ALTER TABLE "${tableName}" RENAME TO "${updateData.newName}"`);
      
      // Update cache
      const tableKey = `${dbName}.${tableName}`;
      if (this.tables[tableKey]) {
        this.tables[`${dbName}.${updateData.newName}`] = {
          ...this.tables[tableKey],
          name: updateData.newName,
          updatedAt: new Date()
        };
        delete this.tables[tableKey];
      }
    }

    if (updateData.columns) {
      // For simplicity, we'll drop and recreate the table
      // In production, you'd want to use ALTER TABLE statements
      const table = await this.findOne(dbName, tableName);
      if (!table) throw new Error('Table not found');

      const tempName = `${tableName}_temp_${Date.now()}`;
      await this.create(dbName, {
        name: tempName,
        columns: updateData.columns
      });

      // Copy data if needed
      const columnsToCopy = updateData.columns
        .filter(newCol => table.schema.columns.some(oldCol => oldCol.name === newCol.name))
        .map(col => `"${col.name}"`);

      if (columnsToCopy.length > 0) {
        await pool.query(`
          INSERT INTO "${tempName}" (${columnsToCopy.join(', ')})
          SELECT ${columnsToCopy.join(', ')} FROM "${tableName}"
        `);
      }

      // Drop old table and rename new one
      await pool.query(`DROP TABLE "${tableName}"`);
      await pool.query(`ALTER TABLE "${tempName}" RENAME TO "${tableName}"`);

      // Update cache
      const tableKey = `${dbName}.${tableName}`;
      this.tables[tableKey] = {
        name: tableName,
        databaseName: dbName,
        schema: {
          columns: updateData.columns
        },
        createdAt: table.createdAt,
        updatedAt: new Date()
      };
    }

    return this.findOne(dbName, updateData.newName || tableName) as Promise<ITable>;
  }

  public async delete(dbName: string, tableName: string): Promise<boolean> {
    const dbModel = DatabaseModel.getInstance();
    const pool = await dbModel.getPool(dbName);

    await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);

    const tableKey = `${dbName}.${tableName}`;
    if (this.tables[tableKey]) {
      delete this.tables[tableKey];
    }

    return true;
  }

  public async findOne(dbName: string, tableName: string): Promise<ITable | undefined> {
    const tableKey = `${dbName}.${tableName}`;
    if (this.tables[tableKey]) {
      return this.tables[tableKey];
    }

    try {
      const columns = await this.getTableColumns(dbName, tableName);
      return {
        name: tableName,
        databaseName: dbName,
        schema: { columns },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      return undefined;
    }
  }
}