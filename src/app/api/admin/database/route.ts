// ============ ADMIN DATABASE MANAGER - PostgreSQL Compatible ============
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/middleware/auth.middleware';
import { db } from '@/lib/db';

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function() { return this.toString(); };

// GET /api/admin/database?action=tables|select|count|stats
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'tables';

    if (action === 'tables') {
      // Get all table names from PostgreSQL
      const result = await db.$queryRaw`
        SELECT table_name as name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      const tables = (result as any[]).map((r: any) => r.name);
      return NextResponse.json({ tables });
    }

    if (action === 'select') {
      const table = searchParams.get('table');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      
      if (!table) {
        return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
      }

      // Validate table name (prevent SQL injection)
      const validTables = await db.$queryRaw`
        SELECT table_name as name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tableNames = (validTables as any[]).map((r: any) => r.name);
      if (!tableNames.includes(table)) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }

      // Get column info from PostgreSQL
      const columnInfo = await db.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      const columns = (columnInfo as any[]).map((c: any) => c.column_name);

      // Get total count
      const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      const total = Number((countResult as any[])[0]?.count || 0);

      // Get rows with pagination (PostgreSQL syntax)
      const offset = (page - 1) * limit;
      const rows = await db.$queryRawUnsafe(`SELECT * FROM "${table}" ORDER BY "createdAt" DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`);

      // Convert BigInt values to strings for serialization
      const serializedRows = (rows as any[]).map(row => {
        const serialized: any = {};
        for (const [key, value] of Object.entries(row)) {
          serialized[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return serialized;
      });

      return NextResponse.json({
        rows: serializedRows,
        columns,
        total,
        page,
        limit,
        columnInfo,
      });
    }

    if (action === 'count') {
      const table = searchParams.get('table');
      if (!table) {
        return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
      }
      const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      return NextResponse.json({ count: Number((result as any[])[0]?.count || 0) });
    }

    if (action === 'stats') {
      // Get database statistics
      const tableList = await db.$queryRaw`
        SELECT table_name as name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tables = (tableList as any[]).map((r: any) => r.name);
      
      const stats: any = {};
      for (const table of tables) {
        try {
          const count = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
          stats[table] = Number((count as any[])[0]?.count || 0);
        } catch {
          stats[table] = -1;
        }
      }
      
      return NextResponse.json({ stats, tables });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin database error:', error);
    return NextResponse.json({ error: error.message || 'Database operation failed' }, { status: 500 });
  }
}

// POST /api/admin/database - insert, update, delete, query
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const body = await request.json();
    const { action, table, id, values, sql } = body;

    // Validate table name
    const validTables = await db.$queryRaw`
      SELECT table_name as name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const tableNames = (validTables as any[]).map((r: any) => r.name);

    if (action === 'query') {
      // Execute raw SQL (DANGEROUS - admin only)
      if (!sql || typeof sql !== 'string') {
        return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
      }
      // Block destructive DDL on system tables
      const lowerSql = sql.toLowerCase().trim();
      if (lowerSql.includes('drop table') || lowerSql.includes('drop database')) {
        return NextResponse.json({ error: 'DROP operations are not allowed for safety' }, { status: 403 });
      }

      try {
        const result = await db.$queryRawUnsafe(sql);
        if (Array.isArray(result)) {
          // Serialize BigInt
          const serialized = result.map(row => {
            const s: any = {};
            for (const [key, value] of Object.entries(row)) {
              s[key] = typeof value === 'bigint' ? value.toString() : value;
            }
            return s;
          });
          return NextResponse.json({ rows: serialized, count: serialized.length });
        }
        return NextResponse.json({ message: 'Query executed successfully', result });
      } catch (sqlError: any) {
        return NextResponse.json({ error: sqlError.message }, { status: 400 });
      }
    }

    if (!table || !tableNames.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    if (action === 'insert') {
      if (!values || typeof values !== 'object') {
        return NextResponse.json({ error: 'Values object is required' }, { status: 400 });
      }
      const cols = Object.keys(values).filter(k => values[k] !== undefined && values[k] !== '');
      const colStr = cols.map(c => `"${c}"`).join(', ');
      const valPlaceholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const vals = cols.map(k => {
        const v = values[k];
        if (v === 'null' || v === null) return null;
        if (v === 'true') return true;
        if (v === 'false') return false;
        if (!isNaN(Number(v)) && v !== '') return Number(v);
        return v;
      });
      
      await db.$executeRawUnsafe(`INSERT INTO "${table}" (${colStr}) VALUES (${valPlaceholders})`, ...vals);
      return NextResponse.json({ message: 'Row inserted successfully' });
    }

    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'Row ID is required' }, { status: 400 });
      }
      if (!values || typeof values !== 'object') {
        return NextResponse.json({ error: 'Values object is required' }, { status: 400 });
      }
      const sets = Object.entries(values)
        .filter(([k]) => k !== 'id')
        .map(([k, v], i) => {
          if (v === 'null' || v === null) return `"${k}" = NULL`;
          if (typeof v === 'boolean') return `"${k}" = ${v ? 'true' : 'false'}`;
          if (typeof v === 'number') return `"${k}" = ${v}`;
          return `"${k}" = '${String(v).replace(/'/g, "''")}'`;
        })
        .join(', ');
      
      await db.$executeRawUnsafe(`UPDATE "${table}" SET ${sets} WHERE id = '${id.replace(/'/g, "''")}'`);
      return NextResponse.json({ message: 'Row updated successfully' });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Row ID is required' }, { status: 400 });
      }
      await db.$executeRawUnsafe(`DELETE FROM "${table}" WHERE id = '${id.replace(/'/g, "''")}'`);
      return NextResponse.json({ message: 'Row deleted successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin database POST error:', error);
    return NextResponse.json({ error: error.message || 'Database operation failed' }, { status: 500 });
  }
}
