require('dotenv').config();

interface DatabaseConfig {
  client: string;
  connection: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    filename?: string;
  };
  useNullAsDefault?: boolean;
  migrations: {
    directory: string;
  };
  seeds?: {
    directory: string;
  };
  pool?: {
    min: number;
    max: number;
  };
}

interface Config {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const config: Config = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'rent_admin',
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
      filename: process.env.DB_PATH || './database.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations',
    },
  } as any,
};

export default config;