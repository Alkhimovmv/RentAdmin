import knex from 'knex';
import config from '@/config/knex';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment as keyof typeof config];

export const db = knex(knexConfig);

export default db;