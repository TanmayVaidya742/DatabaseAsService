import { Pool } from 'pg';
import { ITable, IColumn, ITableResponse, ITableError } from '../interfaces/table.interface';
import fs from 'fs';
import csv from 'csv-parser';
import { DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '@/config';
import { createSequelizeInstance, DB } from '@/databases';
import { DataTypes } from 'sequelize';

export class TableService {
  private tableModel = DB.TableModel;

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
}