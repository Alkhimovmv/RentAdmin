import db from './database';

/**
 * Универсальная функция для создания записи с поддержкой SQLite и PostgreSQL
 */
export async function createRecord<T>(tableName: string, data: any): Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    // SQLite - получаем ID и затем делаем select
    const [id] = await db(tableName).insert(data);
    const record = await db(tableName).where('id', id).first();
    return record;
  } else {
    // PostgreSQL - используем returning
    const [record]: T[] = await db(tableName).insert(data).returning('*');
    return record;
  }
}

/**
 * Универсальная функция для обновления записи с поддержкой SQLite и PostgreSQL
 */
export async function updateRecord<T>(tableName: string, id: string | number, data: any): Promise<T | null> {
  if (process.env.NODE_ENV === 'development') {
    // SQLite - сначала update, потом select
    const updatedCount = await db(tableName).where('id', id).update(data);

    if (updatedCount === 0) {
      return null;
    }

    const record = await db(tableName).where('id', id).first();
    return record;
  } else {
    // PostgreSQL - используем returning
    const [record]: T[] = await db(tableName)
      .where('id', id)
      .update(data)
      .returning('*');

    return record || null;
  }
}