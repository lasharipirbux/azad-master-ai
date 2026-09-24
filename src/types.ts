export type SupportedLanguage = 
  | 'ur' | 'hi' | 'ar' | 'fa' | 'en'
  | 'fr' | 'de' | 'zh' | 'tr' | 'es'
  | 'it' | 'ru' | 'ja' | 'ko' | 'bn'
  | 'pa' | 'sd' | 'ps' | 'ms' | 'id'
  | 'pt' | 'th';

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export interface CustomerMeasurements {
  length: string;
  shoulder: string;
  sleeves: string;
  chest: string;
  waist: string;
  daaman: string;
  collar: string;
  shalwar: string;
  pancha: string;
  pocket: string;
  specialNotes: string;
  hips?: string;
  thigh?: string;
  knee?: string;
  inseam?: string;
  crossBack?: string;
  armhole?: string;
  bicep?: string;
  customFields?: CustomField[];
}

export type OrderStatus = 'pending' | 'cutting' | 'stitching' | 'ready' | 'delivered';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  details: string;
  measurementsObj?: CustomerMeasurements;
  imageUri?: string | null;
  date: string;
  deliveryDate?: string;
  suitType?: string;
  status?: OrderStatus;
  totalAmount?: number | string;
  advanceAmount?: number | string;
  balanceAmount?: number | string;
  notes?: string;
  avatarColor?: string;
}

export interface CountryCode {
  code: string;
  flag: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp?: string;
  measurementsPreview?: Partial<CustomerMeasurements>;
  pendingConfirmation?: boolean;
}
