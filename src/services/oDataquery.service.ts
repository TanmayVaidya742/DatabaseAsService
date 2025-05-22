// services/oData.service.ts
import { Pool } from 'pg';

interface QueryResult {
  rows: any[];
  rowCount: number;
}

interface GetDataResult {
  value: any[];
  count?: number;
}

export class ODataService {
  private poolCache: Record<string, Pool> = {};

  private getDbPool(dbName: string): Pool {
    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
      throw new Error('Invalid database name');
    }

    if (!this.poolCache[dbName]) {
      this.poolCache[dbName] = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: dbName,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
      });
    }

    return this.poolCache[dbName];
  }

  public async getData(
    dbName: string,
    tableName: string,
    options: {
      filter?: string;
      select?: string;
      orderby?: string;
      top?: string;
      skip?: string;
      count?: string;
    }
  ): Promise<GetDataResult> {
    const pool = this.getDbPool(dbName);
    const { filter, select, orderby, top, skip, count } = options;

    // Build SELECT clause
    const selectClause = select
      ? select.split(',').map(col => `"${col.trim()}"`).join(', ')
      : '*';

    // Build WHERE clause
    let whereClause = '';
    const params: any[] = [];
    if (filter) {
      whereClause = this.parseFilter(filter, params);
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (orderby) {
      orderByClause = this.parseOrderBy(orderby);
    }

    // Build LIMIT/OFFSET
    let limitOffsetClause = '';
    if (top) {
      limitOffsetClause = ` LIMIT ${top}`;
      if (skip) {
        limitOffsetClause += ` OFFSET ${skip}`;
      }
    }

    // Main query
    const query = `SELECT ${selectClause} FROM "${tableName}"${whereClause}${orderByClause}${limitOffsetClause}`;
    const result = await pool.query(query, params);

    // Count query if requested
    let rowCount = null;
    if (count === 'true') {
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      rowCount = parseInt(countResult.rows[0].count);
    }

    return {
      value: result.rows,
      ...(rowCount !== null && { count: rowCount })
    };
  }

 public async insertData(dbName: string, tableName: string, data: Record<string, any>): Promise<any> {
    const pool = this.getDbPool(dbName);

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Invalid or empty data object');
    }

    // Add current timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const columns = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0];
}

  // services/oData.service.ts
public async updateData(
    dbName: string,
    tableName: string,
    filter: string,
    data: Record<string, any>
): Promise<QueryResult> {
    const pool = this.getDbPool(dbName);

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('Invalid or empty data object');
    }

    if (!filter) {
        throw new Error('Filter parameter is required for updates');
    }

    // Add updatedAt timestamp
    const dataWithTimestamp = {
        ...data,
        updatedAt: new Date()
    };

    // Build SET clause with proper parameter numbering
    const setEntries = Object.entries(dataWithTimestamp);
    const setColumns = setEntries.map(([col], i) => `"${col}" = $${i + 1}`);
    const setValues = setEntries.map(([, val]) => val);
    
    // Parse filter to get WHERE clause and filter parameters
    const filterParams: any[] = [];
    const whereClause = this.parseFilter(filter, filterParams);
    
    if (!whereClause) {
        throw new Error('Invalid filter parameter');
    }

    // Combine parameters (set values first, then filter values)
    const params = [...setValues, ...filterParams];
    
    // Re-number WHERE clause parameters to come after SET parameters
    const whereClauseWithOffset = whereClause.replace(/\$(\d+)/g, (_, p1) => {
        return `$${Number(p1) + setValues.length}`;
    });

    const query = `UPDATE "${tableName}" SET ${setColumns.join(', ')}${whereClauseWithOffset} RETURNING *`;
    
    console.debug('Update query:', query);
    console.debug('Parameters:', params);
    
    return await pool.query(query, params);
}







  public async deleteData(dbName: string, tableName: string, filter: string): Promise<QueryResult> {
    const pool = this.getDbPool(dbName);

    if (!filter) {
      throw new Error('Filter parameter is required for deletes');
    }

    // Parse filter
    const params: any[] = [];
    const whereClause = this.parseFilter(filter, params);
    
    if (!whereClause) {
      throw new Error('Invalid filter parameter');
    }

    const query = `DELETE FROM "${tableName}"${whereClause} RETURNING *`;
    return await pool.query(query, params);
  }

  public async getMetadata(dbName: string): Promise<any> {
    const pool = this.getDbPool(dbName);

    // Get all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Get columns for each table
    const entityTypes: Record<string, any> = {};
    const entitySets: Record<string, any> = {};

    for (const table of tables.rows) {
      const tableName = table.table_name;
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);

      entityTypes[tableName] = {
        name: tableName,
        properties: columns.rows.map(col => ({
          name: col.column_name,
          type: this.mapType(col.data_type),
          nullable: col.is_nullable === 'YES'
        }))
      };

      entitySets[tableName] = {
        entityType: `${dbName}.${tableName}`
      };
    }

    return {
      $Version: '4.0',
      [`${dbName}.${dbName}`]: {
        $Kind: 'EntityContainer',
        ...entitySets
      },
      ...entityTypes
    };
  }

  // Helper methods
  private parseFilter(filter: string, params: any[]): string {
    const conditions = filter.split(' and ');
    const whereParts: string[] = [];
    
    for (const condition of conditions) {
      const match = condition.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(['"].*?['"]|\d+)/i);
      if (!match) continue;
      
      const [_, column, operator, value] = match;
      const sqlOperator = this.mapOperator(operator);
      const paramValue = value.replace(/^['"]|['"]$/g, '');
      
      whereParts.push(`"${column}" ${sqlOperator} $${params.length + 1}`);
      params.push(this.parseValue(paramValue));
    }
    
    return whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : '';
  }

  private parseOrderBy(orderBy: string): string {
    const parts = orderBy.split(',').map(part => {
      const [column, direction] = part.trim().split(/\s+/);
      const dir = direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      return `"${column}" ${dir}`;
    });
    
    return parts.length > 0 ? ` ORDER BY ${parts.join(', ')}` : '';
  }

  private mapOperator(odataOp: string): string {
    const map: Record<string, string> = {
      eq: '=',
      ne: '!=',
      gt: '>',
      ge: '>=',
      lt: '<',
      le: '<='
    };
    return map[odataOp.toLowerCase()] || '=';
  }

  private parseValue(value: string): any {
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  }

  private mapType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'integer': 'Edm.Int32',
      'bigint': 'Edm.Int64',
      'smallint': 'Edm.Int16',
      'character varying': 'Edm.String',
      'text': 'Edm.String',
      'boolean': 'Edm.Boolean',
      'numeric': 'Edm.Decimal',
      'real': 'Edm.Single',
      'double precision': 'Edm.Double',
      'timestamp without time zone': 'Edm.DateTimeOffset',
      'timestamp with time zone': 'Edm.DateTimeOffset',
      'date': 'Edm.Date',
      'time without time zone': 'Edm.TimeOfDay',
      'time with time zone': 'Edm.TimeOfDay',
      'uuid': 'Edm.Guid'
    };
    return typeMap[pgType] || 'Edm.String';
  }
}