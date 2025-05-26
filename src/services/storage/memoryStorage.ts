// Simple in-memory storage (not using localStorage)
export class MemoryStorage {
  private storage: Map<string, any> = new Map();

  get(key: string): any {
    return this.storage.get(key);
  }

  set(key: string, value: any): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

export const memoryStorage = new MemoryStorage();