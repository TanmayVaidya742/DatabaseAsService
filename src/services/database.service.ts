import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAttributes, databaseCollectionModel } from '@/models/databaseCollection.model';
import multer from 'multer';
import { mainPool } from '@/utils/pool.utils';
import { DB } from '@/databases';
import { IDatabase } from '@/interfaces/database.interface';

export class DatabaseService {
  private databaseCollectionModel = DB.DatabaseCollectionModel;
  private generateApiKey(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private buildColumnDefinition(column: any): string {
    let definition = `${column.name} ${column.type}`;
    if (column.isPrimary) definition += ' PRIMARY KEY';
    if (column.isNotNull) definition += ' NOT NULL';
    if (column.isUnique) definition += ' UNIQUE';
    if (column.defaultValue) definition += ` DEFAULT ${column.defaultValue}`;
    if (column.foreignKey) {
      definition += ` REFERENCES ${column.foreignKey.table}(${column.foreignKey.column})`;
    }
    return definition;
  }

  private async getTempPool(database: string = 'postgres'): Promise<Pool> {
    return new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });
  }

  public async createDatabase(databaseName: string, userId: string, orgId: string): Promise<{ success: boolean; message: string }> {
    if (!databaseName) {
      throw new Error('Database name is required');
    }

    let tempPool: Pool | null = null;
    try {
      const databasePayload = {
        dbName: databaseName,
        userId,
        orgId,
      };
      await this.databaseCollectionModel.create(databasePayload);

      tempPool = await this.getTempPool();
      await tempPool.query(`CREATE DATABASE ${databaseName}`);

      return {
        success: true,
        message: `Database '${databaseName}' created successfully`,
      };
    } catch (error) {
      console.error('Error creating database:', error);

      if (tempPool) {
        try {
          await tempPool.query(
            `SELECT pg_terminate_backend(pg_stat_activity.pid)
             FROM pg_stat_activity
             WHERE pg_stat_activity.datname = $1
             AND pid <> pg_backend_pid();`,
            [databaseName],
          );
          await tempPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
        } catch (dropError) {
          console.error('Error dropping database:', dropError);
        }
      }

      const message = error.message.includes('already exists') ? 'Database name already exists' : 'Failed to create database';

      throw new Error(message);
    } finally {
      if (tempPool) await tempPool.end();
    }
  }

  // public async getDatabases(): Promise<{ success: boolean; data: any[]; count: number }> {
  //   let client: Pool | null = null;
  //   try {
  //     client = await this.getTempPool();
  //     const result = await client.query(`
  //       SELECT datname as name
  //       FROM pg_database
  //       WHERE datistemplate = false
  //       AND datname NOT IN ('postgres', 'template0', 'template1')
  //     `);

  //     return {
  //       success: true,
  //       data: result.rows,
  //       count: result.rowCount,
  //     };
  //   } catch (error) {
  //     console.error('Error fetching databases:', error);
  //     throw new Error('Failed to fetch databases');
  //   } finally {
  //     if (client) await client.end();
  //   }
  // }

  //   public async createDatabase(
  //   dbName: string,
  //   userId: string,
  //   orgId: string
  // ): Promise<{ success: boolean; message: string; dbId?: string; apiKey?: string }> {

  //   // Validation (keep your existing validation code)
  //   if (!dbName || !userId || !orgId) {
  //     throw new Error('Database name, user ID, and organization ID are required');
  //   }

  //   if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
  //     throw new Error('Database name can only contain letters, numbers, underscores, and hyphens');
  //   }

  //   if (dbName.length > 63) {
  //     throw new Error('Database name must be 63 characters or less');
  //   }

  //   let tempPool: Pool | null = null;
  //   const dbId = uuidv4();
  //   const apiKey = this.generateApiKey();

  //   try {
  //     // Connect to the default database (postgres)
  //     tempPool = await this.getTempPool('postgres');

  //     // Check/create the databases_collection table in the default database
  //     await tempPool.query(`
  //       CREATE TABLE IF NOT EXISTS databases_collection (
  //         dbId VARCHAR(36) PRIMARY KEY,
  //         dbName VARCHAR(255) NOT NULL,
  //         userId VARCHAR(36) NOT NULL,
  //         orgId VARCHAR(36) NOT NULL,
  //         apiKey VARCHAR(64) NOT NULL,
  //         createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  //         updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  //       )
  //     `);

  //     // First insert the record into databases_collection
  //     await tempPool.query(
  //       `INSERT INTO databases_collection
  //        (dbId, dbName, userId, orgId, apiKey)
  //        VALUES ($1, $2, $3, $4, $5)`,
  //       [dbId, dbName, userId, orgId, apiKey]
  //     );

  //     // Then create the physical database
  //     await tempPool.query(`CREATE DATABASE "${dbName}"`);

  //     return {
  //       success: true,
  //       message: `Database '${dbName}' created successfully`,
  //       dbId,
  //       apiKey
  //     };
  //   } catch (error) {
  //     console.error('Error creating database:', error);

  //     // Cleanup if anything failed
  //     if (tempPool) {
  //       try {
  //         // Delete the record if it was inserted
  //         await tempPool.query(
  //           `DELETE FROM databases_collection WHERE dbId = $1`,
  //           [dbId]
  //         );

  //         // Terminate connections and drop the database if created
  //         await tempPool.query(
  //           `SELECT pg_terminate_backend(pg_stat_activity.pid)
  //            FROM pg_stat_activity
  //            WHERE pg_stat_activity.datname = $1
  //            AND pid <> pg_backend_pid()`,
  //           [dbName]
  //         );
  //         await tempPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  //       } catch (cleanupError) {
  //         console.error('Cleanup failed:', cleanupError);
  //       }
  //     }

  //     // Handle specific error cases
  //     if (error.message.includes('already exists')) {
  //       throw new Error('Database name already exists');
  //     }

  //     throw new Error('Failed to create database: ' + error.message);
  //   } finally {
  //     if (tempPool) await tempPool.end();
  //   }
  // }

  // public async createDatabase(
  //   dbName: string,
  //   userId: string,
  //   orgId: string
  // ): Promise<{ success: boolean; message: string; dbId?: string; apiKey?: string }> {

  //   // Validation
  //   if (!dbName || !userId || !orgId) {
  //     throw new Error('Database name, user ID, and organization ID are required');
  //   }

  //   if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
  //     throw new Error('Database name can only contain letters, numbers, underscores, and hyphens');
  //   }

  //   if (dbName.length > 63) {
  //     throw new Error('Database name must be 63 characters or less');
  //   }

  //   let metadataPool: Pool | null = null;
  //   let tempPool: Pool | null = null;
  //   const dbId = uuidv4();
  //   const apiKey = this.generateApiKey();

  //   try {
  //     // Connect to PYRAMID_DBAAS for metadata operations
  //     metadataPool = await this.getTempPool('PYRAMID_DBAAS');

  //     // Ensure the table exists in PYRAMID_DBAAS
  //     await metadataPool.query(`
  //       CREATE TABLE IF NOT EXISTS databases_collection (
  //         dbId VARCHAR(36) PRIMARY KEY,
  //         dbName VARCHAR(255) NOT NULL,
  //         userId VARCHAR(36) NOT NULL,
  //         orgId VARCHAR(36) NOT NULL,
  //         apiKey VARCHAR(64) NOT NULL,
  //         createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  //         updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  //       )
  //     `);

  //     // Insert metadata first
  //     await metadataPool.query(
  //       `INSERT INTO databases_collection
  //        (dbId, dbName, userId, orgId, apiKey)
  //        VALUES ($1, $2, $3, $4, $5)`,
  //       [dbId, dbName, userId, orgId, apiKey]
  //     );

  //     // Connect to postgres to create the actual database
  //     tempPool = await this.getTempPool();
  //     await tempPool.query(`CREATE DATABASE "${dbName}"`);

  //     return {
  //       success: true,
  //       message: `Database '${dbName}' created successfully`,
  //       dbId,
  //       apiKey
  //     };
  //   } catch (error) {
  //     console.error('Error creating database:', error);

  //     // Cleanup if anything failed
  //     if (metadataPool) {
  //       try {
  //         // Delete the metadata record if insertion failed
  //         await metadataPool.query(
  //           `DELETE FROM databases_collection WHERE dbId = $1`,
  //           [dbId]
  //         );
  //       } catch (cleanupError) {
  //         console.error('Metadata cleanup failed:', cleanupError);
  //       }
  //     }

  //     if (tempPool) {
  //       try {
  //         // Terminate connections and drop the database if created
  //         await tempPool.query(
  //           `SELECT pg_terminate_backend(pg_stat_activity.pid)
  //            FROM pg_stat_activity
  //            WHERE pg_stat_activity.datname = $1
  //            AND pid <> pg_backend_pid()`,
  //           [dbName]
  //         );
  //         await tempPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  //       } catch (cleanupError) {
  //         console.error('Database cleanup failed:', cleanupError);
  //       }
  //     }

  //     // Handle specific error cases
  //     if (error.message.includes('already exists')) {
  //       throw new Error('Database name already exists');
  //     }

  //     throw new Error('Failed to create database: ' + error.message);
  //   } finally {
  //     if (metadataPool) await metadataPool.end();
  //     if (tempPool) await tempPool.end();
  //   }
  // }

  public async getDatabases(userId: string, orgId: string): Promise<{ success: boolean; data: any[]; count: number }> {
    try {
      const databaseData = await this.databaseCollectionModel.findAll({ where: { orgId, userId }, raw: true });
      const totalCount = await this.databaseCollectionModel.count({ where: { userId, orgId } });

      
        
      

      return {
        success: true,
        data: databaseData,
        count: totalCount,
      };
    } catch (error) {
      console.error('Error fetching databases:', error);
      throw new Error('Failed to fetch databases');
    }
  }

  //   public async getDatabases(): Promise<{ success: boolean; data: any[]; count: number }> {
  //   let client: Pool | null = null;
  //   try {
  //     client = await this.getTempPool();
  //     const result = await client.query(`
  //       SELECT datname as name
  //       FROM pg_database
  //       WHERE datistemplate = false
  //       AND datname NOT IN ('postgres', 'template0', 'template1')
  //     `);

  //     console.log('Database query result:', result.rows); // Debug log

  //     return {
  //       success: true,
  //       data: result.rows,
  //       count: result.rowCount,
  //     };
  //   } catch (error) {
  //     console.error('Error in database service:', {
  //       message: error.message,
  //       stack: error.stack
  //     });
  //     throw error;
  //   } finally {
  //     if (client) await client.end();
  //   }
  // }

  public async createTable(
    dbName: string,
    tableName: string,
    columns?: any[],
    csvFile?: multer.File,
  ): Promise<{ success: boolean; message: string }> {
    if (!dbName || !tableName) {
      throw new Error('Database name and table name are required');
    }

    let dbPool: Pool | null = null;
    try {
      dbPool = await this.getTempPool(dbName);
      let tableColumns: string[] = [];

      if (csvFile) {
        const columnsFromCsv = await new Promise<string[]>((resolve, reject) => {
          const columns: string[] = [];
          fs.createReadStream(csvFile.path)
            .pipe(csv())
            .on('headers', (headers: string[]) => {
              headers.forEach(header => {
                columns.push(`${header} TEXT`);
              });
              resolve(columns);
            })
            .on('error', reject);
        });
        tableColumns = columnsFromCsv;
      } else if (columns && Array.isArray(columns)) {
        tableColumns = columns.map(this.buildColumnDefinition);
      } else {
        throw new Error('Either columns or CSV file must be provided');
      }

      await dbPool.query(`CREATE TABLE ${tableName} (${tableColumns.join(', ')})`);

      return {
        success: true,
        message: `Table '${tableName}' created successfully in database '${dbName}'`,
      };
    } catch (error: any) {
      console.error('Error creating table:', error);
      throw new Error(error.message.includes('already exists') ? 'Table already exists' : error.message);
    } finally {
      if (dbPool) await dbPool.end();
      if (csvFile?.path) {
        try {
          fs.unlinkSync(csvFile.path);
        } catch (err) {
          console.error('Error deleting CSV file:', err);
        }
      }
    }
  };


    public async getDatabasesByDbId(dbId: string, dbName: string): Promise<DatabaseAttributes> {
    try {
      const databaseData = await this.databaseCollectionModel.findOne({ where: { dbId, dbName }, raw: true });
      return databaseData;
     
    } catch (error) {
      console.error('Error fetching databases:', error);
      throw new Error('Failed to fetch databases');
    }
  }

}
