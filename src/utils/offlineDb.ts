import { Customer } from '../types';

const DB_NAME = 'azad_master_offline_db';
const DB_VERSION = 1;
const STORE_CUSTOMERS = 'customers';
const STORE_SETTINGS = 'settings';
const STORE_MUTATIONS = 'offline_mutations';

let dbInstance: IDBDatabase | null = null;

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Customers store (measurements, slips, orders)
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: false });
        customerStore.createIndex('phone', 'phone', { unique: false });
        customerStore.createIndex('date', 'date', { unique: false });
        customerStore.createIndex('status', 'status', { unique: false });
      }

      // App settings store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }

      // Offline mutations queue (for syncing back when online)
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn('Failed to open IndexedDB:', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Bulk save all customers to IndexedDB (and LocalStorage as immediate fallback)
 */
export async function saveCustomersToOfflineDb(customers: Customer[], uid = 'guest'): Promise<void> {
  // Always update LocalStorage for synchronous instant boot
  try {
    localStorage.setItem(`azad_master_customers_${uid}`, JSON.stringify(customers));
  } catch (e) {
    console.warn('LocalStorage limit exceeded, falling back solely to IndexedDB:', e);
  }

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await initOfflineDb();
    const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOMERS);

    // Clear and put current set
    store.clear();
    for (const customer of customers) {
      store.put(customer);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error saving to IndexedDB:', err);
  }
}

/**
 * Load all customers from IndexedDB (or fallback to LocalStorage)
 */
export async function loadCustomersFromOfflineDb(uid = 'guest'): Promise<Customer[]> {
  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
      const db = await initOfflineDb();
      const tx = db.transaction(STORE_CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORE_CUSTOMERS);
      const request = store.getAll();

      const items: Customer[] = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (items && items.length > 0) {
        return items;
      }
    } catch (err) {
      console.warn('Error loading from IndexedDB:', err);
    }
  }

  // Fallback to LocalStorage
  try {
    const cached = localStorage.getItem(`azad_master_customers_${uid}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return [];
}

/**
 * Save or update single customer in IndexedDB
 */
export async function saveSingleCustomerOffline(customer: Customer, uid = 'guest'): Promise<void> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await initOfflineDb();
      const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
      tx.objectStore(STORE_CUSTOMERS).put(customer);
    } catch (err) {
      console.warn('Error saving single customer to IndexedDB:', err);
    }
  }

  // Also maintain localStorage mirror
  try {
    const key = `azad_master_customers_${uid}`;
    const raw = localStorage.getItem(key);
    let list: Customer[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

/**
 * Delete a customer offline
 */
export async function deleteCustomerFromOfflineDb(customerId: number, uid = 'guest'): Promise<void> {
  if (isIndexedDBAvailable()) {
    try {
      const db = await initOfflineDb();
      const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
      tx.objectStore(STORE_CUSTOMERS).delete(customerId);
    } catch (err) {
      console.warn('Error deleting customer from IndexedDB:', err);
    }
  }

  // Mirror in localStorage
  try {
    const key = `azad_master_customers_${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: Customer[] = JSON.parse(raw);
      const filtered = list.filter(c => c.id !== customerId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch {}
}

/**
 * Queue an offline mutation so when connection returns, it syncs
 */
export async function queueOfflineMutation(action: 'create' | 'update' | 'delete', data: any): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    const db = await initOfflineDb();
    const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
    tx.objectStore(STORE_MUTATIONS).add({
      action,
      data,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('Could not queue offline mutation:', err);
  }
}
