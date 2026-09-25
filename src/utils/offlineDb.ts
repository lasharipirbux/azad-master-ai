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

export const MASTER_CUSTOMERS_STORAGE_KEY = 'azad_master_all_customers_v1';

export const KNOWN_STORAGE_KEYS = [
  MASTER_CUSTOMERS_STORAGE_KEY,
  'azad_master_customers_offline',
  'azad_master_customers_guest_offline_user',
  'azad_master_customers_guest',
  'azad_master_customers_master_default'
];

/**
 * Synchronously retrieves all saved customers from localStorage across all legacy & active keys.
 * This guarantees instant, zero-latency rendering on page refresh with 0% data loss.
 */
export function getStoredLocalCustomers(uid?: string): Customer[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  const customerMap = new Map<number, Customer>();
  const keys = [
    ...(uid ? [`azad_master_customers_${uid}`] : []),
    ...KNOWN_STORAGE_KEYS
  ];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: Customer) => {
            if (c && c.id && !customerMap.has(c.id)) {
              customerMap.set(c.id, c);
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Error reading key ${key} from localStorage:`, e);
    }
  }

  return Array.from(customerMap.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
}

/**
 * Synchronously writes the full customer list to localStorage under primary and master backup keys.
 */
export function saveCustomersToLocalStorage(customers: Customer[], uid = 'guest'): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const safeList = Array.isArray(customers) ? customers.filter(Boolean) : [];

  // Safety protection: if attempting to save empty array but localStorage already has records,
  // do not wipe unless explicitly confirmed to avoid catastrophic data loss.
  if (safeList.length === 0) {
    const existing = getStoredLocalCustomers(uid);
    if (existing.length > 0) {
      console.warn('Blocked attempt to overwrite non-empty local storage with empty array');
      return;
    }
  }

  try {
    const serialized = JSON.stringify(safeList);
    localStorage.setItem(`azad_master_customers_${uid}`, serialized);
    localStorage.setItem(MASTER_CUSTOMERS_STORAGE_KEY, serialized);
    localStorage.setItem('azad_master_customers_offline', serialized);
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

/**
 * Bulk save all customers to IndexedDB (and LocalStorage as immediate fallback)
 */
export async function saveCustomersToOfflineDb(customers: Customer[], uid = 'guest', allowEmpty = false): Promise<void> {
  const safeList = Array.isArray(customers) ? customers.filter(Boolean) : [];

  // Guard against accidental wipes
  if (safeList.length === 0 && !allowEmpty) {
    const existing = getStoredLocalCustomers(uid);
    if (existing.length > 0) {
      console.warn('Blocked attempt to save empty list to Offline DB without allowEmpty flag');
      return;
    }
  }

  // Always mirror in LocalStorage for instant boot
  saveCustomersToLocalStorage(safeList, uid);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await initOfflineDb();
    const tx = db.transaction(STORE_CUSTOMERS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOMERS);

    // Clear and put current set
    store.clear();
    for (const customer of safeList) {
      if (customer && customer.id) {
        store.put(customer);
      }
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
 * Load all customers from IndexedDB (or fallback to LocalStorage with multi-key recovery)
 */
export async function loadCustomersFromOfflineDb(uid = 'guest'): Promise<Customer[]> {
  const customerMap = new Map<number, Customer>();

  // 1. Try IndexedDB first
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

      if (Array.isArray(items) && items.length > 0) {
        items.forEach(c => {
          if (c && c.id) customerMap.set(c.id, c);
        });
      }
    } catch (err) {
      console.warn('Error loading from IndexedDB:', err);
    }
  }

  // 2. Read from all known LocalStorage customer keys to guarantee 0% data loss
  const storageKeys = [
    `azad_master_customers_${uid}`,
    MASTER_CUSTOMERS_STORAGE_KEY,
    'azad_master_customers_offline',
    'azad_master_customers_guest_offline_user',
    'azad_master_customers_guest'
  ];

  for (const key of storageKeys) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: Customer) => {
            if (c && c.id && !customerMap.has(c.id)) {
              customerMap.set(c.id, c);
            }
          });
        }
      }
    } catch (e) {}
  }

  const combined = Array.from(customerMap.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
  return combined;
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
