import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/middleware/auth.middleware';
import { db } from '@/lib/db';

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function() { return this.toString(); };

// GET /api/admin/database?action=tables|select|count
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authenticated) return authErrorResponse(auth);

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'tables';

    if (action === 'tables') {
      // Get all table names from SQLite
      const result = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite%' ORDER BY name`;
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
      const validTables = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite%'`;
      const tableNames = (validTables as any[]).map((r: any) => r.name);
      if (!tableNames.includes(table)) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }

      // Get column info
      const columnInfo = await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
      const columns = (columnInfo as any[]).map((c: any) => c.name);

      // Get total count
      const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      const total = (countResult as any[])[0]?.count || 0;

      // Get rows with pagination
      const offset = (page - 1) * limit;
      const rows = await db.$queryRawUnsafe(`SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`);

      return NextResponse.json({
        rows,
        columns,
        total,
        page,
        limit,
      });
    }

    if (action === 'count') {
      const table = searchParams.get('table');
      if (!table) {
        return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
      }
      const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      return NextResponse.json({ count: (result as any[])[0]?.count || 0 });
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
    const validTables = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite%'`;
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
          return NextResponse.json({ rows: result, count: result.length });
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
      const vals = cols.map(k => {
        const v = values[k];
        if (v === 'null' || v === null) return null;
        if (v === 'true') return true;
        if (v === 'false') return false;
        if (!isNaN(Number(v)) && v !== '') return Number(v);
        return v;
      });
      const colStr = cols.map(c => `"${c}"`).join(', ');
      const valStr = vals.map(v => v === null ? 'NULL' : typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : `'${String(v).replace(/'/g, "''")}'`).join(', ');
      
      await db.$executeRawUnsafe(`INSERT INTO "${table}" (${colStr}) VALUES (${valStr})`);
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
        .map(([k, v]) => {
          if (v === null || v === 'null') return `"${k}" = NULL`;
          if (typeof v === 'boolean') return `"${k}" = ${v ? 1 : 0}`;
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
    console.error('Admin database write error:', error);
    return NextResponse.json({ error: error.message || 'Database operation failed' }, { status: 500 });
  }
}
