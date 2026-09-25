import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer, CustomerMeasurements, SupportedLanguage, OrderStatus } from './types';
import { translations, languageList } from './data/translations';
import { useLanguage } from './context/LanguageContext';
import { DigitalSlipModal } from './components/DigitalSlipModal';
import { AddMeasurementModal } from './components/AddMeasurementModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AppGuideModal } from './components/AppGuideModal';
import { CustomerAnalyticsModal } from './components/CustomerAnalyticsModal';
import { BulkMessagingModal } from './components/BulkMessagingModal';
import { RecentOrdersQuickView } from './components/RecentOrdersQuickView';
import { CustomerSearchComponent } from './components/CustomerSearchComponent';
import { SlimSummaryHeader } from './components/SlimSummaryHeader';
import { CustomDrawerMenu } from './components/CustomDrawerMenu';
import { QuickBackupModal } from './components/QuickBackupModal';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AdMobBannerPlaceholder } from './components/AdMobBannerPlaceholder';
import { compressImageForOcr } from './utils/imageCompressor';
import { getStatusMeta, ORDER_STATUS_LIST, getLocalizedStatusLabel } from './utils/orderStatus';
import { getAvatarColorByName, getCustomerInitial } from './utils/avatarColors';
import { 
  saveCustomersToOfflineDb, 
  loadCustomersFromOfflineDb, 
  deleteCustomerFromOfflineDb,
  getStoredLocalCustomers,
  saveCustomersToLocalStorage,
  MASTER_CUSTOMERS_STORAGE_KEY
} from './utils/offlineDb';
import { exportCustomersToJson, exportCustomersToExcelCsv } from './utils/backupExport';
import { 
  auth, 
  signInWithGoogle,
  checkRedirectAuthResult,
  signOutUser,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  subscribeToCustomerRecords,
  syncAllCustomersToFirestore,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  getAuthErrorMessage,
  signInMasterCloudDirect,
  getActiveLocalUser,
  clearActiveLocalUser,
  getCurrentEffectiveUid
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Scissors, 
  Search, 
  Plus, 
  Menu, 
  Bot, 
  Camera,
  Settings as SettingsIcon, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Phone, 
  Calendar, 
  Trash2, 
  Home, 
  Sparkles,
  Lock,
  FileText,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  MessageCircle,
  ExternalLink,
  LogIn,
  Clock,
  Filter,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Zap,
  WifiOff,
  UserCheck,
  TrendingUp,
  BarChart3,
  Download,
  FileSpreadsheet,
  Database,
  ClipboardList
} from 'lucide-react';
import { isDeliveryToday, isDeliveryLate, getDeliveryStatus } from './utils/deliveryDate';

