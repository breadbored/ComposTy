import { expect, test } from '@jest/globals';
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { buildComplexSQL, SQLQuery, WithSubquerySQL } from '../src';

test('verify jest is working in async', async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            expect(true).toBe(true)
            resolve(true)
        }, 1000)
    })
})

test('verify sqlite is working', async () => {
    const db = await open({
        filename: 'tests/test.db',
        driver: sqlite3.Database
    })
    const res = await db.get('SELECT 1 + 1 as test_result')
    expect(res.test_result).toBe(2)
    await db.close()
})

test('insert data into table', async () => {
    const db = await open({
        filename: 'tests/test.db',
        driver: sqlite3.Database
    })

    // Set up the database schema
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            created_at TEXT
        )
    `)
    await db.exec(`
        DELETE FROM users
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            content TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `)
    await db.exec(`
        DELETE FROM posts
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY,
            post_id INTEGER,
            content TEXT,
            created_at TEXT,
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `)
    await db.exec(`
        DELETE FROM comments
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY,
            post_id INTEGER,
            created_at TEXT,
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `)
    await db.exec(`
        DELETE FROM likes
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY,
            name TEXT,
            created_at TEXT
        )
    `)
    await db.exec(`
        DELETE FROM tags
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS post_tags (
            post_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (post_id, tag_id),
            FOREIGN KEY (post_id) REFERENCES posts (id),
            FOREIGN KEY (tag_id) REFERENCES tags (id)
        )
    `)
    await db.exec(`
        DELETE FROM post_tags
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            created_at TEXT
        )
    `)
    await db.exec(`
        DELETE FROM users
    `)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INTEGER,
            role TEXT,
            PRIMARY KEY (user_id, role),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `)
    await db.exec(`
        DELETE FROM user_roles
    `)

    // Insert a ton of sample data
    await db.exec(`
        INSERT INTO users (name, created_at)
        VALUES
            ('Alice', '2023-01-01'),
            ('Bob', '2023-01-02'),
            ('Charlie', '2023-01-03')
    `)
    await db.exec(`
        INSERT INTO posts (user_id, content, created_at)
        VALUES
            (1, 'Hello world!', '2023-01-01'),
            (1, 'Another post', '2023-01-02'),
            (2, 'Bobs post', '2023-01-03'),
            (3, 'Charlies post', '2023-01-04'),
            (1, 'Yet another post', '2023-01-05'),
            (2, 'Bobs second post', '2023-01-06'),
            (3, 'Charlies second post', '2023-01-07'),
            (1, 'Alices third post', '2023-01-08'),
            (2, 'Bobs third post', '2023-01-09'),
            (3, 'Charlies third post', '2023-01-10')
    `)
    await db.exec(`
        INSERT INTO comments (post_id, content, created_at)
        VALUES
            (1, 'Nice post!', '2023-01-01'),
            (1, 'Thanks for sharing', '2023-01-02'),
            (2, 'Interesting thoughts', '2023-01-03'),
            (3, 'I agree with you', '2023-01-04'),
            (1, 'Great post!', '2023-01-05'),
            (2, 'Thanks for sharing', '2023-01-06'),
            (3, 'Interesting thoughts', '2023-01-07'),
            (1, 'I agree with you', '2023-01-08'),
            (2, 'Nice post!', '2023-01-09'),
            (3, 'Thanks for sharing', '2023-01-10'),
            (1, 'Interesting thoughts', '2023-01-11'),
            (2, 'I agree with you', '2023-01-12'),
            (3, 'Nice post!', '2023-01-13'),
            (1, 'Thanks for sharing', '2023-01-14'),
            (2, 'Interesting thoughts', '2023-01-15'),
            (3, 'I agree with you', '2023-01-16'),
            (1, 'Nice post!', '2023-01-17'),
            (2, 'Thanks for sharing', '2023-01-18'),
            (3, 'Interesting thoughts', '2023-01-19'),
            (1, 'I agree with you', '2023-01-20'),
            (2, 'Nice post!', '2023-01-21'),
            (3, 'Thanks for sharing', '2023-01-22'),
            (1, 'Interesting thoughts', '2023-01-23'),
            (2, 'I agree with you', '2023-01-24'),
            (3, 'Nice post!', '2023-01-25'),
            (1, 'Thanks for sharing', '2023-01-26'),
            (2, 'Interesting thoughts', '2023-01-27'),
            (3, 'I agree with you', '2023-01-28')
    `)
    await db.exec(`
        INSERT INTO likes (post_id, created_at)
        VALUES
            (1, '2023-01-01'),
            (1, '2023-01-02'),
            (2, '2023-01-03'),
            (3, '2023-01-04'),
            (1, '2023-01-05'),
            (2, '2023-01-06'),
            (3, '2023-01-07'),
            (1, '2023-01-08'),
            (2, '2023-01-09'),
            (3, '2023-01-10'),
            (1, '2023-01-11'),
            (2, '2023-01-12'),
            (3, '2023-01-13'),
            (1, '2023-01-14'),
            (2, '2023-01-15'),
            (3, '2023-01-16'),
            (1, '2023-01-17'),
            (2, '2023-01-18'),
            (3, '2023-01-19'),
            (1, '2023-01-20'),
            (2, '2023-01-21'),
            (3, '2023-01-22'),
            (1, '2023-01-23'),
            (2, '2023-01-24'),
            (3, '2023-01-25')
    `)
    await db.exec(`
        INSERT INTO tags (name, created_at)
        VALUES
            ('tag1', '2023-01-01'),
            ('tag2', '2023-01-02'),
            ('tag3', '2023-01-03')
    `)
    await db.exec(`
        INSERT INTO post_tags (post_id, tag_id)
        VALUES
            (1, 1),
            (1, 2),
            (1, 3),
            (2, 1),
            (2, 2),
            (2, 3),
            (3, 1)
    `)
    await db.exec(`
        INSERT INTO user_roles (user_id, role)
        VALUES
            (1, 'admin'),
            (1, 'user'),
            (2, 'user'),
            (3, 'user'),
            (3, 'guest')
    `)

    expect(true).toBe(true)
    await db.close()
})

