// models/table.model.ts
import { Pool } from 'pg';
import { ITable, IColumn, ITableResponse, ITableError } from '../interfaces/table.interface';
import fs from 'fs';
import csv from 'csv-parser';
import { DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '@/config';
import { createSequelizeInstance, DB } from '@/databases';
import { DataTypes } from 'sequelize';

export class TableService {
  private tableModel = DB.TableModel;

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
        freezeTableName: true, // so Sequelize doesn't pluralize
      });
      await sequelize.authenticate();
      await DynamicModel.sync({ force: false }); // Set `force: true` to recreate
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

  // ... other methods remain similar but with consistent naming ...
}