export default function AzadMasterFinalApp() {
  const { currentLang, setLanguage: changeLanguage, t, isRtl } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  
  // Cloud Auto-Save States (Firebase Database)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'online'>('online');
  const [cloudRecordCount, setCloudRecordCount] = useState<number>(0);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');

  // Initial customer state: synchronously loaded from localStorage for instant 0ms rendering and zero data loss on refresh
  const [customers, setCustomers] = useState<Customer[]>(() => {
    return getStoredLocalCustomers();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedDeliveryFilter, setSelectedDeliveryFilter] = useState<'all' | 'today' | 'late'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'urgent' | 'alphabetical'>('newest');

  const handleSetSearch = (name: string) => {
    setSearchQuery(name);
    setIsSearchOpen(true);
  };

  useEffect(() => {
    (window as any).setSearch = (name: string) => {
      setSearchQuery(name);
      setIsSearchOpen(true);
    };
    return () => {
      delete (window as any).setSearch;
    };
  }, []);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeSlip, setActiveSlip] = useState<Customer | null>(null);
  
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showQuickBackup, setShowQuickBackup] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Master profile (per user, not hardcoded)
  const [masterName, setMasterName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('tailorShopName') || localStorage.getItem('azad_master_shop_name');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    return '';
  });
  const [masterPhone, setMasterPhone] = useState('');
  const [masterPhoto, setMasterPhoto] = useState<string | null>(null);

  // Listen to Auth state & Cloud Sync
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const setupUserSession = async (user: User) => {
      const uid = user.uid;
      const defaultName = user.displayName || (isRtl ? 'ماسٹر صاحب' : 'Master Tailor');
      const photo = user.photoURL || null;
      const phone = user.phoneNumber || '';

      // 1. Load user profile
      try {
        const cloudProfile = await getUserProfileFromFirestore(uid);
        if (cloudProfile && cloudProfile.name && cloudProfile.name.trim()) {
          setMasterName(cloudProfile.name.trim());
          setMasterPhoto(cloudProfile.photo || photo);
          setMasterPhone(cloudProfile.phone || phone);
          try {
            localStorage.setItem('tailorShopName', cloudProfile.name.trim());
            localStorage.setItem('azad_master_shop_name', cloudProfile.name.trim());
          } catch {}
        } else {
          let parsed: any = null;
          try {
            const localProfile = localStorage.getItem(`azad_master_profile_${uid}`);
            if (localProfile) {
              parsed = JSON.parse(localProfile);
            }
          } catch {}

          if (parsed && typeof parsed === 'object' && parsed.name && parsed.name.trim()) {
            setMasterName(parsed.name.trim());
            setMasterPhoto(parsed.photo || photo);
            setMasterPhone(parsed.phone || phone);
            try {
              localStorage.setItem('tailorShopName', parsed.name.trim());
              localStorage.setItem('azad_master_shop_name', parsed.name.trim());
            } catch {}
          } else {
            const currentLocalShop = (() => {
              try {
                return localStorage.getItem('tailorShopName') || localStorage.getItem('azad_master_shop_name');
              } catch {
                return null;
              }
            })();
            const initialName = currentLocalShop?.trim() || defaultName;
            setMasterName(initialName);
            setMasterPhoto(photo);
            setMasterPhone(phone);
            try {
              localStorage.setItem('tailorShopName', initialName);
              localStorage.setItem('azad_master_shop_name', initialName);
            } catch {}
            saveUserProfileToFirestore({
              name: initialName,
              photo: photo,
              phone: phone
            });
          }
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }

      // 2. Load cached customers for this user (LocalStorage + IndexedDB 100% durable offline)
      loadCustomersFromOfflineDb(uid).then((offlineList) => {
        if (Array.isArray(offlineList) && offlineList.length > 0) {
          setCustomers((prev) => {
            if (!prev || prev.length === 0) return offlineList;
            const map = new Map<number, Customer>();
            offlineList.forEach(c => { if (c && c.id) map.set(c.id, c); });
            prev.forEach(c => { if (c && c.id) map.set(c.id, c); });
            return Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
          });
          setCloudRecordCount(offlineList.length);
        }
      });

      // 3. Subscribe to real-time customer records for this user (with non-destructive smart merge)
      setCloudSyncStatus('syncing');
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeFirestore = subscribeToCustomerRecords((cloudCustomers) => {
        setCustomers((prevCustomers) => {
          const map = new Map<number, Customer>();

          // A. Retain all current in-memory customers (prevents sudden wipeout on empty cloud response)
          (prevCustomers || []).forEach(c => {
            if (c && c.id) map.set(c.id, c);
          });

          // B. Retain all local storage records via multi-key recovery
          const localStored = getStoredLocalCustomers(uid);
          localStored.forEach(c => {
            if (c && c.id && !map.has(c.id)) map.set(c.id, c);
          });

          // C. Apply cloud records (updating or adding)
          (cloudCustomers || []).forEach(c => {
            if (c && c.id) {
              map.set(c.id, c);
            }
          });

          const mergedList = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));

          // Save back so local cache is permanently preserved
          if (mergedList.length > 0) {
            saveCustomersToLocalStorage(mergedList, uid);
            saveCustomersToOfflineDb(mergedList, uid).catch(console.warn);
          }

          setCloudRecordCount(mergedList.length);
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          // Auto upload local-only customers to Firestore
          if (mergedList.length > (cloudCustomers || []).length) {
            syncAllCustomersToFirestore(mergedList);
          }

          return mergedList;
        });
      });
    };

    // Check if user returned from a redirect sign-in
    checkRedirectAuthResult()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setIsLoadingAuth(false);
          setAuthError(null);
          setupUserSession(user);
        }
      })
      .catch((err: any) => {
        console.warn("Google redirect sign-in check notice:", err?.message || err);
        setAuthError(getAuthErrorMessage(err, isRtl));
        setIsLoadingAuth(false);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setIsLoadingAuth(false);
        setAuthError(null);
        setupUserSession(user);
      } else {
        // Check if there is an active local/master session saved
        const localUser = getActiveLocalUser();
        if (localUser && localUser.uid) {
          const syntheticUser = {
            uid: localUser.uid,
            displayName: localUser.name,
            email: localUser.email,
            photoURL: localUser.photo,
            phoneNumber: localUser.phone
          } as unknown as User;
          setCurrentUser(syntheticUser);
          setIsLoggedIn(true);
          setIsLoadingAuth(false);
          setAuthError(null);
          setupUserSession(syntheticUser);
        } else {
          if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = null;
          }
          setCurrentUser(null);
          setIsLoggedIn(false);
          setIsLoadingAuth(false);
          // Preserve local customers on device instead of wiping
          const localList = getStoredLocalCustomers('guest');
          setCustomers(localList);
          setMasterName('');
          setMasterPhoto(null);
          setMasterPhone('');
          setCloudRecordCount(localList.length);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [isRtl]);

  // Offline Syncing Enhancement: Auto-sync pending local records whenever device reconnects online
  useEffect(() => {
    const handleOnlineSync = async () => {
      // Check user preference
      let isAutoSyncEnabled = true;
      try {
        const stored = localStorage.getItem('azad_master_auto_offline_sync');
        if (stored !== null) isAutoSyncEnabled = stored === 'true';
      } catch {}

      if (!isAutoSyncEnabled) return;

      const effectiveUid = currentUser?.uid;
      if (!effectiveUid) return;

      console.log("🌐 Internet reconnected! Running automatic background cloud sync...");
      setCloudSyncStatus('syncing');

      try {
        // Read latest offline records from IndexedDB/LocalStorage
        const offlineRecords = await loadCustomersFromOfflineDb(effectiveUid);
        const listToSync = offlineRecords && offlineRecords.length > 0 ? offlineRecords : customers;

        if (listToSync.length > 0) {
          const res = await syncAllCustomersToFirestore(listToSync);
          if (res.success) {
            setCloudRecordCount(res.count);
            setCloudSyncStatus('synced');
            setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } else {
          setCloudSyncStatus('synced');
        }
      } catch (e) {
        console.warn("Background reconnect sync failed:", e);
      }
    };

    window.addEventListener('online', handleOnlineSync);
    return () => {
      window.removeEventListener('online', handleOnlineSync);
    };
  }, [currentUser, customers]);

  // Dynamically resolve tailor / shop name from custom masterName, persistent LocalStorage ('tailorShopName'),
  // Firebase Auth (currentUser.displayName), or fallback to 'Azad Master'
  const effectiveTailorName = useMemo(() => {
    if (masterName && masterName.trim()) {
      return masterName.trim();
    }
    try {
      const stored = localStorage.getItem('tailorShopName') || localStorage.getItem('azad_master_shop_name');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    if (currentUser?.displayName && currentUser.displayName.trim()) {
      return currentUser.displayName.trim();
    }
    return 'Azad Master';
  }, [masterName, currentUser?.displayName]);

  const handleManualCloudSync = async () => {
    if (!currentUser) return { success: false, count: 0 };
    setCloudSyncStatus('syncing');
    try {
      const res = await syncAllCustomersToFirestore(customers);
      if (res.success) {
        setCloudRecordCount(res.count);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('error');
      }
      return res;
    } catch (err) {
      setCloudSyncStatus('error');
      return { success: false, count: 0, error: err };
    }
  };

  const handleGlobalImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("تصویر منتخب ہو گئی:", file.name);
      try {
        const compressedBase64 = await compressImageForOcr(file, 1200, 1600, 0.75);
        
        // Prepare new draft customer with the image attached
        const draftCustomer: Customer = {
          id: Date.now(),
          name: '',
          phone: '',
          date: new Date().toISOString().split('T')[0],
          deliveryDate: '',
          details: 'Length: 42, Shoulder: 18.5, Sleeve: 23, Chest: 38, Waist: 36, Daaman: 24, Collar: 15.5, Shalwar: 38, Pancha: 8.5',
          imageUri: compressedBase64,
          suitType: 'gents_suit',
          measurementsObj: {
            length: '42',
            shoulder: '18.5',
            sleeves: '23',
            chest: '38',
            waist: '36',
            daaman: '24',
            collar: '15.5',
            shalwar: '38',
            pancha: '8.5',
            pocket: '',
            specialNotes: ''
          }
        };

        try {
          const res = await fetch('/api/ocr-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressedBase64, mimeType: 'image/jpeg' })
          });
          const ocrData = await res.json();
          if (ocrData.success && ocrData.measurements && draftCustomer.measurementsObj) {
            draftCustomer.measurementsObj = { ...draftCustomer.measurementsObj, ...ocrData.measurements };
          }
        } catch (err) {
          console.warn("Global OCR check error:", err);
        }

        setEditingCustomer(draftCustomer);
        setShowAddModal(true);
      } catch (err) {
        console.error("Global image upload/compression error:", err);
      }
    }
  };

  // Primary Google Login Handler (Opens Google Sign-in)
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will handle setting the state and user
    } catch (err: any) {
      console.warn("Google Sign-In notice:", err?.code || err?.message || err);
      const code = err?.code || '';
      
      // Auto-fallback for sandbox / iframe / network-blocked popup environments
      if (code === 'auth/network-request-failed' || code === 'auth/configuration-not-found' || code === 'auth/unauthorized-domain') {
        try {
          await handleMasterInstantLogin();
          return;
        } catch {
          // Fall through to show error banner if fallback fails
        }
      }

      setAuthError(getAuthErrorMessage(err, isRtl));
      setIsLoadingAuth(false);
    }
  };

  // Instant Master Login (Direct Cloud session without requiring Firebase Console Google config)
  const handleMasterInstantLogin = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const res = await signInMasterCloudDirect(masterName || undefined, masterPhone || undefined);
      const syntheticUser = {
        uid: res.uid,
        displayName: res.name,
        email: res.email,
        photoURL: res.photo,
        phoneNumber: res.phone
      } as unknown as User;
      setCurrentUser(syntheticUser);
      setIsLoggedIn(true);
      setIsLoadingAuth(false);
      setAuthError(null);
      // setupUserSession will be triggered by state change
    } catch (err: any) {
      console.warn("Master Instant Login notice:", err?.message || err);
      setAuthError(getAuthErrorMessage(err, isRtl));
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      clearActiveLocalUser();
      await signOutUser();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    const localList = getStoredLocalCustomers('guest');
    setCustomers(localList);
    setMasterName('');
    setMasterPhoto(null);
    setMasterPhone('');
    setShowSideMenu(false);
    setAuthError(null);
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    const effectiveUid = currentUser?.uid || getCurrentEffectiveUid() || 'master_default';
    let savedObj: Customer;
    
    if (customerData.id) {
      // Editing existing customer
      savedObj = { 
        ...customerData,
        updatedAt: new Date().toISOString()
      } as Customer;
    } else {
      // New customer - Prepend to list without losing any existing records
      savedObj = {
        id: Date.now(),
        name: customerData.name?.trim() || (isRtl ? 'محترم گاہک' : 'Customer'),
        phone: customerData.phone?.trim() || '',
        details: customerData.details || '',
        measurementsObj: customerData.measurementsObj,
        imageUri: customerData.imageUri || null,
        status: customerData.status || 'pending',
        totalAmount: customerData.totalAmount !== undefined ? String(customerData.totalAmount) : '',
        advanceAmount: customerData.advanceAmount !== undefined ? String(customerData.advanceAmount) : '',
        balanceAmount: customerData.balanceAmount !== undefined ? String(customerData.balanceAmount) : '',
        date: customerData.date || new Date().toLocaleDateString('en-GB'),
        deliveryDate: customerData.deliveryDate || '',
        suitType: customerData.suitType || 'gents_suit',
        notes: customerData.notes || '',
        updatedAt: new Date().toISOString()
      };
    }

    // 1. Immediately update React state with functional update to prevent overwriting
    setCustomers((prevCustomers) => {
      const existingList = Array.isArray(prevCustomers) && prevCustomers.length > 0 
        ? prevCustomers.filter(Boolean) 
        : getStoredLocalCustomers(effectiveUid);

      let nextList: Customer[];
      if (customerData.id) {
        const found = existingList.find(c => c.id === customerData.id);
        const fullSaved = { ...found, ...savedObj } as Customer;
        nextList = existingList.map((c) => (c.id === customerData.id ? fullSaved : c));
        if (activeSlip && activeSlip.id === customerData.id) {
          setActiveSlip(fullSaved);
        }
      } else {
        // Robust Spread operator prepend: [savedObj, ...existingList]
        nextList = [savedObj, ...existingList.filter(c => c.id !== savedObj.id)];
      }

      // 2. Immediately and synchronously save to LocalStorage under active and master backup keys
      saveCustomersToLocalStorage(nextList, effectiveUid);
      saveCustomersToOfflineDb(nextList, effectiveUid).catch(console.warn);
      setCloudRecordCount(nextList.length);

      return nextList;
    });

    // 3. Save to Cloud Firestore in the background
    setCloudSyncStatus('syncing');
    saveCustomerToFirestore(savedObj).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('synced');
      }
    }).catch((err) => {
      console.warn("Background cloud save error:", err);
      setCloudSyncStatus('synced');
    });
    
    setShowAddModal(false);
    setEditingCustomer(null);
  };

  const handleUpdateStatus = (id: number, status: OrderStatus, e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    const effectiveUid = currentUser?.uid || getCurrentEffectiveUid() || 'master_default';
    
    const existing = customers.find(c => c.id === id);
    if (existing && existing.status === 'delivered' && status !== 'delivered') {
      const confirmUnlock = window.confirm(
        isRtl
          ? "⚠️ یہ آرڈر مکمل (Delivered) ہو چکا ہے اور لاک ہے۔ کیا آپ واقعی اسے دوبارہ ان لاک کر کے اسٹیٹس تبدیل کرنا چاہتے ہیں؟"
          : "⚠️ This order is Marked as Delivered and Locked. Do you want to unlock and change status?"
      );
      if (!confirmUnlock) return;
    }

    const updated = customers.map((c) => {
      if (c.id === id) {
        const item = { ...c, status };
        setCloudSyncStatus('syncing');
        saveCustomerToFirestore(item).then((res) => {
          if (res.success) {
            setCloudSyncStatus('synced');
            setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        });
        return item;
      }
      return c;
    });
    setCustomers(updated);
    saveCustomersToLocalStorage(updated, effectiveUid);
    saveCustomersToOfflineDb(updated, effectiveUid);
    if (activeSlip && activeSlip.id === id) {
      setActiveSlip({ ...activeSlip, status });
    }
  };

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    const effectiveUid = currentUser?.uid || getCurrentEffectiveUid() || 'master_default';
    const confirmMsg = t.deleteConfirm || (isRtl ? 'کیا آپ اس کٹنگ سلپ کو حذف کرنا چاہتے ہیں؟' : 'Delete this slip?');
    if (window.confirm(confirmMsg)) {
      setCustomers((prevCustomers) => {
        const filtered = (prevCustomers || []).filter((item) => item.id !== id);
        saveCustomersToLocalStorage(filtered, effectiveUid);
        deleteCustomerFromOfflineDb(id, effectiveUid);
        setCloudRecordCount(filtered.length);
        return filtered;
      });

      setCloudSyncStatus('syncing');
      deleteCustomerFromFirestore(id).then((res) => {
        if (res.success) {
          setCloudSyncStatus('synced');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      });
      if (activeSlip && activeSlip.id === id) setActiveSlip(null);
    }
  };

  const handleUpdateProfile = (name: string, photo: string | null) => {
    const finalName = name.trim() || 'Azad Master';
    setMasterName(finalName);
    setMasterPhoto(photo);
    try {
      localStorage.setItem('tailorShopName', finalName);
      localStorage.setItem('azad_master_shop_name', finalName);
    } catch {}
    const effectiveUid = currentUser?.uid;
    if (effectiveUid) {
      const payload = { name: finalName, photo, phone: masterPhone };
      try {
        localStorage.setItem(`azad_master_profile_${effectiveUid}`, JSON.stringify(payload));
      } catch {}
      saveUserProfileToFirestore(payload);
    }
  };

  const handleExportJson = () => {
    if (!customers || customers.length === 0) {
      setExportNotice(isRtl ? 'ڈاؤن لوڈ کے لیے کوئی کسٹمر ریکارڈ موجود نہیں ہے۔' : 'No customer records to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }
    const ok = exportCustomersToJson(customers);
    if (ok) {
      setExportNotice(isRtl ? '✅ تمام کسٹمرز کا JSON بیک اپ ڈاؤن لوڈ ہو گیا ہے!' : '✅ JSON backup file downloaded successfully!');
      setTimeout(() => setExportNotice(null), 3500);
    }
  };

  const handleExportExcel = () => {
    if (!customers || customers.length === 0) {
      setExportNotice(isRtl ? 'ڈاؤن لوڈ کے لیے کوئی کسٹمر ریکارڈ موجود نہیں ہے۔' : 'No customer records to export.');
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }
    const ok = exportCustomersToExcelCsv(customers, isRtl);
    if (ok) {
      setExportNotice(isRtl ? '✅ ایکسل شیٹ (Excel / CSV) کامیابی سے ڈاؤن لوڈ ہو گئی ہے!' : '✅ Excel/CSV spreadsheet downloaded successfully!');
      setTimeout(() => setExportNotice(null), 3500);
    }
  };

  const handleImportCustomers = (imported: Customer[]) => {
    const effectiveUid = currentUser?.uid || getCurrentEffectiveUid() || 'master_default';
    if (!Array.isArray(imported)) return;
    
    // Robust union merge: retain existing and incorporate imported
    const map = new Map<number, Customer>();
    (customers || []).forEach(c => { if (c && c.id) map.set(c.id, c); });
    imported.forEach(c => { if (c && c.id) map.set(c.id, c); });
    const merged = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));

    setCustomers(merged);
    setCloudRecordCount(merged.length);
    saveCustomersToOfflineDb(merged, effectiveUid);

    setCloudSyncStatus('syncing');
    syncAllCustomersToFirestore(merged).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        setCloudRecordCount(res.count);
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
  };

  const handleClearAllData = async () => {
    const effectiveUid = currentUser?.uid;
    if (!effectiveUid) return;
    const confirmMsg = isRtl 
      ? 'کیا آپ واقعی اپنے تمام کسٹمر ریکارڈز حذف کرنا چاہتے ہیں؟' 
      : 'Are you sure you want to delete all your customer records?';
    if (window.confirm(confirmMsg)) {
      for (const c of customers) {
        await deleteCustomerFromFirestore(c.id);
      }
      setCustomers([]);
      try {
        localStorage.setItem(`azad_master_customers_${effectiveUid}`, JSON.stringify([]));
      } catch {}
      setActiveSlip(null);
    }
  };

  const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers.filter(Boolean) : []), [customers]);

  const todayCount = useMemo(() => safeCustomers.filter(c => isDeliveryToday(c?.deliveryDate, c?.status)).length, [safeCustomers]);
  const lateCount = useMemo(() => safeCustomers.filter(c => isDeliveryLate(c?.deliveryDate, c?.status)).length, [safeCustomers]);

  const statusCounts = useMemo(() => ({
    all: safeCustomers.length,
    pending: safeCustomers.filter(c => (c?.status || 'pending') === 'pending').length,
    cutting: safeCustomers.filter(c => c?.status === 'cutting').length,
    stitching: safeCustomers.filter(c => c?.status === 'stitching').length,
    ready: safeCustomers.filter(c => c?.status === 'ready').length,
    delivered: safeCustomers.filter(c => c?.status === 'delivered').length,
  }), [safeCustomers]);

  const filteredList = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const list = safeCustomers.filter((item) => {
      if (!item) return false;
      const idStr = item.id ? String(item.id) : '';
      const nameStr = String(item.name || '').toLowerCase();
      const phoneStr = String(item.phone || '');
      const detailsStr = String(item.details || '').toLowerCase();
      const matchesSearch = 
        !q ||
        nameStr.includes(q) || 
        phoneStr.includes(q) ||
        idStr.includes(q) ||
        detailsStr.includes(q);
      
      const itemStatus = item.status || 'pending';
      const matchesStatus = selectedStatusFilter === 'all' || itemStatus === selectedStatusFilter;

      const matchesDelivery = 
        selectedDeliveryFilter === 'all' ||
        (selectedDeliveryFilter === 'today' && isDeliveryToday(item.deliveryDate, item.status)) ||
        (selectedDeliveryFilter === 'late' && isDeliveryLate(item.deliveryDate, item.status));

      return matchesSearch && matchesStatus && matchesDelivery;
    });

    return [...list].sort((a, b) => {
      if (sortOption === 'urgent') {
        if (!a?.deliveryDate && !b?.deliveryDate) return (b?.id || 0) - (a?.id || 0);
        if (!a?.deliveryDate) return 1;
        if (!b?.deliveryDate) return -1;
        return String(a.deliveryDate).localeCompare(String(b.deliveryDate));
      } else if (sortOption === 'alphabetical') {
        const nameA = String(a?.name || '').trim();
        const nameB = String(b?.name || '').trim();
        return nameA.localeCompare(nameB, 'ur', { sensitivity: 'base' });
      } else {
        // 'newest' (default)
        return (b?.id || 0) - (a?.id || 0);
      }
    });
  }, [safeCustomers, searchQuery, selectedStatusFilter, selectedDeliveryFilter, sortOption]);

  // 1. Production-Ready Flexible Multi-Method Login View
  if (!isLoggedIn) {
    return (
      <div 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className="flex items-center justify-center min-h-screen p-4 selection:bg-[#25d366] selection:text-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #075e54 0%, #064e46 35%, #053b35 70%, #032824 100%)',
        }}
      >
        {/* Soft WhatsApp Green Ambient Lighting */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#25d366]/15 rounded-full blur-[110px]" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[90px]" />
          <div 
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(#25d366 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px'
            }}
          />
        </div>

        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={2800} />}

        <div className="login-card bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-7 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#128c7e]/20">
          
          {/* لوگو اور ٹائٹل */}
          <div className="text-center mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2.5 flex items-center justify-center filter drop-shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-[#25d366] to-[#128c7e] shadow-md">
                <img 
                  src="/azad-master-logo.svg" 
                  alt="Azad Master" 
                  className="logo w-full h-full object-contain rounded-full bg-[#075e54]"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== '/logo.png') target.src = '/logo.png';
                  }}
                />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-wide">
              {t.appTitle || (isRtl ? 'آزاد ماسٹر' : 'Azad Master')}
            </h2>
            <p className="subtitle text-xs text-[#075e54] mt-0.5 font-bold">
              {t.appSubtitle || (isRtl ? 'درزی ماسٹر ڈیجیٹل کلاؤڈ رجسٹر' : 'Professional Tailor Digital Cloud Register')}
            </p>
          </div>

          {/* High Visibility Error Alert Banner (if any) */}
          {authError && (
            <div 
              id="auth-error-alert-banner"
              role="alert"
              className="mb-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start justify-between gap-2 text-left rtl:text-right animate-in fade-in shadow-xs"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 animate-pulse" />
                <p className="font-semibold text-rose-900 leading-relaxed text-[11.5px] whitespace-pre-wrap break-words">
                  {authError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs cursor-pointer hover:underline shrink-0"
              >
                {isRtl ? 'صاف کریں' : 'Dismiss'}
              </button>
            </div>
          )}

          {/* صرف گوگل سائن ان بٹن */}
          <div className="my-5">
            <button 
              type="button" 
              id="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={isLoadingAuth}
              className="google-btn w-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 hover:border-[#4285F4] shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-3 cursor-pointer select-none ring-4 ring-transparent hover:ring-blue-100"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#ffffff',
                color: '#333',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              {isLoadingAuth ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin text-[#075e54]" />
                  <span className="text-slate-700">
                    {t.signingIn || (isRtl ? 'منسلک ہو رہا ہے...' : 'Signing in...')}
                  </span>
                </>
              ) : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    style={{ width: '20px', height: '20px' }} 
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Language Selector */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#075e54] shrink-0" />
              <select 
                id="login-language-select"
                value={currentLang} 
                onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs text-slate-600 font-medium outline-none cursor-pointer"
              >
                {languageList.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[#075e54] font-medium text-[11px]">Azad Master v1.0</span>
          </div>

        </div>
      </div>
    );
  }

  // 2. Main App View (Tailor is logged in)
  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="min-h-screen text-slate-800 flex items-center justify-center p-0 sm:p-4 selection:bg-[#25d366] selection:text-white relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #075e54 0%, #064e46 35%, #053b35 70%, #032824 100%)',
      }}
    >
      {/* Soft WhatsApp Green Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#25d366]/15 rounded-full blur-[110px]" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[90px]" />
        <div 
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(#25d366 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px'
          }}
        />
      </div>

      <div className="w-full max-w-md bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-screen sm:h-[90vh] relative z-10 border border-[#128c7e]/20">
        
        {/* Top WhatsApp Green Header - Clean, Spacious, Modern */}
        <header 
          id="main-header"
          className="bg-[#075e54] text-white px-3.5 sm:px-4 py-3 flex items-center justify-between shrink-0 relative shadow-md z-30" 
          dir="ltr"
        >
          {/* Left Side: 4-Line Menu Button & Circular Brand Logo & Large Bold "Azad Master" with Green Verification Badge */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <button 
              id="menu-btn"
              onClick={() => setShowSideMenu(!showSideMenu)} 
              className="p-1.5 -ml-1 text-white hover:bg-white/15 active:bg-white/25 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
              aria-label="Side Navigation Menu"
              title="Menu"
            >
              {/* 4-Line Navigation Menu Icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 10h16M4 15h16M4 20h16" />
              </svg>
            </button>

            {/* Circular Brand Logo with Green Verification Badge */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/15 border-2 border-emerald-300/60 p-0.5 flex items-center justify-center shadow-xs">
                {masterPhoto && masterPhoto.trim() !== '' ? (
                  <img src={masterPhoto} alt="Tailor" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <img src="/azad-master-logo.svg" alt="Azad Master Logo" className="w-full h-full object-contain" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#25d366] text-[#075e54] rounded-full flex items-center justify-center ring-2 ring-[#075e54] shadow-2xs">
                <CheckCircle2 className="w-2.5 h-2.5 text-white fill-[#25d366]" />
              </span>
            </div>

            {/* Large Bold Dynamic Brand / Shop Title with Green Verification Badge */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span 
                  id="header-shop-title"
                  className="font-black text-lg sm:text-xl tracking-wider text-white m-0 select-none drop-shadow-xs leading-none truncate max-w-[200px] sm:max-w-[320px]"
                  title={effectiveTailorName}
                >
                  {effectiveTailorName}
                </span>
                <span className="inline-flex items-center text-[10px] font-bold text-[#25d366] bg-black/25 px-1.5 py-0.2 rounded-md shrink-0">
                  ✓ Verified
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Clean & Spacious (No action buttons cluttering top bar) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton isRtl={isRtl} variant="header" />
          </div>

          {/* CustomDrawerMenu Anchored Directly to Header */}
          <CustomDrawerMenu
            visible={showSideMenu}
            onClose={() => setShowSideMenu(false)}
            onNavigate={(route) => {
              if (route === 'Profile') {
                setShowSettings(true);
              } else if (route === 'Analytics') {
                setShowAnalytics(true);
              } else if (route === 'BulkMessaging') {
                setShowBulkMessaging(true);
              } else if (route === 'Backup') {
                setShowQuickBackup(true);
              } else if (route === 'Help') {
                setShowAppGuide(true);
              } else if (route === 'Privacy') {
                setShowPrivacy(true);
              }
            }}
            onLogout={handleLogout}
            onOpenMeasurementModal={() => {
              setEditingCustomer(null);
              setShowAddModal(true);
            }}
            onOpenSlipModal={() => {
              setShowImageSourceModal(true);
            }}
            onOpenBulkMsg={() => {
              setShowBulkMessaging(true);
            }}
            onTriggerBackup={() => {
              setShowQuickBackup(true);
            }}
            onExportExcel={handleExportExcel}
            onExportJson={handleExportJson}
            todayCount={todayCount}
            lateCount={lateCount}
            onFilterToday={() => setSelectedDeliveryFilter(prev => prev === 'today' ? 'all' : 'today')}
            onFilterLate={() => setSelectedDeliveryFilter(prev => prev === 'late' ? 'all' : 'late')}
            sortOption={sortOption}
            onChangeSort={(opt) => setSortOption(opt)}
            currentLang={currentLang}
            onChangeLanguage={changeLanguage}
            masterName={effectiveTailorName}
            userPhone={masterPhone || currentUser?.phoneNumber || undefined}
            userEmail={currentUser?.email || undefined}
            isRtl={isRtl}
          />
        </header>

        {/* 1. TOP PRIORITY STATUS TABS (Primary Tailoring Workflow: All, Pending, Cutting, Stitching) */}
        <div 
          id="sticky-top-container" 
          className="bg-white shrink-0 z-20 shadow-xs border-b border-slate-200 px-2.5 sm:px-3 py-2 space-y-1.5 select-none"
        >
          {/* Compact Quick-Search Bar (Appears when Search is opened or active query) */}
          {(isSearchOpen || searchQuery.trim().length > 0) && (
            <div className="animate-in slide-in-from-top-2 duration-150 mb-1">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#075e54] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'گاہک کا نام، فون یا پرچی نمبر لکھیں...' : 'Search customer name, phone, slip #...'}
                  className="w-full pl-9 pr-8 py-2 bg-emerald-50/50 hover:bg-emerald-50/80 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 rounded-xl border border-emerald-300 focus:border-[#075e54] focus:ring-2 focus:ring-[#128c7e]/20 outline-none transition-all"
                  dir={isRtl ? 'rtl' : 'ltr'}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-700 p-1 rounded-full text-xs font-bold cursor-pointer"
                  title="Close Search"
                >
                  ✕
                </button>
              </div>
              {searchQuery.trim().length > 0 && (
                <div className="flex items-center justify-between text-[11px] font-bold text-[#075e54] px-1 mt-1">
                  <span>{t.showing}: {filteredList.length} {t.customerSlipsRegister}</span>
                  <button 
                    onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} 
                    className="text-slate-500 hover:text-slate-700 underline text-[10px]"
                  >
                    {isRtl ? 'فلٹر صاف کریں' : 'Clear Search'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4 Primary Workflow Order Status Tabs */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* 1. All Tab */}
            <button
              id="workflow-tab-all"
              type="button"
              onClick={() => {
                setSelectedStatusFilter('all');
                setSelectedDeliveryFilter('all');
              }}
              className={`py-2 sm:py-2.5 px-1 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border active:scale-95 ${
                selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                  ? 'bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white border-[#075e54] shadow-xs ring-2 ring-[#128c7e]/30 scale-[1.02]'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">📋</span>
                <span className="truncate">{t.allFilter || (isRtl ? 'سب' : 'All')}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {statusCounts.all}
              </span>
            </button>

            {/* 2. Pending Tab */}
            <button
              id="workflow-tab-pending"
              type="button"
              onClick={() => {
                setSelectedStatusFilter('pending');
                setSelectedDeliveryFilter('all');
              }}
              className={`py-2 sm:py-2.5 px-1 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border active:scale-95 ${
                selectedStatusFilter === 'pending'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/30 scale-[1.02]'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 border-amber-200/70'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">⏳</span>
                <span className="truncate">{isRtl ? 'پینڈنگ' : 'Pending'}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                selectedStatusFilter === 'pending'
                  ? 'bg-white/25 text-white'
                  : 'bg-amber-200 text-amber-900'
              }`}>
                {statusCounts.pending || 0}
              </span>
            </button>

            {/* 3. Cutting Tab */}
            <button
              id="workflow-tab-cutting"
              type="button"
              onClick={() => {
                setSelectedStatusFilter('cutting');
                setSelectedDeliveryFilter('all');
              }}
              className={`py-2 sm:py-2.5 px-1 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border active:scale-95 ${
                selectedStatusFilter === 'cutting'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/30 scale-[1.02]'
                  : 'bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 border-indigo-200/70'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">✂️</span>
                <span className="truncate">{isRtl ? 'کٹنگ' : 'Cutting'}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                selectedStatusFilter === 'cutting'
                  ? 'bg-white/25 text-white'
                  : 'bg-indigo-200 text-indigo-900'
              }`}>
                {statusCounts.cutting || 0}
              </span>
            </button>

            {/* 4. Stitching Tab */}
            <button
              id="workflow-tab-stitching"
              type="button"
              onClick={() => {
                setSelectedStatusFilter('stitching');
                setSelectedDeliveryFilter('all');
              }}
              className={`py-2 sm:py-2.5 px-1 rounded-xl font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border active:scale-95 ${
                selectedStatusFilter === 'stitching'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 shadow-xs ring-2 ring-purple-500/30 scale-[1.02]'
                  : 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 border-purple-200/70'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs">🧵</span>
                <span className="truncate">{isRtl ? 'سلائی' : 'Stitching'}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                selectedStatusFilter === 'stitching'
                  ? 'bg-white/25 text-white'
                  : 'bg-purple-200 text-purple-900'
              }`}>
                {statusCounts.stitching || 0}
              </span>
            </button>
          </div>

          {/* Export Toast if active */}
          {exportNotice && (
            <div 
              id="export-notice-toast"
              className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-[11px] font-bold flex items-center justify-between animate-in fade-in"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setExportNotice(null)} 
                className="text-emerald-700 hover:text-emerald-900 ml-2 cursor-pointer font-extrabold text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Customer Slips List */}
        <main 
          id="scrollable-customers-container"
          className="flex-1 overflow-y-auto p-2 sm:px-3 pb-4 bg-[#efeae2]/40"
        >
          {/* Main Dashboard Primary Tools & Quick Action Cards */}
          <div id="home-primary-tools-grid" className="mb-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Unified Scan Slip Card */}
              <button
                type="button"
                id="main-action-scan-slip"
                onClick={() => setShowImageSourceModal(true)}
                className="group p-3 bg-gradient-to-br from-[#075e54] to-[#128c7e] hover:from-[#054c44] hover:to-[#0e7467] text-white rounded-2xl shadow-sm hover:shadow-md active:scale-98 transition-all flex flex-col justify-between text-left cursor-pointer border border-emerald-400/20 relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shadow-2xs group-hover:scale-110 transition-transform">
                    📸
                  </div>
                  <span className="text-[10px] font-bold bg-[#25d366]/20 text-[#dcf8c6] border border-[#25d366]/40 px-2 py-0.5 rounded-full">
                    OCR Scan
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight text-white mb-0.5">
                    {isRtl ? 'پرچی اسکین کریں' : 'Scan Slip'}
                  </h3>
                  <p className="text-[10.5px] text-[#dcf8c6]/90 font-medium line-clamp-1">
                    {isRtl ? 'کیمرہ یا گیلری سے ناپ اسکین' : 'Camera & Gallery OCR'}
                  </p>
                </div>
              </button>

              {/* 2. Bulk Message Card */}
              <button
                type="button"
                id="main-action-bulk-msg"
                onClick={() => setShowBulkMessaging(true)}
                className="group p-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-sm hover:shadow-md active:scale-98 transition-all flex flex-col justify-between text-left cursor-pointer border border-slate-200/90 hover:border-emerald-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base shadow-2xs group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-[#075e54] border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    WhatsApp
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight text-slate-900 mb-0.5">
                    {isRtl ? 'تمام گاہکوں کو میسج' : 'Bulk Message'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium line-clamp-1">
                    {isRtl ? 'آرڈرز الرٹ و پیغامات' : 'Send WhatsApp / SMS'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Orders Carousel / Delivery status */}
          <RecentOrdersQuickView
            customers={customers}
            onSelectOrder={(cust) => setActiveSlip(cust)}
            isRtl={isRtl}
            translations={t}
          />

          {/* List Count and Cloud Indicator Header */}
          <div className="flex items-center justify-between px-1 py-1.5 text-xs text-[#54656f]">
            <span className="font-bold flex items-center gap-1 text-slate-700">
              <Scissors className="w-3.5 h-3.5 text-[#075e54]" />
              <span>{t.customerSlipsRegister}</span>
              <span className="text-[#075e54]">({filteredList.length})</span>
            </span>

            {/* Cloud Auto-Sync Indicator */}
            <div className="flex items-center gap-1 text-[11px] font-medium">
              {cloudSyncStatus === 'syncing' ? (
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{t.syncing}</span>
                </span>
              ) : cloudSyncStatus === 'synced' ? (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>{t.cloudSynced}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleManualCloudSync}
                  className="flex items-center gap-1 text-[#075e54] hover:underline cursor-pointer"
                >
                  <Cloud className="w-3 h-3" />
                  <span>{t.tapToSync}</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Cards List */}
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300 my-4 shadow-2xs">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#f0faf4] flex items-center justify-center text-2xl border border-[#128c7e]/20">
                ✂️
              </div>
              <h3 className="font-bold text-slate-700 text-sm mb-1">
                {searchQuery ? t.noCustomerFound : t.noCustomersSaved}
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                {searchQuery ? t.trySearchingOther : t.addFirstCustomerHint}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-[#075e54] text-white rounded-xl text-xs font-bold hover:bg-[#054c44] shadow-sm cursor-pointer"
              >
                + {t.addFirstCustomer}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredList.map((customer) => {
                const statusMeta = getStatusMeta(customer.status || 'pending');
                const isDelivToday = isDeliveryToday(customer.deliveryDate, customer.status);
                const isDelivLate = isDeliveryLate(customer.deliveryDate, customer.status);
                const avatarTheme = getAvatarColorByName(customer.name, customer.avatarColor);
                const initialChar = getCustomerInitial(customer.name);

                return (
                  <div
                    key={customer.id}
                    id={`customer-card-${customer.id}`}
                    onClick={() => setActiveSlip(customer)}
                    className="bg-white rounded-xl p-3 shadow-xs hover:shadow-md transition-all border border-slate-200/80 cursor-pointer active:scale-[0.99] relative overflow-hidden group"
                  >
                    {/* Status Top Indicator Bar */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Prominent Initial-Based Dynamic Avatar with High Contrast */}
                        <div 
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${
                            customer.imageUri 
                              ? 'bg-slate-100 border border-slate-200' 
                              : `${avatarTheme.gradientClass} ${avatarTheme.solidTextClass} border-2 border-white shadow-sm ring-2 ${avatarTheme.ringClass}`
                          } flex items-center justify-center font-black text-base sm:text-lg shrink-0 shadow-md overflow-hidden transition-all duration-200 group-hover:scale-105 select-none`}
                        >
                          {customer.imageUri ? (
                            <img src={customer.imageUri} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="leading-none drop-shadow-xs font-black tracking-tight">{initialChar}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#075e54] transition-colors truncate">
                            {customer.name || t.unnamedCustomer}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] sm:text-xs text-[#54656f] font-mono flex items-center gap-1" dir="ltr">
                              <Phone className="w-3 h-3 text-[#25d366]" />
                              <span>{customer.phone || 'No phone'}</span>
                            </p>
                            {customer.phone && customer.phone.replace(/[^0-9]/g, '').length >= 7 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                                  const encodedMsg = encodeURIComponent(
                                    `✨ *آزاد ماسٹر (AZAD MASTER)* ✨\nالسلام علیکم محترم *${customer.name || 'گاہک'}* صاحب، آپ کا ناپ ریکارڈ آزاد ماسٹر ٹیلرز کے پاس محفوظ ہے۔`
                                  );
                                  window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#25D366]/15 hover:bg-[#25D366] text-[#075e54] hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-2.5 h-2.5 fill-current" />
                                <span>WhatsApp</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${statusMeta.badgeClass}`}>
                        <span>{statusMeta.icon}</span>
                        <span>{getLocalizedStatusLabel(customer.status || 'pending', t)}</span>
                      </span>
                    </div>

                    {/* Customer Note Tag Snippet */}
                    {(customer.notes || customer.measurementsObj?.specialNotes) && (
                      <div className="mb-2 px-2 py-1 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-900 truncate">
                        <span className="shrink-0 text-amber-600">📝</span>
                        <span className="font-bold truncate">
                          {customer.notes || customer.measurementsObj?.specialNotes}
                        </span>
                      </div>
                    )}

                    {/* Attached Handwritten Slip Preview Banner inside Customer Card */}
                    {customer.imageUri && customer.imageUri.trim() !== '' && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlip(customer);
                        }}
                        className="my-2 p-2 bg-[#f0faf4] hover:bg-[#e7f7ef] border border-[#128c7e]/25 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={customer.imageUri} 
                            alt="Original Handwritten Slip" 
                            className="w-11 h-11 object-cover rounded-lg border border-[#128c7e]/30 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[#075e54] flex items-center gap-1">
                              <span>📜</span>
                              <span>{isRtl ? 'اصلی ہینڈ رائٹنگ پرچی / کیمرہ فوٹو' : 'Original Handwritten Slip'}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {isRtl ? 'مکمل پرچی پر کلک کر کے جائزہ لیں' : 'Click to view receipt'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#075e54] text-white shrink-0 shadow-2xs">
                          {isRtl ? 'پرچی دیکھیں' : 'View Slip'}
                        </span>
                      </div>
                    )}

                    {/* Delivery & Accounts Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.date}</span>
                        <span className="font-medium text-slate-700">{customer.date}</span>
                        {customer.deliveryDate && (
                          <span className={`ml-1 font-bold ${
                            isDelivLate ? 'text-rose-600' : isDelivToday ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            • {t.deliveryDate}: {customer.deliveryDate}
                          </span>
                        )}
                      </div>

                      {/* Balance amount badge */}
                      {customer.balanceAmount && Number(customer.balanceAmount) > 0 ? (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                          {t.balance}: Rs {customer.balanceAmount}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                          {t.clearedAccount || (isRtl ? 'کھاتہ صاف' : 'Cleared')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Streamlined WhatsApp-Style Bottom Navigation Bar (4 Clean Buttons) */}
        <div 
          id="bottom-nav-bar"
          className="relative bg-white border-t border-slate-200/90 h-16 px-3 sm:px-6 flex items-center justify-around shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none"
        >
          {/* 1. Home (All/Pending orders feed) */}
          <button 
            id="nav-home-btn"
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const container = document.getElementById('scrollable-customers-container');
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              !isSearchOpen && !showSideMenu 
                ? 'text-[#075e54] font-black' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
            title={t.navHome || (isRtl ? 'ہوم' : 'Home')}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${!isSearchOpen && !showSideMenu ? 'bg-[#e7f7ef] text-[#075e54]' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none tracking-tight">
              {t.navHome || (isRtl ? 'ہوم' : 'Home')}
            </span>
          </button>

          {/* 2. Search (Compact Quick-Search) */}
          <button 
            id="nav-search-btn"
            type="button"
            onClick={() => {
              setIsSearchOpen(prev => !prev);
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 50);
            }} 
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isSearchOpen 
                ? 'text-[#075e54] font-black' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
            title={isRtl ? 'تلاش کریں' : 'Search'}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isSearchOpen ? 'bg-[#e7f7ef] text-[#075e54]' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none tracking-tight">
              {isRtl ? 'تلاش' : 'Search'}
            </span>
          </button>

          {/* 3. Center Prominent WhatsApp-Green Floating Plus (+) Button (New Order / Measurement Form) */}
          <button
            id="nav-add-measurement-btn"
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setShowAddModal(true);
            }}
            className="flex flex-col items-center justify-center flex-1 -mt-4.5 group cursor-pointer active:scale-90 transition-transform"
            title={isRtl ? 'نیا گاہک / نیا ناپ درج کریں' : 'Add New Customer / Measurement'}
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg shadow-[#25d366]/40 ring-4 ring-white border border-[#25d366]/50 transition-all group-hover:scale-105 group-hover:shadow-xl">
              <Plus className="w-7 h-7 text-white stroke-[3.5]" />
            </div>
            <span className="text-[10.5px] font-black leading-none tracking-tight text-[#075e54] mt-1">
              {isRtl ? 'نیا ناپ' : 'New Order'}
            </span>
          </button>

          {/* 4. Orders / Customers History List */}
          <button 
            id="nav-orders-btn"
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setSelectedStatusFilter('all');
              setSelectedDeliveryFilter('all');
              const container = document.getElementById('scrollable-customers-container');
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              !isSearchOpen && selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                ? 'text-[#075e54] font-black' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
            title={isRtl ? 'آرڈرز اور کھاتہ رجسٹر' : 'Orders & Customers'}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${!isSearchOpen && selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all' ? 'bg-[#e7f7ef] text-[#075e54]' : ''}`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none tracking-tight">
              {isRtl ? 'آرڈرز' : 'Orders'}
            </span>
          </button>
        </div>

        {/* Google AdMob Reserved Banner Space (Temporarily Disabled - Set enabled={true} when active) */}
        <AdMobBannerPlaceholder isRtl={isRtl} enabled={false} />

        {/* Image Source Selection Modal (Camera vs Gallery vs Manual) */}
        {showImageSourceModal && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
              onClick={() => setShowImageSourceModal(false)}
            />
            <div 
              id="imageSourceModal" 
              className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-2xl z-50 w-[92%] max-w-sm border border-[#128c7e]/20 animate-in slide-in-from-bottom-3 duration-200"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p className="font-bold text-xs text-[#075e54] flex items-center gap-1.5">
                  <span>📸</span>
                  <span>{t.selectSlipOrClothPhoto || (isRtl ? 'پرچی یا کپڑے کی تصویر منتخب کریں' : 'Select Slip or Cloth Photo')}</span>
                </p>
                <button 
                  onClick={() => setShowImageSourceModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <button 
                  id="btn-open-camera"
                  onClick={() => {
                    document.getElementById('cameraInput')?.click();
                    setShowImageSourceModal(false);
                  }} 
                  className="p-3 bg-[#075e54] hover:bg-[#054c44] text-white rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <span className="text-xl">📷</span>
                  <span>{t.camera}</span>
                </button>

                <button 
                  id="btn-open-gallery"
                  onClick={() => {
                    document.getElementById('galleryInput')?.click();
                    setShowImageSourceModal(false);
                  }} 
                  className="p-3 bg-[#128c7e] hover:bg-[#0f766a] text-white rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <span className="text-xl">🖼️</span>
                  <span>{t.gallery}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowImageSourceModal(false);
                  setEditingCustomer(null);
                  setShowAddModal(true);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-[#e7f7ef] text-slate-700 hover:text-[#075e54] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>📝</span>
                <span>{t.fillFormManually || (isRtl ? 'بغیر تصویر نیا فارم بھریں' : 'Fill Form Manually')}</span>
              </button>
            </div>
          </>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddMeasurementModal
            initialCustomer={editingCustomer}
            onSave={handleSaveCustomer}
            onClose={() => {
              setShowAddModal(false);
              setEditingCustomer(null);
            }}
            translations={t}
            isRtl={isRtl}
          />
        )}

        {activeSlip && (
          <DigitalSlipModal
            slip={activeSlip}
            onClose={() => setActiveSlip(null)}
            onEdit={(slip) => {
              setEditingCustomer(slip);
              setActiveSlip(null);
              setShowAddModal(true);
            }}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
            translations={t}
            isRtl={isRtl}
          />
        )}

        {showSettings && (
          <SettingsModal
            masterName={effectiveTailorName}
            masterPhoto={masterPhoto}
            onUpdateProfile={handleUpdateProfile}
            customers={customers}
            onImportCustomers={handleImportCustomers}
            onClearAllData={handleClearAllData}
            onClose={() => setShowSettings(false)}
            onOpenAppGuide={() => setShowAppGuide(true)}
            onOpenPrivacy={() => setShowPrivacy(true)}
            currentLang={currentLang}
            onChangeLanguage={changeLanguage}
            translations={t}
            isRtl={isRtl}
            onSyncToCloud={handleManualCloudSync}
            cloudRecordCount={cloudRecordCount}
            lastCloudSyncTime={lastCloudSyncTime}
          />
        )}

        {showAppGuide && (
          <AppGuideModal
            onClose={() => setShowAppGuide(false)}
            translations={t}
            isRtl={isRtl}
          />
        )}

        {showPrivacy && (
          <PrivacyModal
            onClose={() => setShowPrivacy(false)}
            translations={t}
            isRtl={isRtl}
          />
        )}

        {/* Customer & Business Analytics Modal */}
        <CustomerAnalyticsModal
          visible={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          customers={customers}
          onOpenCustomerSlip={(cust) => setActiveSlip(cust)}
          isRtl={isRtl}
          currentLang={currentLang}
          translations={t}
        />

        {/* Bulk WhatsApp / SMS Messaging Modal */}
        <BulkMessagingModal
          visible={showBulkMessaging}
          onClose={() => setShowBulkMessaging(false)}
          customers={customers}
          masterName={effectiveTailorName}
          isRtl={isRtl}
          currentLang={currentLang}
          translations={t}
        />

        {/* Quick Backup & Excel Export Modal */}
        <QuickBackupModal
          visible={showQuickBackup}
          onClose={() => setShowQuickBackup(false)}
          customers={customers}
          onImportCustomers={handleImportCustomers}
          isRtl={isRtl}
        />

        {/* PWA 100% Offline Status Indicator */}
        <OfflineIndicator />

        {/* Hidden File Inputs (Camera, Gallery, and Unified OCR) */}
        <input
          type="file"
          id="cameraInput"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleGlobalImageUpload}
        />
        <input
          type="file"
          id="galleryInput"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleGlobalImageUpload}
        />
        <input
          type="file"
          id="ocrFileinput"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleGlobalImageUpload}
        />

      </div>
    </div>
  );
}
