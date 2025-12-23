import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Pool, PoolClient } from 'pg'

let supabase: SupabaseClient | null = null
let pool: Pool | null = null

// Flag to switch between PostgreSQL and Supabase client
const USE_POSTGRES = false // Set to false to use Supabase REST API

export const getDb = (): SupabaseClient => {
  if (USE_POSTGRES) {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    }
    return pool as any
  } else {
    if (!supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }

      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return supabase
  }
}

// Get Supabase client (for direct use in API routes)
export const getSupabase = (): SupabaseClient => {
  return getDb() as SupabaseClient
}

// Execute raw SQL query (Legacy helper - partially supported via Supabase .rpc or .from)
// NOTE: For Supabase REST, this is limited. Better to use getDb().from() directly.
export const runQuery = async <T>(sql: string, params: any[] = [], client?: PoolClient): Promise<T[]> => {
  if (USE_POSTGRES) {
    const db = client || (getDb() as any as Pool)
    let paramIndex = 1
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`)
    const result = await db.query(pgSql, params)
    return result.rows
  } else {
    // Attempt to map simple SELECT queries to Supabase for compatibility during migration
    const selectMatch = sql.match(/SELECT \* FROM (\w+)/i)
    if (selectMatch) {
      const table = selectMatch[1]
      let query = (getDb() as SupabaseClient).from(table).select('*')

      // Simple WHERE clause mapping for 'WHERE key = ?'
      const whereMatch = sql.match(/WHERE (\w+) = \?/i)
      if (whereMatch && params.length > 0) {
        query = query.eq(whereMatch[1], params[0])
      }

      const { data, error } = await query
      if (error) throw error
      return data as T[]
    }

    throw new Error(`Raw SQL query not supported with Supabase REST: ${sql}. Use Supabase query builder instead.`)
  }
}

export const runGet = async <T>(sql: string, params: any[] = [], client?: PoolClient): Promise<T | undefined> => {
  const rows = await runQuery<T>(sql, params, client)
  return rows[0]
}

export const runInsert = async (sql: string, params: any[] = [], client?: PoolClient): Promise<number> => {
  if (USE_POSTGRES) {
    let finalSql = sql
    if (!finalSql.toLowerCase().includes('returning')) {
      finalSql += ' RETURNING id'
    }
    const rows = await runQuery<{ id: number }>(finalSql, params, client)
    return rows[0]?.id || 0
  } else {
    // Mapping simple INSERT INTO table (...) VALUES (?, ...)
    const insertMatch = sql.match(/INSERT INTO (\w+)\s*\((.*?)\)/i)
    if (insertMatch) {
      const table = insertMatch[1]
      const columns = insertMatch[2].split(',').map(c => c.trim())
      const data: any = {}
      columns.forEach((col, i) => {
        data[col] = params[i]
      })

      const { data: inserted, error } = await (getDb() as SupabaseClient)
        .from(table)
        .insert(data)
        .select('id')
        .single()

      if (error) throw error
      return (inserted as any)?.id || 0
    }
    throw new Error('Raw SQL INSERT not supported with Supabase REST. Use Supabase query builder instead.')
  }
}

export const runUpdate = async (sql: string, params: any[] = [], client?: PoolClient): Promise<number> => {
  if (USE_POSTGRES) {
    const db = client || (getDb() as any as Pool)
    let paramIndex = 1
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`)
    const result = await db.query(pgSql, params)
    return result.rowCount || 0
  } else {
    // Simple UPDATE mapping: UPDATE table SET col = ? WHERE key = ?
    const updateMatch = sql.match(/UPDATE (\w+) SET (.*?) WHERE (.*?) = \?/i)
    if (updateMatch) {
      const table = updateMatch[1]
      const setClause = updateMatch[2]
      const whereKey = updateMatch[3]

      const setCols = setClause.split(',').map(s => s.split('=')[0].trim())
      const data: any = {}
      setCols.forEach((col, i) => {
        data[col] = params[i]
      })

      const whereVal = params[params.length - 1]

      const { error, count } = await (getDb() as SupabaseClient)
        .from(table)
        .update(data)
        .eq(whereKey, whereVal)

      if (error) throw error
      return count || 1 // count might be null depending on config
    }
    throw new Error('Raw SQL UPDATE not supported with Supabase REST. Use Supabase query builder instead.')
  }
}

export const runDelete = runUpdate

export const runTransaction = async <T>(fn: (client: PoolClient | SupabaseClient) => Promise<T>): Promise<T> => {
  if (USE_POSTGRES) {
    const db = getDb() as any as Pool
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (e) {
      await client.query('ROLLBACK')
      console.error('Transaction Failed:', e)
      throw e
    } finally {
      client.release()
    }
  } else {
    // Supabase doesn't support traditional transactions via REST API
    const db = getDb() as SupabaseClient
    return await fn(db)
  }
}

export const closeDb = async () => {
  if (USE_POSTGRES && pool) {
    await pool.end()
    pool = null
  } else {
    supabase = null
  }
  console.log('Database connection closed')
}
