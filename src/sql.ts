// import sql, { empty, join, raw, string } from "sql-template-tag";

type Fields = {
  [key: string]: string
}

export type SQParams = {
  [key: string]: unknown
}

type JoinType = "JOIN" | "LEFT JOIN"

export type WithSubquerySQL = {
  /**
   * The name used in the WITH clause
   */
  name: string
  /**
   * The alias used to reference the subquery
   */
  alias: string
  /**
   * The SQL query to execute
   */
  query: string
  /**
   * The parameters to use in the subquery
   */
  params?: SQParams
  /**
   * The type of join to use
   */
  joinType: JoinType
  /**
   * The field used to join the subquery to the main query
   */
  joinOn: string
  /**
   * The fields to select from the subquery
   */
  fields: Fields
}

type UsingSourceTable = {
  /**
   * The main SQL query to execute
   */
  sourceTable: string
  /**
   * The query to be used as the sourceTable
   */
  sourceQuery?: never
}

type UsingSourceQuery = {
  /**
   * The main SQL query to execute
   */
  sourceTable?: never
  /**
   * The query to be used as the sourceTable
   */
  sourceQuery: string
}

type UsingSource = UsingSourceTable | UsingSourceQuery

export type SQLQueryBase = {
  /**
   * The alias used to reference the main query
   */
  alias: string
  /**
   * The fields to select from the main query
   */
  fields: Fields
  /**
   * The filters to apply to the main query
   */
  where?: string
  /**
   * The subqueries to include in the WITH clause
   */
  withSubqueries?: WithSubquerySQL[]
}

export type SQLQuery = SQLQueryBase & UsingSource

export type BuildComplexSQLParams = {
  where?: string
  params?: SQParams
  page?: number
  page_size?: number
  order_by?: string[]
}

class SQLBuildError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SQLBuildError"
  }
}

function validateInputs(
  query: SQLQuery,
  options?: BuildComplexSQLParams
): void {
  if (
    (!query.sourceQuery || typeof query.sourceQuery !== "string")
    &&
    (!query.sourceTable || typeof query.sourceTable !== "string")
  ) {
    if (!query.sourceTable) {
      throw new SQLBuildError("sourceQuery is required and must be a string")
    } else {
      throw new SQLBuildError("sourceTable is required and must be a string")
    }
  }
  if (!query.alias || typeof query.alias !== "string") {
    throw new SQLBuildError("alias is required and must be a string")
  }
  if (!query.fields || Object.keys(query.fields).length === 0) {
    throw new SQLBuildError("fields must contain at least one field definition")
  }

  if (
    typeof options?.page !== "undefined" &&
    (typeof options.page !== "number" || options.page < 0)
  ) {
    throw new SQLBuildError("page must be a positive number")
  }
  if (
    typeof options?.page_size !== "undefined" &&
    (typeof options.page_size !== "number" || options.page_size <= 0)
  ) {
    throw new SQLBuildError("page_size must be a positive number")
  }

  if (query.withSubqueries) {
    for (const subquery of query.withSubqueries) {
      if (
        !subquery.name ||
        !subquery.alias ||
        !subquery.query ||
        !subquery.joinType ||
        !subquery.joinOn
      ) {
        throw new SQLBuildError(
          "Invalid subquery configuration: missing required fields"
        )
      }
      if (!["JOIN", "LEFT JOIN"].includes(subquery.joinType)) {
        throw new SQLBuildError(`Invalid join type: ${subquery.joinType}`)
      }
    }
  }
}

function sanitizeIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, "")
}

function buildWithClause(subqueries: WithSubquerySQL[]): string {
  if (!subqueries || subqueries.length === 0) return ""

  const withClauses = subqueries.map((subquery) => {
    const name = sanitizeIdentifier(subquery.name)
    return `${name} AS (${subquery.query.trim()})`
  })

  return `WITH ${withClauses.join(", ")}`
}

function buildSelectClause(query: SQLQuery): string {
  const mainFields = Object.entries(query.fields as Fields).map(
    ([field, expr]) => `${expr.trim()} AS ${sanitizeIdentifier(field)}`
  )

  const subqueryFields = (query.withSubqueries || []).flatMap((subquery) =>
    Object.entries(subquery.fields).map(
      ([field, expr]) => `${expr.trim()} AS ${sanitizeIdentifier(field)}`
    )
  )

  const allFields = [...mainFields, ...subqueryFields]
  return `SELECT ${allFields.join(", ")}`
}

function buildJoinClauses(subqueries: WithSubquerySQL[]): string {
  if (!subqueries || subqueries.length === 0) return ""

  return subqueries
    .map((subquery) => {
      const name = sanitizeIdentifier(subquery.name)
      const alias = sanitizeIdentifier(subquery.alias)
      return `${subquery.joinType} ${name} AS ${alias} ON ${subquery.joinOn}`
    })
    .join("\n")
}

export function buildComplexSQL(
  query: SQLQuery,
  options?: BuildComplexSQLParams
): { query: string; params: unknown[] } {
  try {
    validateInputs(query, options)

    const paramsOut: unknown[] = []

    const withClause = query.withSubqueries
      ? buildWithClause(query.withSubqueries)
      : ""
    const selectClause = buildSelectClause(query)
    let fromClause = ""
    if (query.sourceTable) {
      fromClause = `FROM ${sanitizeIdentifier(query.sourceTable)} AS ${sanitizeIdentifier(query.alias)}`
    } else if (query.sourceQuery) {
      fromClause = `FROM (${query.sourceQuery}) AS ${sanitizeIdentifier(
        query.alias
      )}`
    } else {
      throw new SQLBuildError(
        "Either sourceTable or sourceQuery must be provided"
      )
    }
    const joinClauses = query.withSubqueries
      ? buildJoinClauses(query.withSubqueries)
      : ""

    // Build WHERE clause
    let whereClause = ""
    if (query.where || options?.where) {
      const conditions: string[] = []
      if (query.where) conditions.push(`(${query.where})`)
      if (options?.where && options.where.trim())
        conditions.push(`(${options.where})`)
      whereClause = `WHERE ${conditions.join(" AND ")}`
    }

    // Build ORDER BY, LIMIT, and OFFSET clauses
    const orderByClause = options?.order_by?.length
      ? `ORDER BY ${options.order_by.join(", ")}`
      : ""

    const limitClause = options?.page_size ? `LIMIT ${options.page_size}` : ""

    const offsetClause =
      typeof options?.page === "number" &&
        typeof options?.page_size === "number"
        ? `OFFSET ${options.page * options.page_size}`
        : ""

    // Combine all clauses
    let finalQuery = [
      withClause,
      selectClause,
      fromClause,
      joinClauses,
      whereClause,
      orderByClause,
      limitClause,
      offsetClause,
    ]
      .filter(Boolean)
      .join(" ")

    // Handle parameter substitution
    if (options?.params) {
      const seenParams = new Set<string>()
      finalQuery = finalQuery.replace(
        /\?([a-zA-Z_][a-zA-Z0-9_]*)/g,
        (match, paramName) => {
          if (!(paramName in options.params!)) {
            throw new SQLBuildError(`Missing parameter: ${paramName}`)
          }

          // Handle duplicate parameters
          if (seenParams.has(paramName)) {
            paramsOut.push(options.params![paramName])
            return "?"
          }

          seenParams.add(paramName)
          paramsOut.push(options.params![paramName])
          return "?"
        }
      )
    }

    return {
      query: finalQuery,
      params: paramsOut,
    }
  } catch (error) {
    if (error instanceof SQLBuildError) {
      throw error
    }
    throw new SQLBuildError(
      `Failed to build SQL query: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
