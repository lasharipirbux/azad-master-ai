import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer, CustomerMeasurements, SupportedLanguage, OrderStatus } from './types';
import { translations, languageList } from './data/translations';
import { useLanguage } from './context/LanguageContext';
import { DigitalSlipModal } from './components/DigitalSlipModal';
import { AddMeasurementModal } from './components/AddMeasurementModal';
import { ChatbotModal } from './components/ChatbotModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AppGuideModal } from './components/AppGuideModal';
import { RecentOrdersQuickView } from './components/RecentOrdersQuickView';
import { CustomerSearchComponent } from './components/CustomerSearchComponent';
import { SlimSummaryHeader } from './components/SlimSummaryHeader';
import { CustomDrawerMenu } from './components/CustomDrawerMenu';
import { SplashScreen } from './components/SplashScreen';
import { compressImageForOcr } from './utils/imageCompressor';
import { getStatusMeta, ORDER_STATUS_LIST, getLocalizedStatusLabel } from './utils/orderStatus';
import { 
  auth, 
  signInWithGoogle,
  signInWithGoogleRedirect,
  checkRedirectAuthResult,
  signOutUser,
  signInMasterCloudDirect,
  signInWithMasterPhonePin,
  getActiveLocalUser,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  subscribeToCustomerRecords,
  syncAllCustomersToFirestore,
  testFirebaseConnection,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  getAuthErrorMessage,
  activeFirebaseConfig
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Scissors, 
  Search, 
  Plus, 
  Menu, 
  Bot, 
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
  Zap
} from 'lucide-react';
import { isDeliveryToday, isDeliveryLate, getDeliveryStatus } from './utils/deliveryDate';

