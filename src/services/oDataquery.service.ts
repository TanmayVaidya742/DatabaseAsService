import { Pool } from 'pg';

interface QueryResult {
  rows: any[];
  rowCount: number;
}

interface GetDataResult {
  data: any[];
}

export default class ODataquery {
  private poolCache: Record<string, Pool> = {};

  private getDbPool(dbname: string): Pool {
    if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
      throw new Error('Invalid database name');
    }

    if (!this.poolCache[dbname]) {
      this.poolCache[dbname] = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: dbname,
        password: process.env.DB_PASSWORD || 'postgres',
        port: Number(process.env.DB_PORT) || 5432,
      });
    }

    return this.poolCache[dbname];
  }

  public async getData(dbname: string, tablename: string, filters: Record<string, any>): Promise<GetDataResult> {
    const pool = this.getDbPool(dbname);

    if (!filters || Object.keys(filters).length === 0) {
      throw new Error('No filter object provided in request body');
    }

    // Build WHERE clause dynamically
    const conditions = Object.keys(filters).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const values = Object.values(filters);

    const query = `SELECT * FROM ${tablename} WHERE ${conditions}`;
    const result = await pool.query(query, values);

    return {
      data: result.rows
    };
  }

  public async insertData(dbname: string, tablename: string, data: Record<string, any>): Promise<any> {
    const pool = this.getDbPool(dbname);

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  public async updateData(dbname: string, tablename: string, filter: Record<string, any>, data: Record<string, any>): Promise<any[]> {
    const pool = this.getDbPool(dbname);

    // Build SET clause for update
    const setColumns = Object.keys(data).map((col, i) => `${col} = $${i + 1}`);
    const setValues = Object.values(data);

    // Build WHERE clause for filter
    const filterOffset = setValues.length;
    const whereColumns = Object.keys(filter).map((col, i) => `${col} = $${i + 1 + filterOffset}`);
    const whereValues = Object.values(filter);

    const query = `UPDATE ${tablename} SET ${setColumns.join(', ')} WHERE ${whereColumns.join(' AND ')} RETURNING *`;
    const result = await pool.query(query, [...setValues, ...whereValues]);

    return result.rows;
  }

  public async deleteData(dbname: string, tablename: string, filter: Record<string, any>): Promise<QueryResult> {
    const pool = this.getDbPool(dbname);

    // Build dynamic WHERE clause
    const conditions = Object.keys(filter)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    const values = Object.values(filter);

    const query = `DELETE FROM ${tablename} WHERE ${conditions} RETURNING *`;
    return await pool.query(query, values);
  }
}