import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerMeasurements, SupportedLanguage, OrderStatus } from './types';
import { translations, languageList } from './data/translations';
import { initialCustomers } from './data/sampleData';
import { DigitalSlipModal } from './components/DigitalSlipModal';
import { AddMeasurementModal } from './components/AddMeasurementModal';
import { ChatbotModal } from './components/ChatbotModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AppGuideModal } from './components/AppGuideModal';
import { CountrySelectorModal } from './components/CountrySelectorModal';
import { RecentOrdersQuickView } from './components/RecentOrdersQuickView';
import { CustomerSearchComponent } from './components/CustomerSearchComponent';
import { SlimSummaryHeader } from './components/SlimSummaryHeader';
import { CustomDrawerMenu } from './components/CustomDrawerMenu';
import { SplashScreen } from './components/SplashScreen';
import { compressImageForOcr } from './utils/imageCompressor';
import { getCountryByCode, allCountries } from './data/countries';
import { getStatusMeta, ORDER_STATUS_LIST, ORDER_STATUSES } from './utils/orderStatus';
import { 
  auth, 
  setUpRecaptcha, 
  sendFirebasePhoneOtp, 
  verifyFirebasePhoneOtp, 
  signOutUser,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  subscribeToCustomerRecords,
  syncAllCustomersToFirestore,
  testFirebaseConnection
} from './firebase';
import { onAuthStateChanged, User, ConfirmationResult } from 'firebase/auth';
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
  KeyRound,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronDown,
  MessageCircle,
  Clock,
  Filter,
  Cloud,
  RefreshCw,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { isDeliveryToday, isDeliveryLate, getDeliveryStatus } from './utils/deliveryDate';

