import { PackageRepository } from './interface.js';
import { SQLitePackageRepository } from './sqlite.js';

export * from './interface.js';

export function createPackageRepository(type: 'sqlite' | 'd1' = 'sqlite'): PackageRepository {
  // Use in-memory database for tests
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const dbPath = isTest 
    ? ':memory:' 
    : (process.env.DATABASE_PATH || './data/packages.db.sqlite');
  
  switch (type) {
    case 'sqlite':
      return new SQLitePackageRepository(dbPath);
    case 'd1':
      // Future D1 implementation
      throw new Error('D1 implementation not yet available');
    default:
      throw new Error(`Unknown repository type: ${type}`);
  }
}