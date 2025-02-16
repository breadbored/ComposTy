# ComposTy

## Overview

Short for SQL Composable TypeScript, ComposTy is a type-safe SQL query builder designed for complex database operations, for people who love SQL and feel limited by ORMs. Composty focuses on aggregating and joining related data into a single query to reduce the number of DB calls, making it ideal for applications that require comprehensive result sets from multiple datasets.

ComposTy can reduce the connection time of multiple queries across multiple instances by aggregating related data into a single, fast query.

ComposTy is agnostic to the database engine. Though, to get the most power out of your experience, you should use a database that supports:

- Indexes
- JSON / array aggregation functions
- Common Table Expressions (CTEs; AKA `WITH` clauses)
  - See [Subquery Config](#subquery-config) if your database does not support CTEs (e.g., MySQL 5, SQLite2, etc.)
- Recursive CTEs (optional, but useful for hierarchical data)
- Window functions (optional)

### Recommended Databases

ComposTy loves:

- BigQuery
- PostgreSQL
- MySQL 8

## Key Features

- **Type-safe query building**: Fully typed TypeScript implementation ensures query correctness at compile time
- **Composable WITH clauses**: Support for complex subqueries using Common Table Expressions (CTEs)
- **JSON aggregation**: Built-in support for aggregating related data into JSON structures
- **Pagination and ordering**: Integrated support for pagination and custom ordering
- **Parameter handling**: Secure parameter substitution with named parameters
- **Dynamic WHERE clauses**: Flexible condition building

## Core Concepts

### Single-ID Aggregation Pattern

The project implements a specific pattern for handling aggregated data:

1. All subqueries are grouped by a single identifier (e.g., `user_id`, `post_id`)
2. Subqueries only include the grouping ID and aggregated fields
3. Results are combined using appropriate JOIN types

This pattern ensures:  
- One result per primary key in aggregated data
- No unexpected row multiplication
- Predictable and maintainable query results

### Query Structure

Queries are built using two main types:

1. `SQLQuery`: Defines the main query structure
```typescript
type SQLQuery = {
  sourceTable: string
  alias: string
  fields: { [key: string]: string }
  where?: string
  withSubqueries?: WithSubquerySQL[]
}
```

2. `WithSubquerySQL`: Defines subquery components
```typescript
type WithSubquerySQL = {
  name: string
  alias: string
  query: string
  joinType: "JOIN" | "LEFT JOIN"
  joinOn: string
  fields: { [key: string]: string }
  params?: SQParams
}
```

## Usage Example

Here's a basic example of how to use the query builder:

```typescript
const courseDetails: SQLQuery = {
  sourceTable: "post",
  alias: "p",
  fields: {
    id: `p.id`,
    title: `p.title`,
    // ... other fields
  },
  withSubqueries: [
    postComments,
    // ... other subqueries
  ],
  where: `p.published = 1`
}

const { query, params } = buildComplexSQL(courseDetails, {
  where: "p.id = ?post_id",
  params: {
    post_id: 123,
  },
  order_by: ["p.created DESC"],
  page_size: 10
})
```

## Best Practices

1. **Query Organization**:
   - Define reusable subqueries as separate constants
   - Use consistent and meaningful table aliases
   - Group related fields in field definitions

2. **JSON Aggregation**:
   - Use `JSON_ARRAYAGG` for nested data structures
   - Always provide `COALESCE` defaults for JSON fields
   - Include computed fields at the subquery level

3. **Performance**:
   - Pre-filter data in subqueries before aggregation
   - Use appropriate JOIN types
   - Include pagination for large result sets
   - Ensure proper indexing on JOIN and WHERE fields

4. **Maintainability**:
   - Document complex WHERE clauses and JOIN conditions
   - Keep field mappings explicit
   - Use consistent naming patterns
   - Group related queries in feature-specific files

## Error Handling

The project includes robust error handling through the `SQLBuildError` class, which provides detailed error messages for common issues such as:
- Missing required fields
- Invalid pagination parameters
- Incorrect subquery configurations
- Missing parameters
- General SQL building errors

## Configuration

### Subquery Config

```cpp
// TODO
```