export default function AzadMasterFinalApp() {
  const { currentLang, setLanguage: changeLanguage, t, isRtl } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  
  // Cloud Auto-Save States (Firebase Database)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'online'>('online');
  const [cloudRecordCount, setCloudRecordCount] = useState<number>(0);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedDeliveryFilter, setSelectedDeliveryFilter] = useState<'all' | 'today' | 'late'>('all');
  
  // Search history state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('azad_master_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const handleSetSearch = (name: string) => {
    setSearchQuery(name);
  };

  const commitSearchHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('azad_master_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeSearchHistoryItem = (itemToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem('azad_master_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllSearchHistory = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem('azad_master_search_history');
    } catch {}
  };

  // Close search dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    (window as any).setSearch = (name: string) => {
      setSearchQuery(name);
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Master profile (per user, not hardcoded)
  const [masterName, setMasterName] = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [masterPhoto, setMasterPhoto] = useState<string | null>(null);

  // Login UI modes & inputs
  const [loginTab, setLoginTab] = useState<'instant' | 'phone' | 'google'>('instant');
  const [inputMasterName, setInputMasterName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [phoneLoginError, setPhoneLoginError] = useState<string | null>(null);

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
        if (cloudProfile && cloudProfile.name && cloudProfile.name !== 'Pir Bakhash (Master)' && cloudProfile.name !== 'Pirbux') {
          setMasterName(cloudProfile.name);
          setMasterPhoto(cloudProfile.photo || photo);
          setMasterPhone(cloudProfile.phone || phone);
        } else {
          const localProfile = localStorage.getItem(`azad_master_profile_${uid}`);
          if (localProfile) {
            const parsed = JSON.parse(localProfile);
            const resolved = (parsed.name && parsed.name !== 'Pir Bakhash (Master)' && parsed.name !== 'Pirbux')
              ? parsed.name
              : defaultName;
            setMasterName(resolved);
            setMasterPhoto(parsed.photo || photo);
            setMasterPhone(parsed.phone || phone);
          } else {
            setMasterName(defaultName);
            setMasterPhoto(photo);
            setMasterPhone(phone);
            saveUserProfileToFirestore({
              name: defaultName,
              photo: photo,
              phone: phone
            });
          }
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
        setMasterName(defaultName);
        setMasterPhoto(photo);
        setMasterPhone(phone);
      }

      // 2. Load cached customers for this specific user
      const localCacheKey = `azad_master_customers_${uid}`;
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setCustomers(parsed);
            setCloudRecordCount(parsed.length);
          }
        } catch {}
      } else {
        setCustomers([]);
        setCloudRecordCount(0);
      }

      // 3. Subscribe to real-time customer records for this user (where ownerId == uid)
      setCloudSyncStatus('syncing');
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeFirestore = subscribeToCustomerRecords((cloudCustomers) => {
        setCustomers(cloudCustomers);
        setCloudRecordCount(cloudCustomers.length);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        try {
          localStorage.setItem(localCacheKey, JSON.stringify(cloudCustomers));
        } catch {}
      });
    };

    // Auto-restore active session if existing
    const activeLocal = getActiveLocalUser();
    if (activeLocal && activeLocal.uid) {
      const mockUser = {
        uid: activeLocal.uid,
        displayName: activeLocal.name,
        phoneNumber: activeLocal.phone || '',
        email: activeLocal.email || null,
        photoURL: activeLocal.photo || null
      } as unknown as User;
      setCurrentUser(mockUser);
      setIsLoggedIn(true);
      setIsLoadingAuth(false);
      setupUserSession(mockUser);
    }

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
        console.error("Google redirect sign-in check error:", err);
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
        const local = getActiveLocalUser();
        if (local && local.uid) {
          const mockUser = {
            uid: local.uid,
            displayName: local.name,
            phoneNumber: local.phone || '',
            email: local.email || null,
            photoURL: local.photo || null
          } as unknown as User;
          setCurrentUser(mockUser);
          setIsLoggedIn(true);
          setIsLoadingAuth(false);
          setupUserSession(mockUser);
          return;
        }
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsLoadingAuth(false);
        setCustomers([]);
        setMasterName('');
        setMasterPhoto(null);
        setMasterPhone('');
        setCloudRecordCount(0);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [isRtl]);

  // Dynamically resolve tailor's display name from Firebase Auth (currentUser.displayName),
  // custom masterName, or default to 'ماسٹر صاحب' (never a static hardcoded name)
  const effectiveTailorName = useMemo(() => {
    // 1. If user explicitly entered a custom masterName in settings that isn't legacy hardcoded placeholder
    if (masterName && masterName.trim()) {
      const trimmed = masterName.trim();
      if (
        trimmed !== 'Pir Bakhash (Master)' &&
        trimmed !== 'Master Pir Bakhash' &&
        trimmed !== 'Pirbux' &&
        trimmed !== 'Master Tailor'
      ) {
        return trimmed;
      }
    }
    // 2. Read dynamically from Firebase Auth currentUser.displayName (Google profile name)
    if (currentUser?.displayName && currentUser.displayName.trim()) {
      return currentUser.displayName.trim();
    }
    // 3. Fallback to 'ماسٹر صاحب' (or 'Master Tailor' if English)
    return isRtl ? 'ماسٹر صاحب' : 'Master Tailor';
  }, [masterName, currentUser?.displayName, isRtl]);

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

  // Real Google Sign-in Handler (Popup with auto-fallback to Redirect if popup is blocked)
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will handle setting the state and user
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // If popup was blocked or failed due to browser restrictions, fallback automatically to redirect
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        try {
          console.log("Popup blocked by browser. Automatically trying Google Redirect...");
          await signInWithGoogleRedirect();
          return;
        } catch (redirectErr: any) {
          console.error("Google Redirect Fallback Error:", redirectErr);
          setAuthError(getAuthErrorMessage(redirectErr, isRtl));
        }
      } else {
        setAuthError(getAuthErrorMessage(err, isRtl));
      }
      setIsLoadingAuth(false);
    }
  };

  // Dedicated Direct Google Redirect Sign-in Handler
  const handleGoogleRedirectLogin = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error("Google Redirect Error:", err);
      setAuthError(getAuthErrorMessage(err, isRtl));
      setIsLoadingAuth(false);
    }
  };

  // Instant Master Cloud Login (Bypasses unauthorized-domain restriction on Starter tier)
  const handleInstantLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setPhoneLoginError(null);
    setIsLoadingAuth(true);
    try {
      const res = await signInMasterCloudDirect(inputMasterName, inputPhone);
      const sessionUser = {
        uid: res.uid,
        displayName: res.name,
        phoneNumber: res.phone || '',
        email: res.email || null,
        photoURL: res.photo || null
      } as unknown as User;
      setCurrentUser(sessionUser);
      setIsLoggedIn(true);
      setMasterName(res.name);
      if (res.phone) setMasterPhone(res.phone);
    } catch (err: any) {
      console.error("Instant Login Error:", err);
      setAuthError(getAuthErrorMessage(err, isRtl));
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Phone + 4-digit PIN Login
  const handlePhonePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoginError(null);
    setAuthError(null);
    if (!inputPhone || inputPhone.trim().length < 4) {
      setPhoneLoginError(isRtl ? 'براہ کرم درست موبائل نمبر درج کریں۔' : 'Please enter a valid phone number.');
      return;
    }
    if (!inputPin || inputPin.trim().length < 4) {
      setPhoneLoginError(isRtl ? 'براہ کرم کم از کم 4 ہندسوں کا پن کوڈ درج کریں۔' : 'Please enter at least 4-digit PIN.');
      return;
    }
    setIsLoadingAuth(true);
    try {
      const res = await signInWithMasterPhonePin(inputPhone, inputPin, inputMasterName);
      if (res.success && res.session) {
        const sessionUser = {
          uid: res.session.uid,
          displayName: res.session.name,
          phoneNumber: res.session.phone || '',
          email: res.session.email || null,
          photoURL: res.session.photo || null
        } as unknown as User;
        setCurrentUser(sessionUser);
        setIsLoggedIn(true);
        setMasterName(res.session.name);
        if (res.session.phone) setMasterPhone(res.session.phone);
      } else {
        setPhoneLoginError(res.error || (isRtl ? 'لاگ ان میں خرابی پیش آئی۔' : 'Login failed.'));
      }
    } catch (err: any) {
      setPhoneLoginError(isRtl ? 'لاگ ان نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔' : 'Could not log in. Please retry.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCustomers([]);
    setMasterName('');
    setMasterPhoto(null);
    setMasterPhone('');
    setShowSideMenu(false);
    setAuthError(null);
    setPhoneLoginError(null);
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    const effectiveUid = currentUser?.uid;
    if (!effectiveUid) return;
    let updated: Customer[];
    let savedObj: Customer;
    
    if (customerData.id) {
      // Editing existing
      savedObj = { ...customers.find(c => c.id === customerData.id), ...customerData } as Customer;
      updated = customers.map((c) => (c.id === customerData.id ? savedObj : c));
      if (activeSlip && activeSlip.id === customerData.id) {
        setActiveSlip(savedObj);
      }
    } else {
      // New customer
      savedObj = {
        id: Date.now(),
        name: customerData.name || '',
        phone: customerData.phone || '',
        details: customerData.details || '',
        measurementsObj: customerData.measurementsObj,
        imageUri: customerData.imageUri || null,
        status: customerData.status || 'pending',
        totalAmount: customerData.totalAmount || '',
        advanceAmount: customerData.advanceAmount || '',
        balanceAmount: customerData.balanceAmount || '',
        date: customerData.date || new Date().toLocaleDateString('en-GB'),
        deliveryDate: customerData.deliveryDate || ''
      };
      updated = [savedObj, ...customers];
    }

    setCustomers(updated);
    try {
      localStorage.setItem(`azad_master_customers_${effectiveUid}`, JSON.stringify(updated));
    } catch {}

    setCloudSyncStatus('syncing');
    saveCustomerToFirestore(savedObj).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        setCloudRecordCount(updated.length);
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('synced');
      }
    });
    
    setShowAddModal(false);
    setEditingCustomer(null);
  };

  const handleUpdateStatus = (id: number, status: OrderStatus, e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    const effectiveUid = currentUser?.uid;
    if (!effectiveUid) return;
    
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
    try {
      localStorage.setItem(`azad_master_customers_${effectiveUid}`, JSON.stringify(updated));
    } catch {}
    if (activeSlip && activeSlip.id === id) {
      setActiveSlip({ ...activeSlip, status });
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const effectiveUid = currentUser?.uid;
    if (!effectiveUid) return;
    const confirmMsg = t.deleteConfirm || (isRtl ? 'کیا آپ اس کٹنگ سلپ کو حذف کرنا چاہتے ہیں؟' : 'Delete this slip?');
    if (window.confirm(confirmMsg)) {
      const filtered = customers.filter((item) => item.id !== id);
      setCustomers(filtered);
      try {
        localStorage.setItem(`azad_master_customers_${effectiveUid}`, JSON.stringify(filtered));
      } catch {}
      setCloudSyncStatus('syncing');
      deleteCustomerFromFirestore(id).then((res) => {
        if (res.success) {
          setCloudSyncStatus('synced');
          setCloudRecordCount(filtered.length);
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      });
      if (activeSlip && activeSlip.id === id) setActiveSlip(null);
    }
  };

  const handleUpdateProfile = (name: string, photo: string | null) => {
    setMasterName(name);
    setMasterPhoto(photo);
    const effectiveUid = currentUser?.uid;
    if (effectiveUid) {
      const payload = { name, photo, phone: masterPhone };
      try {
        localStorage.setItem(`azad_master_profile_${effectiveUid}`, JSON.stringify(payload));
      } catch {}
      saveUserProfileToFirestore(payload);
    }
  };

  const handleImportCustomers = (imported: Customer[]) => {
    const effectiveUid = currentUser?.uid;
    if (!Array.isArray(imported) || !effectiveUid) return;
    setCustomers(imported);
    try {
      localStorage.setItem(`azad_master_customers_${effectiveUid}`, JSON.stringify(imported));
    } catch {}
    setCloudSyncStatus('syncing');
    syncAllCustomersToFirestore(imported).then((res) => {
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

  const handleApplyMeasurementsFromAI = (measurements: Partial<CustomerMeasurements>) => {
    setShowChatbot(false);
    const candidateCustomer: Partial<Customer> = {
      name: '',
      phone: '',
      measurementsObj: {
        length: measurements.length || '',
        shoulder: measurements.shoulder || '',
        sleeves: measurements.sleeves || '',
        chest: measurements.chest || '',
        waist: measurements.waist || '',
        daaman: measurements.daaman || '',
        collar: measurements.collar || '',
        shalwar: measurements.shalwar || '',
        pancha: measurements.pancha || '',
        pocket: '1 Front, 1 Side',
        specialNotes: 'Azad AI Voice / Text Naap'
      }
    };
    setEditingCustomer(candidateCustomer as Customer);
    setShowAddModal(true);
  };

  const todayCount = customers.filter(c => isDeliveryToday(c.deliveryDate, c.status)).length;
  const lateCount = customers.filter(c => isDeliveryLate(c.deliveryDate, c.status)).length;

  const statusCounts = {
    all: customers.length,
    pending: customers.filter(c => (c.status || 'pending') === 'pending').length,
    cutting: customers.filter(c => c.status === 'cutting').length,
    stitching: customers.filter(c => c.status === 'stitching').length,
    ready: customers.filter(c => c.status === 'ready').length,
    delivered: customers.filter(c => c.status === 'delivered').length,
  };

  const filteredList = customers.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.phone.includes(searchQuery) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const itemStatus = item.status || 'pending';
    const matchesStatus = selectedStatusFilter === 'all' || itemStatus === selectedStatusFilter;

    const matchesDelivery = 
      selectedDeliveryFilter === 'all' ||
      (selectedDeliveryFilter === 'today' && isDeliveryToday(item.deliveryDate, item.status)) ||
      (selectedDeliveryFilter === 'late' && isDeliveryLate(item.deliveryDate, item.status));

    return matchesSearch && matchesStatus && matchesDelivery;
  });

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

        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-7 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#128c7e]/20">
          
          {/* App Logo & Title */}
          <div className="text-center mb-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2.5 flex items-center justify-center filter drop-shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-[#25d366] to-[#128c7e] shadow-md">
                <img 
                  src="/azad-master-logo.svg" 
                  alt="Azad Master Logo" 
                  className="w-full h-full object-contain rounded-full bg-[#075e54]"
                />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wide">
              {t.appTitle || (isRtl ? 'آزاد ماسٹر' : 'Azad Master')}
            </h1>
            <p className="text-xs text-[#075e54] mt-0.5 font-bold">
              {t.appSubtitle || (isRtl ? 'درزی ماسٹر ڈیجیٹل کلاؤڈ رجسٹر' : 'Professional Tailor Digital Cloud Register')}
            </p>
          </div>

          {/* High Visibility Error Message Display with Recovery Actions */}
          {authError && (
            <div 
              id="auth-error-alert-banner"
              role="alert"
              className="mb-4 p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-900 text-xs flex flex-col gap-2.5 text-left rtl:text-right animate-in fade-in shadow-md"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 animate-pulse" />
                <div className="flex-1 space-y-0.5">
                  <div className="font-extrabold text-rose-950 text-xs">
                    {isRtl ? '⚠️ لاگ ان کا الرٹ' : '⚠️ Sign-in Notice'}
                  </div>
                  <p className="font-semibold text-rose-900 leading-relaxed text-[11.5px] whitespace-pre-wrap break-words">
                    {authError}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200">
                <button
                  type="button"
                  id="error-instant-login-btn"
                  onClick={() => handleInstantLogin()}
                  disabled={isLoadingAuth}
                  className="px-3 py-1.5 bg-[#075e54] hover:bg-[#064e46] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{isRtl ? '⚡ فوری کلاؤڈ داخلہ (بغیر ڈومین کے)' : '⚡ Instant Cloud Login'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs cursor-pointer hover:underline"
                >
                  {isRtl ? 'صاف کریں' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}

          {/* Login Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              id="tab-instant-login"
              onClick={() => { setLoginTab('instant'); setAuthError(null); setPhoneLoginError(null); }}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginTab === 'instant'
                  ? 'bg-white text-[#075e54] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${loginTab === 'instant' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span>{isRtl ? '⚡ فوری داخلہ' : '⚡ Instant Access'}</span>
            </button>
            <button
              type="button"
              id="tab-phone-login"
              onClick={() => { setLoginTab('phone'); setAuthError(null); setPhoneLoginError(null); }}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginTab === 'phone'
                  ? 'bg-white text-[#075e54] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#25d366]" />
              <span>{isRtl ? 'موبائل اور پن' : 'Phone & PIN'}</span>
            </button>
            <button
              type="button"
              id="tab-google-login"
              onClick={() => { setLoginTab('google'); setAuthError(null); setPhoneLoginError(null); }}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginTab === 'google'
                  ? 'bg-white text-[#075e54] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isRtl ? 'گوگل' : 'Google'}</span>
            </button>
          </div>

          {/* TAB 1: INSTANT MASTER CLOUD LOGIN (Bypasses Domain Restrictions 100%) */}
          {loginTab === 'instant' && (
            <form onSubmit={handleInstantLogin} className="space-y-3.5">
              <div className="p-3 bg-emerald-50/90 border border-emerald-300/80 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isRtl ? 'ڈومین کی پابندی کے بغیر براہ راست فائر بیس کلاؤڈ' : 'Direct Cloud Firestore Access (No Domain Whitelist Needed)'}</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {isRtl 
                    ? 'ورسل (Vercel) یا کسی بھی ویب براؤزر پر بغیر کسی رکاوٹ کے فوری لاگ ان کریں اور تمام کسٹمرز کا ناپ کلاؤڈ پر محفوظ رکھیں۔' 
                    : 'Instant 1-click cloud access for Vercel and all browsers. Data syncs directly with Firestore.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ماسٹر صاحب کا نام / دکان کا نام (اختیاری):' : 'Master / Shop Name (Optional):'}
                </label>
                <input
                  type="text"
                  id="instant-login-master-name"
                  value={inputMasterName}
                  onChange={(e) => setInputMasterName(e.target.value)}
                  placeholder={isRtl ? 'مثلاً: آزاد ماسٹر / استاد صاحب' : 'e.g. Master Tailor'}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#075e54] focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'موبائل نمبر (اختیاری):' : 'Mobile Number (Optional):'}
                </label>
                <input
                  type="tel"
                  id="instant-login-phone"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#075e54] focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                id="instant-submit-btn"
                disabled={isLoadingAuth}
                className="w-full bg-gradient-to-r from-[#075e54] via-[#064e46] to-[#128c7e] hover:from-[#064e46] hover:to-[#075e54] active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer select-none"
              >
                {isLoadingAuth ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>{isRtl ? 'کلاؤڈ رجسٹر کھولا جا رہا ہے...' : 'Opening Cloud Register...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                    <span>{isRtl ? '⚡ کلاؤڈ رجسٹر میں داخل ہوں' : '⚡ Open Cloud Register'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: PHONE + PIN LOGIN */}
          {loginTab === 'phone' && (
            <form onSubmit={handlePhonePinSubmit} className="space-y-3.5">
              {phoneLoginError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{phoneLoginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'موبائل نمبر:' : 'Mobile Number:'}
                </label>
                <input
                  type="tel"
                  id="phone-login-input"
                  required
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#075e54] focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? '4 ہندسوں کا پن کوڈ (PIN):' : '4-Digit PIN Code:'}
                </label>
                <input
                  type="password"
                  id="pin-login-input"
                  required
                  maxLength={6}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#075e54] focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-sm tracking-widest outline-none transition-all font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ماسٹر کا نام (اختیاری):' : 'Master Name (Optional):'}
                </label>
                <input
                  type="text"
                  id="phone-login-master-name"
                  value={inputMasterName}
                  onChange={(e) => setInputMasterName(e.target.value)}
                  placeholder={isRtl ? 'ماسٹر صاحب' : 'Master Tailor'}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#075e54] focus:bg-white text-slate-900 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                id="phone-pin-submit-btn"
                disabled={isLoadingAuth}
                className="w-full bg-[#075e54] hover:bg-[#064e46] active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                {isLoadingAuth ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>{isRtl ? 'لاگ ان ہو رہا ہے...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{isRtl ? 'فون اور پن سے لاگ ان کریں' : 'Log In with Phone & PIN'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: GOOGLE AUTH */}
          {loginTab === 'google' && (
            <div className="space-y-3.5">
              {/* Current Domain & Firebase Project Display */}
              <div 
                id="firebase-current-domain-box"
                className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs flex flex-col gap-2 text-left rtl:text-right shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1 text-[11px] text-amber-950 font-bold">
                  <span>
                    {isRtl 
                      ? 'موجودہ ویب سائٹ ڈومین (Authorized Domain):' 
                      : 'Current Website Domain (to Authorize):'}
                  </span>
                  <button
                    type="button"
                    id="copy-domain-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2500);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10.5px] bg-white hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Copy current domain to clipboard"
                  >
                    {copiedDomain ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">{isRtl ? 'کاپی ہو گیا!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-amber-800" />
                        <span>{isRtl ? 'ڈومین کاپی کریں' : 'Copy Domain'}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 font-mono text-[12px] text-slate-900 select-all font-bold break-all flex items-center justify-between">
                  <span className="text-[#075e54] select-all tracking-wide">
                    {typeof window !== 'undefined' ? window.location.hostname : ''}
                  </span>
                </div>

                <p className="text-[10.5px] text-amber-900 leading-normal">
                  {isRtl 
                    ? `اگر فائر بیس پراجیکٹ "${activeFirebaseConfig.projectId}" میں ورسل ڈومین لاک ہے تو اوپر والا '⚡ فوری داخلہ' ٹیب استعمال کریں جس میں ڈومین کی کوئی رکاوٹ نہیں ہوتی۔` 
                    : `If domain whitelisting is locked in Firebase Starter tier, switch to the '⚡ Instant Access' tab above for unrestricted login.`}
                </p>
              </div>

              {/* Primary: Google Sign-in */}
              <button 
                type="button" 
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={isLoadingAuth}
                className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-bold py-3.5 px-4 rounded-xl border border-slate-300 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-3 cursor-pointer select-none"
              >
                {isLoadingAuth ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-[#075e54]" />
                    <span>{t.signingIn || (isRtl ? 'لاگ ان ہو رہا ہے...' : 'Signing in...')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span className="text-sm font-black">{t.signInWithGoogle || (isRtl ? 'Google سے لاگ ان کریں' : 'Sign In with Google')}</span>
                  </>
                )}
              </button>

              {/* Secondary: Google Redirect Button */}
              <button 
                type="button" 
                id="google-redirect-btn"
                onClick={handleGoogleRedirectLogin}
                disabled={isLoadingAuth}
                className="w-full bg-[#f0faf4] hover:bg-[#e1f5ec] active:scale-[0.99] text-[#075e54] font-bold py-2.5 px-4 rounded-xl border border-[#128c7e]/30 shadow-2xs hover:shadow-xs transition-all text-xs flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <LogIn className="w-3.5 h-3.5 text-[#25d366]" />
                <span>{isRtl ? 'Google ری ڈائریکٹ لاگ ان (Redirect Mode)' : 'Sign In with Google (Redirect Mode)'}</span>
              </button>
            </div>
          )}

          {/* New Window Launcher for iFrame / Sandbox */}
          <div className="mt-3.5 text-center">
            <a 
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              id="open-new-window-link"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075e54] hover:text-[#128c7e] hover:underline bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#25d366]" />
              <span>{isRtl ? 'براہ راست نئی ونڈو میں کھولیں' : 'Open directly in New Window'}</span>
            </a>
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
            <span className="text-[#075e54] font-medium text-[11px]">Azad Master v2.0</span>
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
        
        {/* Top WhatsApp Green Header - Fixed / Sticky */}
        <header 
          id="main-header"
          className="bg-[#075e54] text-white px-4 py-2.5 flex items-center justify-between shrink-0 relative shadow-md z-30" 
          dir="ltr"
        >
          {/* Left Side: 4-Line Menu Button & Circular Brand Logo & App Title & Dynamic Tailor Name */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <button 
              id="menu-btn"
              onClick={() => setShowSideMenu(!showSideMenu)} 
              className="p-1.5 text-white hover:bg-white/15 active:bg-white/25 rounded-lg cursor-pointer transition-all active:scale-95 shrink-0"
              aria-label="Side Navigation Menu"
              title="Menu"
            >
              {/* 4-Line Navigation Menu Icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 10h16M4 15h16M4 20h16" />
              </svg>
            </button>
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-xs">
              {masterPhoto ? (
                <img src={masterPhoto} alt="Tailor" className="w-full h-full object-cover" />
              ) : (
                <img src="/azad-master-logo.svg" alt="Azad Master Logo" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base sm:text-lg tracking-wider text-white m-0 select-none drop-shadow-xs leading-none">
                AZAD MASTER
              </span>
              <span 
                id="header-tailor-greeting"
                className="text-[10px] sm:text-[11px] font-medium text-[#dcf8c6] truncate max-w-[130px] sm:max-w-[200px] leading-tight mt-0.5 flex items-center gap-1"
                title={effectiveTailorName}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] shrink-0" />
                <span className="truncate">{effectiveTailorName}</span>
              </span>
            </div>
          </div>

          {/* Right Side: Quick AI Chatbot Button & CustomDrawerMenu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="header-ai-assistant-btn"
              type="button"
              onClick={() => setShowChatbot(true)}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={t.navAssistant}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#25d366]" />
              <span className="hidden sm:inline text-[11px] font-semibold text-[#dcf8c6]">
                {t.navAssistant}
              </span>
            </button>
          </div>

          {/* CustomDrawerMenu Anchored Directly to Header */}
          <CustomDrawerMenu
            visible={showSideMenu}
            onClose={() => setShowSideMenu(false)}
            onNavigate={(route) => {
              if (route === 'Profile') {
                setShowSettings(true);
              } else if (route === 'Backup') {
                handleManualCloudSync();
              } else if (route === 'Help') {
                setShowAppGuide(true);
              }
            }}
            onLogout={handleLogout}
            currentLang={currentLang}
            onChangeLanguage={changeLanguage}
            masterName={effectiveTailorName}
            userPhone={masterPhone || currentUser?.phoneNumber || undefined}
            isRtl={isRtl}
          />
        </header>

        {/* Sticky Top Controls Section (Search Bar immediately under Green Header, followed by Filters) */}
        <div 
          id="sticky-top-container" 
          className="bg-white shrink-0 z-20 shadow-xs border-b border-slate-200"
        >
          {/* 1. TOP SECTION: Search Bar immediately below Green Header */}
          <div 
            id="search-bar-section"
            className="p-2 sm:px-3 bg-white border-b border-slate-100"
          >
            <CustomerSearchComponent
              customers={customers}
              searchQuery={searchQuery}
              onSearchChange={(text) => setSearchQuery(text)}
              onSearchSubmit={(q) => commitSearchHistory(q)}
              onSelectCustomer={(cust) => {
                commitSearchHistory(cust.name || cust.phone);
                setActiveSlip(cust);
              }}
              onAddNewCustomer={(_q) => {
                setEditingCustomer(null);
                setShowAddModal(true);
              }}
              searchHistory={searchHistory}
              onClearHistory={clearAllSearchHistory}
              onRemoveHistoryItem={removeSearchHistoryItem}
              showSearchButton={true}
              placeholder={t.searchPlaceholder}
              isRtl={isRtl}
              translations={t}
            />
          </div>

          {/* 2. SUB-SECTION: Clean Filter & Action Buttons Layout */}
          <div id="filter-actions-section" className="p-2 sm:px-3 pt-1.5 space-y-2 bg-white">
            {/* SlimSummaryHeader (ٹوڈے ڈیلیوری اور لیٹ آرڈرز کی باریک پٹی) */}
            <SlimSummaryHeader
              todayCount={todayCount}
              lateCount={lateCount}
              onTodayPress={() => {
                setSelectedDeliveryFilter(prev => prev === 'today' ? 'all' : 'today');
              }}
              onLatePress={() => {
                setSelectedDeliveryFilter(prev => prev === 'late' ? 'all' : 'late');
              }}
              isTodayActive={selectedDeliveryFilter === 'today'}
              isLateActive={selectedDeliveryFilter === 'late'}
              isRtl={isRtl}
              translations={t}
            />

            {/* Order Tracking & Status Filter Chips */}
            <div id="order-tracking-filters" className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#54656f] px-0.5">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="text-[#075e54]">⏱</span>
                  <span>{t.orderStatusFilters}</span>
                </span>
                <span className="text-[10px] text-[#075e54] font-bold bg-[#e7f7ef] border border-[#128c7e]/25 px-1.5 py-0.5 rounded">
                  {t.showing}: {filteredList.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar text-xs scroll-smooth">
                {/* All Filter */}
                <button
                  id="filter-status-all"
                  type="button"
                  onClick={() => {
                    setSelectedStatusFilter('all');
                    setSelectedDeliveryFilter('all');
                  }}
                  className={`h-7 sm:h-7.5 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0 active:scale-95 ${
                    selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                      ? 'bg-[#075e54] text-white border-[#075e54] shadow-xs ring-1 ring-[#128c7e]/30'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-[#e7f7ef] hover:border-[#128c7e]/30'
                  }`}
                >
                  <span>📋 {t.allFilter}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                    selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {statusCounts.all}
                  </span>
                </button>

                {/* Status Chips */}
                {ORDER_STATUS_LIST.map((stKey) => {
                  const meta = getStatusMeta(stKey);
                  const isSelected = selectedStatusFilter === stKey && selectedDeliveryFilter === 'all';
                  const count = statusCounts[stKey] || 0;
                  return (
                    <button
                      key={stKey}
                      id={`filter-status-${stKey}`}
                      type="button"
                      onClick={() => {
                        setSelectedStatusFilter(stKey);
                        setSelectedDeliveryFilter('all');
                      }}
                      className={`h-7 sm:h-7.5 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0 active:scale-95 ${
                        isSelected
                          ? `${meta.badgeClass} ring-1 ring-black/20 shadow-xs scale-102`
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{meta.icon} {getLocalizedStatusLabel(stKey, t)}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isSelected ? 'bg-black/15 text-inherit' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Buttons Row: Add Measurement & Paper Slip Camera Scan */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                id="btn-quick-add-slip"
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setShowAddModal(true);
                }}
                className="py-2 px-3 bg-[#075e54] hover:bg-[#054c44] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="text-sm font-black">+</span>
                <span>{t.addMeasurementBtn}</span>
              </button>

              <button
                id="btn-quick-camera-slip"
                type="button"
                onClick={() => setShowImageSourceModal(true)}
                className="py-2 px-3 bg-[#128c7e] hover:bg-[#0f766a] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>📸</span>
                <span>{t.photoOcrBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Customer Slips List */}
        <main 
          id="scrollable-customers-container"
          className="flex-1 overflow-y-auto p-2 sm:px-3 pb-24 bg-[#efeae2]/40"
        >
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

                return (
                  <div
                    key={customer.id}
                    id={`customer-card-${customer.id}`}
                    onClick={() => setActiveSlip(customer)}
                    className="bg-white rounded-xl p-3 shadow-xs hover:shadow-md transition-all border border-slate-200/80 cursor-pointer active:scale-[0.99] relative overflow-hidden group"
                  >
                    {/* Status Top Indicator Bar */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#e7f7ef] text-[#075e54] flex items-center justify-center font-black text-sm shrink-0 border border-[#128c7e]/20">
                          {customer.name ? customer.name.trim().charAt(0) : '👤'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#075e54] transition-colors">
                            {customer.name || t.unnamedCustomer}
                          </h4>
                          <p className="text-[11px] text-[#54656f] font-mono flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3 text-[#25d366]" />
                            <span>{customer.phone || 'No phone'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Chip */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusMeta.badgeClass}`}>
                        <span>{statusMeta.icon}</span>
                        <span>{getLocalizedStatusLabel(customer.status || 'pending', t)}</span>
                      </span>
                    </div>

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

        {/* Bottom Ergonomic Navigation Bar */}
        <div 
          id="bottom-nav-bar"
          className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 px-3 sm:px-5 flex items-center justify-between shrink-0 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none"
        >
          {/* Home Button */}
          <button 
            id="nav-home-btn"
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const container = document.getElementById('scrollable-customers-container');
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#e7f7ef] text-[#075e54] hover:text-[#054c44] text-xs font-bold cursor-pointer transition-all active:scale-95 border border-slate-200/80 shadow-2xs"
            title={t.navHome}
          >
            <span className="text-base leading-none">🏠</span>
            <span className="tracking-wide hidden min-[375px]:inline">{t.navHome}</span>
          </button>

          {/* AI Assistant Quick Button */}
          <button
            id="nav-chatbot-btn"
            type="button"
            onClick={() => setShowChatbot(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e7f7ef] hover:bg-[#d5f0e3] text-[#075e54] text-xs font-bold cursor-pointer transition-all active:scale-95 border border-[#128c7e]/30 shadow-2xs group"
            title={t.navAssistant}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-amber-400/60 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
              <img src="/azad-master-logo.svg" alt="AI" className="w-full h-full object-contain" />
            </div>
            <span className="tracking-wide text-[11.5px] font-bold">{t.navAssistant}</span>
          </button>

          {/* Plus Action Button */}
          <button 
            id="nav-add-btn"
            type="button"
            onClick={() => setShowImageSourceModal(prev => !prev)} 
            className="azad-glow-btn glow-emerald flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-[#075e54] hover:bg-[#054c44] text-white rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer font-bold text-xs sm:text-sm"
            title={t.navAddMeasurement}
          >
            <span className="text-lg font-black leading-none">+</span>
            <span>{t.navAddMeasurement}</span>
          </button>
        </div>

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
            onOpenAiAssistant={() => setShowChatbot(true)}
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

        {showChatbot && (
          <ChatbotModal
            onClose={() => setShowChatbot(false)}
            translations={t}
            isRtl={isRtl}
            currentLang={currentLang}
            onApplyMeasurements={handleApplyMeasurementsFromAI}
            masterName={effectiveTailorName}
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
            onOpenAiAssistant={() => setShowChatbot(true)}
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
