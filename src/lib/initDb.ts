import { createUserIndexes } from './models/User';
import { createProfileIndexes } from './models/Profile';

export async function initializeDatabase() {
  try {
    await createUserIndexes();
    await createProfileIndexes();
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
}