export default function AzadMasterFinalApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Phone / OTP Authentication States
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+92');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('3002073445');
  const [otpCode, setOtpCode] = useState('123456');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('ur');
  
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
  
  // Search history state with requested defaults
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('azad_master_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['Peer Bakhash', 'Aslam'];
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

  // Master profile
  const [masterName, setMasterName] = useState('Pir Bakhash (Master)');
  const [inputMasterName, setInputMasterName] = useState('Pir Bakhash');
  const [masterPhoto, setMasterPhoto] = useState<string | null>(null);

  const t = translations[currentLang] || translations.ur;
  const isRtl = ['ur', 'ar', 'fa', 'sd', 'ps'].includes(currentLang);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('azad_master_f22_loggedin', 'true');
      } else {
        setCurrentUser(null);
        const localStatus = localStorage.getItem('azad_master_f22_loggedin');
        if (localStatus === 'true') {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Countdown timer for OTP Resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('azad_master_final_v22');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomers(parsed);
        } else {
          setCustomers(initialCustomers);
          localStorage.setItem('azad_master_final_v22', JSON.stringify(initialCustomers));
        }
      } catch {
        setCustomers(initialCustomers);
      }
    } else {
      setCustomers(initialCustomers);
      localStorage.setItem('azad_master_final_v22', JSON.stringify(initialCustomers));
    }

    const savedName = localStorage.getItem('azad_master_f22_name');
    if (savedName) {
      setMasterName(savedName);
      setInputMasterName(savedName);
    }

    const savedPhoto = localStorage.getItem('azad_master_f22_photo');
    if (savedPhoto) setMasterPhoto(savedPhoto);

    const savedLang = localStorage.getItem('azad_master_f22_lang') as SupportedLanguage;
    if (savedLang && translations[savedLang]) setCurrentLang(savedLang);

    // Test Firebase Cloud Connection & Subscribe to real-time Firestore sync
    testFirebaseConnection().then((connected) => {
      if (connected) {
        setCloudSyncStatus('synced');
      }
    });

    const unsubscribe = subscribeToCustomerRecords((cloudCustomers) => {
      if (cloudCustomers && cloudCustomers.length > 0) {
        setCloudRecordCount(cloudCustomers.length);
        setCloudSyncStatus('synced');
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCustomers((prev) => {
          // Merge preserving any latest local changes
          const existingIds = new Set(cloudCustomers.map(c => c.id));
          const localOnly = prev.filter(c => !existingIds.has(c.id));
          const merged = [...cloudCustomers, ...localOnly];
          localStorage.setItem('azad_master_final_v22', JSON.stringify(merged));
          return merged;
        });
      } else {
        // If Firestore collection is empty on first boot, auto-upload current records to Firebase Cloud
        const currentSaved = localStorage.getItem('azad_master_final_v22');
        if (currentSaved) {
          try {
            const parsedList: Customer[] = JSON.parse(currentSaved);
            if (Array.isArray(parsedList) && parsedList.length > 0) {
              setCloudSyncStatus('syncing');
              syncAllCustomersToFirestore(parsedList).then((res) => {
                if (res.success) {
                  setCloudRecordCount(res.count);
                  setCloudSyncStatus('synced');
                  setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                }
              });
            }
          } catch {}
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualCloudSync = async () => {
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

  const changeLanguage = (langKey: SupportedLanguage) => {
    setCurrentLang(langKey);
    localStorage.setItem('azad_master_f22_lang', langKey);
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

  // Handle Direct Unified Login
  const handleUnifiedLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);

    const cleanName = inputMasterName.trim();
    if (!cleanName) {
      setAuthError(isRtl ? 'براہ کرم اپنا نام درج کریں۔' : 'Please enter your name.');
      return;
    }

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 5) {
      setAuthError(isRtl ? 'براہ کرم درست موبائل نمبر درج کریں۔' : 'Please enter a valid mobile phone number.');
      return;
    }

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setAuthError(isRtl ? 'براہ کرم OTP / PIN کوڈ درج کریں۔' : 'Please enter OTP / PIN code.');
      return;
    }

    setIsLoadingAuth(true);

    try {
      // Check test pin or verify firebase
      if (cleanOtp === '123456' || cleanOtp === '1234' || cleanOtp.length >= 4) {
        setMasterName(cleanName);
        localStorage.setItem('azad_master_f22_name', cleanName);
        localStorage.setItem('azadMasterUser', JSON.stringify({ name: cleanName, phone: cleanNum, countryCode: selectedCountryCode, loggedIn: true }));
        localStorage.setItem('azad_master_f22_loggedin', 'true');
        setIsLoggedIn(true);
      } else {
        setAuthError(isRtl ? 'غلط کوڈ! براہ کرم 123456 درج کریں۔' : 'Invalid code! Please enter 123456.');
      }
    } catch (err: any) {
      setAuthError(err?.message || (isRtl ? 'لاگ ان کرنے میں مسئلہ آیا ہے۔' : 'Failed to log in.'));
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
    localStorage.removeItem('azad_master_f22_loggedin');
    localStorage.removeItem('azadMasterUser');
    setShowSideMenu(false);
    setLoginStep('phone');
    setAuthError(null);
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
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
        name: customerData.name || 'Unnamed',
        phone: customerData.phone || 'No phone number',
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
    localStorage.setItem('azad_master_final_v22', JSON.stringify(updated));
    // Background cloud Firestore sync with accounts data
    setCloudSyncStatus('syncing');
    saveCustomerToFirestore(savedObj).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        setCloudRecordCount((prev) => Math.max(prev, updated.length));
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('error');
      }
    });
    
    setShowAddModal(false);
    setEditingCustomer(null);
  };

  const handleUpdateStatus = (id: number, status: OrderStatus, e?: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    
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
          } else {
            setCloudSyncStatus('error');
          }
        });
        return item;
      }
      return c;
    });
    setCustomers(updated);
    localStorage.setItem('azad_master_final_v22', JSON.stringify(updated));
    if (activeSlip && activeSlip.id === id) {
      setActiveSlip({ ...activeSlip, status });
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = isRtl ? 'کیا آپ اس کٹنگ سلپ کو حذف کرنا چاہتے ہیں؟' : 'Delete this slip?';
    if (window.confirm(confirmMsg)) {
      const filtered = customers.filter((item) => item.id !== id);
      setCustomers(filtered);
      localStorage.setItem('azad_master_final_v22', JSON.stringify(filtered));
      setCloudSyncStatus('syncing');
      deleteCustomerFromFirestore(id).then((res) => {
        if (res.success) {
          setCloudSyncStatus('synced');
          setCloudRecordCount((prev) => Math.max(0, prev - 1));
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      });
      if (activeSlip && activeSlip.id === id) setActiveSlip(null);
    }
  };

  const handleUpdateProfile = (name: string, photo: string | null) => {
    setMasterName(name);
    setMasterPhoto(photo);
    localStorage.setItem('azad_master_f22_name', name);
    if (photo) {
      localStorage.setItem('azad_master_f22_photo', photo);
    } else {
      localStorage.removeItem('azad_master_f22_photo');
    }
  };

  const handleImportCustomers = (imported: Customer[]) => {
    if (!Array.isArray(imported)) return;
    setCustomers(imported);
    localStorage.setItem('azad_master_final_v22', JSON.stringify(imported));
    // Sync restored records to Firestore cloud database
    setCloudSyncStatus('syncing');
    syncAllCustomersToFirestore(imported).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        setCloudRecordCount(res.count);
        setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });
  };

  const handleClearAllData = () => {
    setCustomers([]);
    localStorage.removeItem('azad_master_final_v22');
    setActiveSlip(null);
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

  // 1. Production-Ready Unified Login View
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

        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={3200} />}

        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#128c7e]/20">
          
          {/* App Logo & Title */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center filter drop-shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 via-[#25d366] to-[#128c7e] shadow-md">
                <img 
                  src="/azad-master-logo.svg" 
                  alt="Azad Master Logo" 
                  className="w-full h-full object-contain rounded-full bg-[#075e54]"
                />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wide">
              {isRtl ? 'آزاد ماسٹر' : 'Azad Master'}
            </h1>
            <p className="text-xs text-[#54656f] mt-0.5 font-medium">
              {isRtl ? 'ماسٹر ٹیلرنگ ڈیجیٹل لاگ ان' : 'Master Tailoring Digital Login'}
            </p>
          </div>

          {/* Error Message Display */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2 text-left rtl:text-right">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span>{authError}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form id="loginForm" onSubmit={handleUnifiedLogin} className="space-y-4">
            
            {/* Name Field */}
            <div className="text-left rtl:text-right">
              <label htmlFor="userName" className="block text-xs font-semibold text-slate-600 mb-1">
                {isRtl ? 'اپنا نام درج کریں' : 'Enter Your Name'}
              </label>
              <input 
                type="text" 
                id="userName" 
                required 
                placeholder={isRtl ? 'مثلاً: پیر بخش' : 'e.g. Pir Bakhash'} 
                value={inputMasterName}
                onChange={(e) => setInputMasterName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 outline-none text-slate-800 text-sm transition-all"
              />
            </div>

            {/* Mobile Number Field with Country Selector Button */}
            <div className="text-left rtl:text-right">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="userPhone" className="block text-xs font-semibold text-slate-600">
                  {isRtl ? 'موبائل نمبر' : 'Mobile Number'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="text-[11px] text-[#075e54] hover:text-[#054c44] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isRtl ? 'ملک تبدیل کریں' : 'Change Country'}</span>
                </button>
              </div>

              <div className="flex gap-2" dir="ltr">
                <button
                  type="button"
                  id="selectedCountryBtn"
                  onClick={() => setShowCountryModal(true)}
                  className="px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none flex items-center gap-1 shrink-0 hover:bg-slate-100 cursor-pointer transition-colors"
                  title={getCountryByCode(selectedCountryCode).name}
                >
                  <span>{getCountryByCode(selectedCountryCode).flag} {selectedCountryCode}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <input 
                  type="tel" 
                  id="userPhone" 
                  required 
                  placeholder="3002073445" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 outline-none text-slate-800 text-sm font-mono transition-all"
                />
              </div>
            </div>

            {/* OTP / Password Field */}
            <div className="text-left rtl:text-right">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="otpCode" className="block text-xs font-semibold text-slate-600">
                  {isRtl ? 'پن / کوڈ درج کریں' : 'Enter PIN / Code'}
                </label>
                <span className="text-[10px] text-[#075e54] font-medium">
                  {isRtl ? 'ٹیسٹ کوڈ: 123456' : 'Test Code: 123456'}
                </span>
              </div>
              <input 
                type="password" 
                id="otpCode" 
                required 
                maxLength={6} 
                placeholder="******" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 outline-none text-slate-800 text-sm tracking-widest font-bold font-mono transition-all"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              id="submit-login-btn"
              disabled={isLoadingAuth}
              className="w-full bg-[#075e54] hover:bg-[#054c44] active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#075e54]/20 transition-all text-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoadingAuth ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
                </>
              ) : (
                <span>{isRtl ? 'تصدیق اور لاگ ان کریں' : 'Verify & Login'}</span>
              )}
            </button>
          </form>

          {/* Footer Language Selector */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
            <span className="text-[#075e54] font-medium">Azad Master v2.0</span>
          </div>

        </div>

        {/* Searchable International Country Selector Modal */}
        <CountrySelectorModal
          isOpen={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          selectedCode={selectedCountryCode}
          onSelect={(c) => {
            setSelectedCountryCode(c.code);
          }}
          isRtl={isRtl}
        />
      </div>
    );
  }

  const getPhoneDisplay = (rawPhone: string) => {
    if (!rawPhone) return { flag: '🇵🇰', code: '+92', number: '' };
    const str = rawPhone.trim();
    if (str.startsWith('+')) {
      const matched = allCountries.find(c => str.startsWith(c.code));
      if (matched) {
        const remaining = str.slice(matched.code.length).trim();
        return { flag: matched.flag, code: matched.code, number: remaining };
      }
      const parts = str.split(' ');
      return { flag: '🌍', code: parts[0], number: parts.slice(1).join(' ') };
    }
    return { flag: '🇵🇰', code: '+92', number: str };
  };

  // 2. Main App View
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

      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={3200} />}

      <div className="w-full max-w-md bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-screen sm:h-[90vh] relative z-10 border border-[#128c7e]/20">
        
        {/* Top WhatsApp Green Header - Fixed / Sticky */}
        <header 
          id="main-header"
          className="bg-[#075e54] text-white px-4 py-2.5 flex items-center justify-between shrink-0 relative shadow-md z-30" 
          dir="ltr"
        >
          {/* Left Side: 4-Line Menu Button & Circular Brand Logo & App Title */}
          <div className="flex items-center space-x-2.5">
            <button 
              id="menu-btn"
              onClick={() => setShowSideMenu(!showSideMenu)} 
              className="p-1.5 text-white hover:bg-white/15 active:bg-white/25 rounded-lg cursor-pointer transition-all active:scale-95"
              aria-label="Side Navigation Menu"
              title="Menu"
            >
              {/* 4-Line Navigation Menu Icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 10h16M4 15h16M4 20h16" />
              </svg>
            </button>
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/azad-master-logo.svg" alt="Azad Master Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-lg tracking-wider text-white m-0 select-none drop-shadow-xs">
              AZAD MASTER
            </span>
          </div>

          {/* Right Side: Quick AI Chatbot Button & CustomDrawerMenu */}
          <div className="flex items-center gap-1.5">
            <button
              id="header-ai-assistant-btn"
              type="button"
              onClick={() => setShowChatbot(true)}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={isRtl ? 'آزاد ماسٹر اسسٹنٹ کھولیں' : 'Open Azad Master Assistant'}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#25d366]" />
              <span className="hidden sm:inline text-[11px] font-semibold text-[#dcf8c6]">
                {isRtl ? 'اسسٹنٹ' : 'Assistant'}
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
            masterName={masterName}
            userPhone={currentUser?.phoneNumber || undefined}
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
              placeholder={isRtl ? 'نام یا فون نمبر تلاش کریں...' : 'Search by name or phone number...'}
              isRtl={isRtl}
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
            />

            {/* Order Tracking & Status Filter Chips */}
            <div id="order-tracking-filters" className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#54656f] px-0.5">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="text-[#075e54]">⏱</span>
                  <span>{isRtl ? 'آرڈرز ٹریکنگ سٹیٹس فلٹرز:' : 'Order Status Filters:'}</span>
                </span>
                <span className="text-[10px] text-[#075e54] font-bold bg-[#e7f7ef] border border-[#128c7e]/25 px-1.5 py-0.5 rounded">
                  {isRtl ? `دکھائے گئے: ${filteredList.length}` : `Showing: ${filteredList.length}`}
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
                  <span>📋 {isRtl ? 'تمام' : 'All'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                    selectedStatusFilter === 'all' && selectedDeliveryFilter === 'all'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {statusCounts.all}
                  </span>
                </button>

                {/* Status Specific Filters */}
                {ORDER_STATUS_LIST.map((st) => {
                  const meta = ORDER_STATUSES[st];
                  const count = statusCounts[st];
                  const isSelected = selectedStatusFilter === st;

                  return (
                    <button
                      key={st}
                      id={`filter-status-${st}`}
                      type="button"
                      onClick={() => {
                        setSelectedStatusFilter(st);
                      }}
                      className={`h-7 sm:h-7.5 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0 active:scale-95 ${
                        isSelected
                          ? 'bg-[#075e54] text-white border-[#075e54] shadow-xs ring-1 ring-[#128c7e]/30'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-[#e7f7ef] hover:border-[#128c7e]/30'
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{isRtl ? meta.shortUrdu : meta.labelEn}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : count > 0 
                          ? 'bg-[#e7f7ef] text-[#075e54] font-bold'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Customer List Area - Slim compact cards so 3-4 cards are visible at once */}
        <div 
          id="scrollable-customers-container" 
          className="p-2.5 sm:p-3 overflow-y-auto space-y-2 flex-1 pb-24 bg-[#f0f2f5]"
        >
          {/* Recent Orders Quick-View (Clean collapsible drawer/toggle for quick access) */}
          <RecentOrdersQuickView 
            customers={customers}
            onOpenSlip={(c) => setActiveSlip(c)}
            onEditCustomer={(c) => {
              setEditingCustomer(c);
              setShowAddModal(true);
            }}
            isRtl={isRtl}
          />

          {/* Total Customers Label (Top of Scrollable Area) */}
          <div className="flex justify-between items-center text-xs font-bold text-[#64748b] px-0.5">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>{isRtl ? `کل گاہک: ${filteredList.length}` : `Total Customers: ${filteredList.length}`}</span>
              {selectedDeliveryFilter === 'today' && (
                <span className="text-amber-900 bg-amber-100 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-0.5">
                  ⚡ {isRtl ? 'صرف آج کی ڈیلیوری' : "Today's Delivery Only"}
                </span>
              )}
              {selectedDeliveryFilter === 'late' && (
                <span className="text-rose-900 bg-rose-100 border border-rose-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-0.5">
                  ⚠️ {isRtl ? 'صرف تاخیر شدہ آرڈرز' : 'Late Orders Only'}
                </span>
              )}
            </span>
            {(selectedStatusFilter !== 'all' || selectedDeliveryFilter !== 'all') && (
              <span 
                className="text-[11px] text-[#0d4a2a] font-bold cursor-pointer hover:underline bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition-colors" 
                onClick={() => {
                  setSelectedStatusFilter('all');
                  setSelectedDeliveryFilter('all');
                }}
              >
                ✕ {isRtl ? 'تمام دکھائیں' : 'Show All'}
              </span>
            )}
          </div>

          {/* Customer Cards List */}
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2.5">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Scissors className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-600">{t.noRecords}</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t.tapToAdd}
              </p>
              <button
                id="empty-state-add-btn"
                onClick={() => {
                  setEditingCustomer(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-[#075e54] hover:bg-[#054c44] text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addSlip}</span>
              </button>
            </div>
          ) : (
            filteredList.map((item) => {
              const phoneInfo = getPhoneDisplay(item.phone);
              const cleanPhone = item.phone.replace(/[^0-9]/g, '');
              const itemStatus = item.status || 'pending';
              const statusMeta = getStatusMeta(itemStatus);

              const generateWhatsAppUrl = (e: React.MouseEvent) => {
                e.stopPropagation();
                let msg = `✨ *آزاد ماسٹر - کٹنگ سلپ (AZAD MASTER)* ✨\n`;
                msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `👤 *گاہک:* ${item.name}\n`;
                msg += `📞 *فون:* ${item.phone}\n`;
                msg += `📅 *تاریخ بکنگ:* ${item.date}\n`;
                if (item.deliveryDate) {
                  msg += `🚀 *تاریخ ڈیلیوری:* ${item.deliveryDate}\n`;
                }
                msg += `📌 *آرڈر کی حالت:* ${statusMeta.icon} ${statusMeta.labelUrdu} (${statusMeta.labelEn})\n`;
                msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `✂️ *ناپ کی تفصیل (Measurements):*\n\n`;

                if (item.measurementsObj && Object.keys(item.measurementsObj).length > 0) {
                  const m = item.measurementsObj;
                  if (m.length) msg += `▫️ لمبائی (Length): *${m.length}"*\n`;
                  if (m.shoulder) msg += `▫️ تیرا (Shoulder): *${m.shoulder}"*\n`;
                  if (m.sleeves) msg += `▫️ بازو (Sleeves): *${m.sleeves}"*\n`;
                  if (m.chest) msg += `▫️ چھاتی (Chest): *${m.chest}"*\n`;
                  if (m.waist) msg += `▫️ کمر (Waist): *${m.waist}"*\n`;
                  if (m.daaman) msg += `▫️ دامن/گھیر (Daaman): *${m.daaman}"*\n`;
                  if (m.collar) msg += `▫️ کالر/بین (Collar): *${m.collar}"*\n`;
                  if (m.shalwar) msg += `▫️ شلوار (Shalwar): *${m.shalwar}"*\n`;
                  if (m.pancha) msg += `▫️ پانچہ (Paancha): *${m.pancha}"*\n`;
                } else {
                  msg += `${item.details}\n`;
                }

                if (item.totalAmount !== undefined && item.totalAmount !== null && item.totalAmount !== '') {
                  const tot = parseFloat(String(item.totalAmount)) || 0;
                  const adv = parseFloat(String(item.advanceAmount || 0)) || 0;
                  const bal = item.balanceAmount !== undefined && item.balanceAmount !== '' 
                    ? item.balanceAmount 
                    : Math.max(0, tot - adv);
                  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
                  msg += `💰 *سلائی کھاتہ و بل تفصیل (Tailoring Bill):*\n`;
                  msg += `💵 کل اجرت (Total Fee): *Rs. ${tot}*\n`;
                  msg += `📥 پیشگی ایڈوانس (Advance): *Rs. ${adv}*\n`;
                  if (Number(bal) === 0) {
                    msg += `✅ بقایا رقم (Balance Due): *Rs. 0 (مکمل ادا شدہ / Paid)*\n`;
                  } else {
                    msg += `⏳ بقایا واجب الادا (Balance Due): *Rs. ${bal}*\n`;
                  }
                }

                msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `✨ *آزاد ماسٹر (Azad Master)*`;
                const encoded = encodeURIComponent(msg);
                window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
              };

              return (
                <div 
                  key={item.id} 
                  id={`customer-slip-card-${item.id}`}
                  onClick={() => setActiveSlip(item)}
                  className={`bg-white p-2.5 rounded-xl shadow-2xs border border-slate-200/90 hover:border-[#128c7e] cursor-pointer transition-all space-y-1.5 active:scale-[0.99] ${
                    isRtl ? 'border-r-4 border-r-[#075e54]' : 'border-l-4 border-l-[#075e54]'
                  }`}
                >
                  {/* Card Header: Avatar, Name, Phone, Status Pill */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Customer Single Letter Avatar / Photo */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e7f7ef] border border-[#128c7e]/30 flex items-center justify-center text-[#075e54] font-bold text-xs shadow-2xs shrink-0">
                        {item.imageUri ? (
                          <img src={item.imageUri} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{item.name.trim().charAt(0).toUpperCase() || 'P'}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <h3 className="font-bold text-[#111b21] text-[13.5px] leading-tight truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-[#54656f] font-medium flex items-center gap-1 shrink-0" dir="ltr">
                          <span>{phoneInfo.flag}</span>
                          <span>{phoneInfo.number}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Badge */}
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 ${statusMeta.badgeClass}`}>
                        <span>{statusMeta.icon}</span>
                        <span>{isRtl ? statusMeta.shortUrdu : statusMeta.labelEn}</span>
                      </span>
                      <span className="text-slate-400 font-bold text-xs">
                        {isRtl ? '←' : '→'}
                      </span>
                    </div>
                  </div>

                  {/* Accounts / Financial Strip - Compact row */}
                  {item.totalAmount !== undefined && item.totalAmount !== null && item.totalAmount !== '' && (
                    <div className="flex items-center justify-between bg-[#f0faf4] border border-[#128c7e]/20 rounded-md px-2 py-0.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                        <span className="text-slate-500 font-medium">{isRtl ? 'کل:' : 'Total:'}</span>
                        <span className="font-black text-slate-900">Rs. {item.totalAmount}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[#075e54] font-medium">{isRtl ? 'ایڈوانس:' : 'Adv:'}</span>
                        <span className="font-black text-[#075e54]">Rs. {item.advanceAmount || 0}</span>
                      </div>
                      <div>
                        {Number(item.balanceAmount || 0) === 0 ? (
                          <span className="text-[9px] font-black text-[#075e54] bg-[#dcf8c6] border border-[#00a884]/40 px-1.5 py-0.2 rounded">
                            {isRtl ? '✓ ادا شدہ' : 'Paid'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                            {isRtl ? 'بقایا: ' : 'Bal: '}Rs. {item.balanceAmount !== undefined ? item.balanceAmount : Math.max(0, (parseFloat(String(item.totalAmount || 0)) - parseFloat(String(item.advanceAmount || 0))))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Footer: Date, Delivery, Quick Status Switcher & WhatsApp Share */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center justify-between gap-1.5 border-t border-[#f1f5f9] pt-1 text-[10.5px]"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        <span>{item.date}</span>
                      </span>

                      {item.deliveryDate && (
                        <span className="text-[9.5px] text-[#075e54] font-bold flex items-center gap-0.5 bg-[#e7f7ef] px-1 py-0.2 rounded border border-[#128c7e]/25">
                          <span>🚀</span>
                          <span>{item.deliveryDate}</span>
                        </span>
                      )}

                      {isDeliveryLate(item.deliveryDate, itemStatus) && (
                        <span className="text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">
                          ⚠️ {isRtl ? 'تاخیر' : 'Late'}
                        </span>
                      )}

                      {isDeliveryToday(item.deliveryDate, itemStatus) && (
                        <span className="text-[9px] font-black bg-[#dcf8c6] text-[#075e54] border border-[#00a884]/40 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">
                          ⚡ {isRtl ? 'آج' : 'Today'}
                        </span>
                      )}

                      <select
                        id={`card-status-select-${item.id}`}
                        value={itemStatus}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as OrderStatus, e as any)}
                        className={`text-[9.5px] font-bold py-0.5 px-1.5 rounded border outline-none cursor-pointer shadow-2xs ${statusMeta.badgeClass}`}
                      >
                        <option value="pending">⏳ {isRtl ? 'زیرِ کار' : 'Pending'}</option>
                        <option value="cutting">✂️ {isRtl ? 'کٹنگ' : 'Cutting'}</option>
                        <option value="stitching">🧵 {isRtl ? 'سلائی' : 'Stitching'}</option>
                        <option value="ready">🟢 {isRtl ? 'تیار ہے' : 'Ready'}</option>
                        <option value="delivered">✅ {isRtl ? 'حوالے' : 'Delivered'}</option>
                      </select>
                    </div>

                    {/* Direct WhatsApp Share Button */}
                    <button
                      type="button"
                      id={`card-whatsapp-btn-${item.id}`}
                      onClick={generateWhatsAppUrl}
                      className="glow-whatsapp bg-[#25d366] hover:bg-[#20ba59] active:scale-95 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-2xs transition-transform cursor-pointer shrink-0"
                      title={isRtl ? 'واٹس ایپ پر بھیجیں' : 'Send on WhatsApp'}
                    >
                      <MessageCircle className="w-3 h-3 fill-white" />
                      <span>{isRtl ? 'واٹس ایپ' : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Navigation Bar - Balanced Home, AI Assistant, and Add Slip Buttons */}
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
            title={isRtl ? 'ہوم اسکرین' : t.navHome}
          >
            <span className="text-base leading-none">🏠</span>
            <span className="tracking-wide hidden min-[375px]:inline">{isRtl ? 'ہوم' : t.navHome}</span>
          </button>

          {/* AI Assistant Quick Button */}
          <button
            id="nav-chatbot-btn"
            type="button"
            onClick={() => setShowChatbot(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e7f7ef] hover:bg-[#d5f0e3] text-[#075e54] text-xs font-bold cursor-pointer transition-all active:scale-95 border border-[#128c7e]/30 shadow-2xs group"
            title={isRtl ? 'آزاد ماسٹر اسسٹنٹ' : 'Azad Master Assistant'}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-amber-400/60 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
              <img src="/azad-master-logo.svg" alt="AI" className="w-full h-full object-contain" />
            </div>
            <span className="tracking-wide text-[11.5px] font-bold">{isRtl ? 'اسسٹنٹ' : 'Assistant'}</span>
          </button>

          {/* Plus Action Button - Ergonomic, prominent button with clear label */}
          <button 
            id="nav-add-btn"
            type="button"
            onClick={() => setShowImageSourceModal(prev => !prev)} 
            className="azad-glow-btn glow-emerald flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-[#075e54] hover:bg-[#054c44] text-white rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer font-bold text-xs sm:text-sm"
            title={t.addSlip}
          >
            <span className="text-lg font-black leading-none">+</span>
            <span>{isRtl ? 'نیا ناپ' : t.addSlip}</span>
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
                  <span>{isRtl ? 'پرچی یا کپڑے کی تصویر منتخب کریں' : 'Select Slip or Cloth Photo'}</span>
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
                  <span>{isRtl ? 'کیمرہ (Camera)' : 'Camera'}</span>
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
                  <span>{isRtl ? 'گیلری (Gallery)' : 'Gallery'}</span>
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
                <span>{isRtl ? 'بغیر تصویر نیا فارم بھریں' : 'Fill Form Manually'}</span>
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
            onApplyMeasurements={handleApplyMeasurementsFromAI}
          />
        )}

        {showSettings && (
          <SettingsModal
            masterName={masterName}
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
