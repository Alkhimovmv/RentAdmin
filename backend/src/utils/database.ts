import knex from 'knex';

const environment = process.env.NODE_ENV || 'development';

const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: `${process.env.DB_NAME}_test` || 'rent_admin_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'  // Используем ту же БД что и в development
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
};

const knexConfig = config[environment as keyof typeof config];

export const db = knex(knexConfig);

export default db;