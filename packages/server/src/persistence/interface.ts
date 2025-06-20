export interface Package {
    id: string;
    uniqueName: string;
    command: string;
    args: string[];
    env: Record<string, string>;
    installedAt: string;
  }
  
  export interface PackageRepository {
    create(pkg: Omit<Package, 'id' | 'installedAt'>): Promise<Package>;
    findByUniqueName(uniqueName: string): Promise<Package | null>;
    findAll(): Promise<Package[]>;
    deleteByUniqueName(uniqueName: string): Promise<boolean>;
    count(): Promise<number>;
  }