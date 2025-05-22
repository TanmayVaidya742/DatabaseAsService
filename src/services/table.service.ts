import { Pool } from 'pg';
import { ITable, IColumn, ITableResponse, ITableError } from '../interfaces/table.interface';
import fs from 'fs';
import csv from 'csv-parser';
import { DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '@/config';
import { createSequelizeInstance, DB } from '@/databases';
import { DataTypes } from 'sequelize';
import { error } from 'console';
import csvParser from 'csv-parser';

export class TableService {
  private tableModel = DB.TableModel;
  private databaseCollectionModel = DB.DatabaseCollectionModel;

  private async getTempPool(database: string): Promise<Pool> {
    return new Pool({
      user: DB_USER,
      host: DB_HOST,
      database,
      password: DB_PASSWORD,
      port: Number(DB_PORT),
    });
  }

  public async createTable(
    orgId: string,
    dbId: string,
    dbName: string,
    tableName: string,
    userId: string,
    columns?: string,
    csvFile?: Express.Multer.File,
  ): Promise<ITable> {
    try {

      if (csvFile) {
      return await this.createTableFromCSV(orgId, dbId, dbName, tableName, userId, csvFile);
      }
      const mapDataType = type => {
        const map = {
          STRING: DataTypes.STRING,
          INTEGER: DataTypes.INTEGER,
          BOOLEAN: DataTypes.BOOLEAN,
          UUID: DataTypes.UUID,
          DATE: DataTypes.DATE,
          TEXT: DataTypes.TEXT,
          FLOAT: DataTypes.FLOAT,
          DOUBLE: DataTypes.DOUBLE,
          BIGINT: DataTypes.BIGINT,
        };
        return map[type.toUpperCase()];
      };
      const sequelize = await createSequelizeInstance(dbName);
      const schema = JSON.parse(columns);

      const schemaStructure = {};
      for (const field of schema) {
        schemaStructure[field.name] = {
          type: mapDataType(field.type),
          allowNull: field.isNullable ?? true,
          unique: field.isUnique ?? false,
          primaryKey: field.isPrimary ?? false,
          defaultValue: field.defaultValue || undefined,
        };
      }

      const DynamicModel = sequelize.define(tableName, schemaStructure, {
        freezeTableName: true,
      });
      await sequelize.authenticate();
      await DynamicModel.sync({ force: false });
      console.log(`Table '${tableName}' created successfully in DB '${dbName}'`);

      let tablePayload = {
        orgId,
        dbId,
        dbName,
        tableName,
        userId,
        schema,
      };
      const createTableMetaData = await this.tableModel.create(tablePayload);
      return createTableMetaData;
    } catch (error) {
      throw error;
    }
  }

  public async createTableFromCSV(
  orgId: string,
  dbId: string,
  dbName: string,
  tableName: string,
  userId: string,
  csvFile: Express.Multer.File,
): Promise<ITable> {
  try {
    const sequelize = await createSequelizeInstance(dbName);
    const schemaStructure = {};
    const headers: string[] = [];

    // Step 1: Extract headers
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csvParser())
        .on('headers', (parsedHeaders) => {
          parsedHeaders.forEach(header => {
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            headers.push(cleanHeader);
            schemaStructure[cleanHeader] = {
              type: DataTypes.TEXT,
              allowNull: true,
            };
          });
          resolve();
        })
        .on('error', reject);
    });

    // Step 2: Define Sequelize model
    const DynamicModel = sequelize.define(tableName, schemaStructure, {
      freezeTableName: true,
    });

    await sequelize.authenticate();
    await DynamicModel.sync({ force: false });

    // Step 3: Insert CSV rows into the table
    await new Promise<void>((resolve, reject) => {
      const rowsToInsert: Record<string, any>[] = [];

      fs.createReadStream(csvFile.path)
        .pipe(csvParser())
        .on('data', (row) => {
          const cleanedRow = {};
          headers.forEach(originalHeader => {
            const rawValue = row[originalHeader];
            const key = originalHeader.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            cleanedRow[key] = rawValue;
          });
          rowsToInsert.push(cleanedRow);
        })
        .on('end', async () => {
          if (rowsToInsert.length > 0) {
            await DynamicModel.bulkCreate(rowsToInsert);
          }
          resolve();
        })
        .on('error', reject);
    });

    // Step 4: Save schema metadata
    const schemaMeta = headers.map(header => ({
      name: header,
      type: 'TEXT',
      isNullable: true,
      isUnique: false,
      isPrimary: false,
    }));

    const tablePayload = {
      orgId,
      dbId,
      dbName,
      tableName,
      userId,
      schema: schemaMeta,
    };

    const tableMeta = await this.tableModel.create(tablePayload);

    fs.unlinkSync(csvFile.path); // Clean up the uploaded CSV file

    return tableMeta;

  } catch (err) {
    throw err;
  }
}

  

  public async getTables(dbId: string, orgId: string): Promise<Array<ITable>> {
    const tableData = await this.tableModel.findAll({ where: { dbId, orgId }, raw: true });
    return tableData;
  }

  public async getTableSchema(dbName: string, tableName: string): Promise<ITableResponse | ITableError> {
    try {
      const sequelize = await createSequelizeInstance(dbName);
      const queryInterface = sequelize.getQueryInterface();
      const tableDescription = await queryInterface.describeTable(tableName);
      
      if (!tableDescription) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database '${dbName}'`,
        };
      }

      return {
        message: `Schema for table '${tableName}' retrieved successfully`,
        schema: tableDescription,
      };
    } catch (error) {
      throw new Error(`Failed to fetch table schema: ${error.message}`);
    }
  }

  public async updateTableSchema(dbName: string, tableName: string, schema: IColumn[]): Promise<ITableResponse | ITableError> {
    try {
      const sequelize = await createSequelizeInstance(dbName);
      const queryInterface = sequelize.getQueryInterface();
      
      const currentSchema = await queryInterface.describeTable(tableName);
      
      if (!currentSchema) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database '${dbName}'`,
        };
      }

      const mapDataType = type => {
        const map = {
          STRING: DataTypes.STRING,
          INTEGER: DataTypes.INTEGER,
          BOOLEAN: DataTypes.BOOLEAN,
          UUID: DataTypes.UUID,
          DATE: DataTypes.DATE,
          TEXT: DataTypes.TEXT,
          FLOAT: DataTypes.FLOAT,
          DOUBLE: DataTypes.DOUBLE,
          BIGINT: DataTypes.BIGINT,
        };
        return map[type.toUpperCase()];
      };

      for (const field of schema) {
        if (!currentSchema[field.name]) {
          await queryInterface.addColumn(tableName, field.name, {
            type: mapDataType(field.type),
            allowNull: field.isNullable ?? true,
            unique: field.isUnique ?? false,
            primaryKey: field.isPrimaryKey ?? false,
            defaultValue: field.defaultValue || undefined,
          });
        } else {
          await queryInterface.changeColumn(tableName, field.name, {
            type: mapDataType(field.type),
            allowNull: field.isNullable ?? true,
            unique: field.isUnique ?? false,
            defaultValue: field.defaultValue || undefined,
          });
        }
      }

      await this.tableModel.update(
        { schema },
        { where: { dbName, tableName } }
      );

      return {
        message: `Schema for table '${tableName}' updated successfully`,
      };
    } catch (error) {
      throw new Error(`Failed to update table schema: ${error.message}`);
    }
  }

  public async deleteTable(dbId: string, tableName: string, orgId: string, dbName: string): Promise<ITableResponse | ITableError> {
    let dbPool: Pool | null = null;
    try {
      // Find the table metadata
      const table = await this.tableModel.findOne({
        where: { dbId, tableName, orgId },
      });

      if (!table) {
        return {
          error: 'Not found',
          details: `Table '${tableName}' not found in database with ID '${dbId}'`,
        };
      }

      // Create a connection to the specific database
      dbPool = await this.getTempPool(dbName);

      // Drop the table from the PostgreSQL database
      await dbPool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

      // Delete the table metadata from TableModel
      await table.destroy();

      return {
        message: `Table '${tableName}' deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting table '${tableName}':`, error);
      throw new Error(`: ${error.message}`);
    } finally {
      if (dbPool) {
        await dbPool.end();
      }
    }
  }
  public async viewTableData(dbName: string, tableName: string, userId: string, mainPool: Pool): Promise<any> {
    let dbPool = null;
    let client = null;

    try {
      const dbResult = await this.databaseCollectionModel.findOne({
      where: {
        dbName: dbName,
        userId: userId,
      },
      raw: true,
    })

    if (dbResult.dbId = null) {
      throw new Error('Database not found or access denied');
    }


    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
    });

    const isValidTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
    if (!isValidTableName) {
      throw new Error('Invalid table name');
    }

    const dataResult = await dbPool.query(`SELECT * FROM ${tableName}`);
    return dataResult.rows;

    }
    catch(error){
      throw error;
    } 
    finally {
      if (dbPool) await dbPool.end().catch(console.error);
      if (client) client.release();
    }
  }

  public async viewTableColumns(dbName: string, tableName: string, userId: string, mainPool: Pool): Promise<any> {
    let dbPool = null;
    let client = null;

    try {
    // Verify user access
    // client = await mainPool.connect();
    // const dbResult = await client.query(
    //   'SELECT dbId FROM databases_collection WHERE dbName = $1 AND userId = $2',
    //   [dbName, userId]
    // );

    const dbResult = await this.databaseCollectionModel.findOne({
      where: {
        dbName: dbName,
        userId: userId,
      },
      raw: true,
    })

    if (dbResult.dbId = null) {
      throw new Error('Database not found or access denied');
    }

    // Connect to specific DB
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
    });

    // 🛡️ Validate table name
    const isValidTableName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
    if (!isValidTableName) {
      throw new Error('Invalid table name');
    }

    // Fetch column metadata
    const columnsResult = await dbPool.query(
      `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position
      `,
      [tableName]
    );

    return columnsResult.rows;
  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (client) client.release();
  }
  }

}