test('raw query', async () => {
    const db = await open({
        filename: 'tests/test.db',
        driver: sqlite3.Database
    })
    const res = await db.all('SELECT * FROM users')
    expect(res.length).toBe(3)
    await db.close()
})

test('basic query', async () => {
    const db = await open({
        filename: 'tests/test.db',
        driver: sqlite3.Database
    })

    const baseQuery: SQLQuery = {
        sourceTable: 'users',
        alias: 'u',
        fields: {
            id: 'u.id',
            name: 'u.name',
        },
    }

    const { query, params } = buildComplexSQL(baseQuery, {
        where: "u.id = ?user_ud",
        params: {
            user_ud: 1,
        }
    })

    const res = await db.all(query, params)

    expect(res.length).toBe(1)

    await db.close()
})

test('complex query', async () => {
    const db = await open({
        filename: 'tests/test.db',
        driver: sqlite3.Database
    })

    const postTags: WithSubquerySQL = {
        name: 'user_tags',
        alias: 'ut',
        joinType: 'LEFT JOIN',
        joinOn: 'u.id = ut.user_id',
        query: `
            SELECT
                p.user_id as user_id,
                JSON_GROUP_ARRAY(t.name) as tag_names
            FROM
                tags t
            JOIN
                post_tags pt 
            ON
                pt.tag_id = t.id
            JOIN
                posts p 
            ON
                p.id = pt.post_id
            GROUP BY
                p.user_id
        `,
        fields: {
            tag_names: 'ut.tag_names',
        },
    }

    const baseQuery: SQLQuery = {
        sourceTable: 'users',
        alias: 'u',
        fields: {
            id: 'u.id',
            name: 'u.name'
        },
        withSubqueries: [postTags],
    }

    const { query, params } = buildComplexSQL(baseQuery, {
        where: "u.id = ?user_ud",
        params: {
            user_ud: 1,
        }
    })

    console.log(query, params)


    const res = await db.all(query, params)

    expect(res.length).toBe(1)

    await db.close()
})