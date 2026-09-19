export interface CountryData {
  code: string;       // e.g. "+92"
  iso: string;        // e.g. "PK"
  flag: string;       // e.g. "🇵🇰"
  name: string;       // e.g. "Pakistan"
  nameUr?: string;    // e.g. "پاکستان"
}

export const allCountries: CountryData[] = [
  // Top & Popular
  { iso: "PK", flag: "🇵🇰", code: "+92", name: "Pakistan", nameUr: "پاکستان" },
  { iso: "SA", flag: "🇸🇦", code: "+966", name: "Saudi Arabia", nameUr: "سعودی عرب" },
  { iso: "AE", flag: "🇦🇪", code: "+971", name: "United Arab Emirates", nameUr: "متحدہ عرب امارات" },
  { iso: "OM", flag: "🇴🇲", code: "+968", name: "Oman", nameUr: "عمان" },
  { iso: "QA", flag: "🇶🇦", code: "+974", name: "Qatar", nameUr: "قطر" },
  { iso: "KW", flag: "🇰🇼", code: "+965", name: "Kuwait", nameUr: "کویت" },
  { iso: "BH", flag: "🇧🇭", code: "+973", name: "Bahrain", nameUr: "بحرین" },
  { iso: "GB", flag: "🇬🇧", code: "+44", name: "United Kingdom", nameUr: "برطانیہ" },
  { iso: "US", flag: "🇺🇸", code: "+1", name: "United States", nameUr: "امریکہ" },
  { iso: "CA", flag: "🇨🇦", code: "+1", name: "Canada", nameUr: "کینیڈا" },
  { iso: "IN", flag: "🇮🇳", code: "+91", name: "India", nameUr: "بھارت" },
  { iso: "BD", flag: "🇧🇩", code: "+880", name: "Bangladesh", nameUr: "بنگلہ دیش" },
  { iso: "AF", flag: "🇦🇫", code: "+93", name: "Afghanistan", nameUr: "افغانستان" },
  { iso: "TR", flag: "🇹🇷", code: "+90", name: "Turkey", nameUr: "ترکی" },
  { iso: "MY", flag: "🇲🇾", code: "+60", name: "Malaysia", nameUr: "ملائیشیا" },
  { iso: "ID", flag: "🇮🇩", code: "+62", name: "Indonesia", nameUr: "انڈونیشیا" },
  { iso: "AU", flag: "🇦🇺", code: "+61", name: "Australia", nameUr: "آسٹریلیا" },
  { iso: "DE", flag: "🇩🇪", code: "+49", name: "Germany", nameUr: "جرمنی" },
  { iso: "FR", flag: "🇫🇷", code: "+33", name: "France", nameUr: "فرانس" },
  { iso: "IT", flag: "🇮🇹", code: "+39", name: "Italy", nameUr: "اٹلی" },
  { iso: "ES", flag: "🇪🇸", code: "+34", name: "Spain", nameUr: "اسپین" },
  { iso: "ZA", flag: "🇿🇦", code: "+27", name: "South Africa", nameUr: "جنوبی افریقہ" },
  { iso: "EG", flag: "🇪🇬", code: "+20", name: "Egypt", nameUr: "مصر" },
  { iso: "CN", flag: "🇨🇳", code: "+86", name: "China", nameUr: "چین" },
  { iso: "JP", flag: "🇯🇵", code: "+81", name: "Japan", nameUr: "جاپان" },
  { iso: "KR", flag: "🇰🇷", code: "+82", name: "South Korea", nameUr: "جنوبی کوریا" },

  // A
  { iso: "AL", flag: "🇦🇱", code: "+355", name: "Albania" },
  { iso: "DZ", flag: "🇩🇿", code: "+213", name: "Algeria", nameUr: "الجزائر" },
  { iso: "AD", flag: "🇦🇩", code: "+376", name: "Andorra" },
  { iso: "AO", flag: "🇦🇴", code: "+244", name: "Angola" },
  { iso: "AI", flag: "🇦🇮", code: "+1264", name: "Anguilla" },
  { iso: "AG", flag: "🇦🇬", code: "+1268", name: "Antigua and Barbuda" },
  { iso: "AR", flag: "🇦🇷", code: "+54", name: "Argentina" },
  { iso: "AM", flag: "🇦🇲", code: "+374", name: "Armenia" },
  { iso: "AW", flag: "🇦🇼", code: "+297", name: "Aruba" },
  { iso: "AT", flag: "🇦🇹", code: "+43", name: "Austria" },
  { iso: "AZ", flag: "🇦🇿", code: "+994", name: "Azerbaijan", nameUr: "آذربائیجان" },

  // B
  { iso: "BS", flag: "🇧🇸", code: "+1242", name: "Bahamas" },
  { iso: "BB", flag: "🇧🇧", code: "+1246", name: "Barbados" },
  { iso: "BY", flag: "🇧🇾", code: "+375", name: "Belarus" },
  { iso: "BE", flag: "🇧🇪", code: "+32", name: "Belgium" },
  { iso: "BZ", flag: "🇧🇿", code: "+501", name: "Belize" },
  { iso: "BJ", flag: "🇧🇯", code: "+229", name: "Benin" },
  { iso: "BM", flag: "🇧🇲", code: "+1441", name: "Bermuda" },
  { iso: "BT", flag: "🇧🇹", code: "+975", name: "Bhutan" },
  { iso: "BO", flag: "🇧🇴", code: "+591", name: "Bolivia" },
  { iso: "BA", flag: "🇧🇦", code: "+387", name: "Bosnia and Herzegovina" },
  { iso: "BW", flag: "🇧🇼", code: "+267", name: "Botswana" },
  { iso: "BR", flag: "🇧🇷", code: "+55", name: "Brazil" },
  { iso: "BN", flag: "🇧🇳", code: "+673", name: "Brunei", nameUr: "برونائی" },
  { iso: "BG", flag: "🇧🇬", code: "+359", name: "Bulgaria" },
  { iso: "BF", flag: "🇧🇫", code: "+226", name: "Burkina Faso" },
  { iso: "BI", flag: "🇧🇮", code: "+257", name: "Burundi" },

  // C
  { iso: "KH", flag: "🇰🇭", code: "+855", name: "Cambodia" },
  { iso: "CM", flag: "🇨🇲", code: "+237", name: "Cameroon" },
  { iso: "CV", flag: "🇨🇻", code: "+238", name: "Cape Verde" },
  { iso: "KY", flag: "🇰🇾", code: "+1345", name: "Cayman Islands" },
  { iso: "CF", flag: "🇨🇫", code: "+236", name: "Central African Republic" },
  { iso: "TD", flag: "🇹🇩", code: "+235", name: "Chad" },
  { iso: "CL", flag: "🇨🇱", code: "+56", name: "Chile" },
  { iso: "CO", flag: "🇨🇴", code: "+57", name: "Colombia" },
  { iso: "KM", flag: "🇰🇲", code: "+269", name: "Comoros" },
  { iso: "CG", flag: "🇨🇬", code: "+242", name: "Congo" },
  { iso: "CD", flag: "🇨🇩", code: "+243", name: "Congo (DRC)" },
  { iso: "CR", flag: "🇨🇷", code: "+506", name: "Costa Rica" },
  { iso: "CI", flag: "🇨🇮", code: "+225", name: "Ivory Coast" },
  { iso: "HR", flag: "🇭🇷", code: "+385", name: "Croatia" },
  { iso: "CU", flag: "🇨🇺", code: "+53", name: "Cuba" },
  { iso: "CY", flag: "🇨🇾", code: "+357", name: "Cyprus" },
  { iso: "CZ", flag: "🇨🇿", code: "+420", name: "Czech Republic" },

  // D
  { iso: "DK", flag: "🇩🇰", code: "+45", name: "Denmark" },
  { iso: "DJ", flag: "🇩🇯", code: "+253", name: "Djibouti" },
  { iso: "DM", flag: "🇩🇲", code: "+1767", name: "Dominica" },
  { iso: "DO", flag: "🇩🇴", code: "+1809", name: "Dominican Republic" },

  // E
  { iso: "EC", flag: "🇪🇨", code: "+593", name: "Ecuador" },
  { iso: "SV", flag: "🇸🇻", code: "+503", name: "El Salvador" },
  { iso: "GQ", flag: "🇬🇶", code: "+240", name: "Equatorial Guinea" },
  { iso: "ER", flag: "🇪🇷", code: "+291", name: "Eritrea" },
  { iso: "EE", flag: "🇪🇪", code: "+372", name: "Estonia" },
  { iso: "SZ", flag: "🇸🇿", code: "+268", name: "Eswatini" },
  { iso: "ET", flag: "🇪🇹", code: "+251", name: "Ethiopia" },

  // F
  { iso: "FJ", flag: "🇫🇯", code: "+679", name: "Fiji" },
  { iso: "FI", flag: "🇫🇮", code: "+358", name: "Finland" },

  // G
  { iso: "GA", flag: "🇬🇦", code: "+241", name: "Gabon" },
  { iso: "GM", flag: "🇬🇲", code: "+220", name: "Gambia" },
  { iso: "GE", flag: "🇬🇪", code: "+995", name: "Georgia" },
  { iso: "GH", flag: "🇬🇭", code: "+233", name: "Ghana" },
  { iso: "GR", flag: "🇬🇷", code: "+30", name: "Greece" },
  { iso: "GL", flag: "🇬🇱", code: "+299", name: "Greenland" },
  { iso: "GD", flag: "🇬🇩", code: "+1473", name: "Grenada" },
  { iso: "GT", flag: "🇬🇹", code: "+502", name: "Guatemala" },
  { iso: "GN", flag: "🇬🇳", code: "+224", name: "Guinea" },
  { iso: "GW", flag: "🇬🇼", code: "+245", name: "Guinea-Bissau" },
  { iso: "GY", flag: "🇬🇾", code: "+592", name: "Guyana" },

  // H
  { iso: "HT", flag: "🇭🇹", code: "+509", name: "Haiti" },
  { iso: "HN", flag: "🇭🇳", code: "+504", name: "Honduras" },
  { iso: "HK", flag: "🇭🇰", code: "+852", name: "Hong Kong" },
  { iso: "HU", flag: "🇭🇺", code: "+36", name: "Hungary" },

  // I
  { iso: "IS", flag: "🇮🇸", code: "+354", name: "Iceland" },
  { iso: "IR", flag: "🇮🇷", code: "+98", name: "Iran", nameUr: "ایران" },
  { iso: "IQ", flag: "🇮🇶", code: "+964", name: "Iraq", nameUr: "عراق" },
  { iso: "IE", flag: "🇮🇪", code: "+353", name: "Ireland" },

  // J
  { iso: "JM", flag: "🇯🇲", code: "+1876", name: "Jamaica" },
  { iso: "JO", flag: "🇯🇴", code: "+962", name: "Jordan", nameUr: "اردن" },

  // K
  { iso: "KZ", flag: "🇰🇿", code: "+7", name: "Kazakhstan", nameUr: "قازقستان" },
  { iso: "KE", flag: "🇰🇪", code: "+254", name: "Kenya" },
  { iso: "KG", flag: "🇰🇬", code: "+996", name: "Kyrgyzstan", nameUr: "کرغزستان" },
  { iso: "KI", flag: "🇰🇮", code: "+686", name: "Kiribati" },
  { iso: "XK", flag: "🇽🇰", code: "+383", name: "Kosovo" },

  // L
  { iso: "LA", flag: "🇱🇦", code: "+856", name: "Laos" },
  { iso: "LV", flag: "🇱🇻", code: "+371", name: "Latvia" },
  { iso: "LB", flag: "🇱🇧", code: "+961", name: "Lebanon", nameUr: "لبنان" },
  { iso: "LS", flag: "🇱🇸", code: "+266", name: "Lesotho" },
  { iso: "LR", flag: "🇱🇷", code: "+231", name: "Liberia" },
  { iso: "LY", flag: "🇱🇾", code: "+218", name: "Libya", nameUr: "لیبیا" },
  { iso: "LI", flag: "🇱🇮", code: "+423", name: "Liechtenstein" },
  { iso: "LT", flag: "🇱🇹", code: "+370", name: "Lithuania" },
  { iso: "LU", flag: "🇱🇺", code: "+352", name: "Luxembourg" },

  // M
  { iso: "MO", flag: "🇲🇴", code: "+853", name: "Macau" },
  { iso: "MG", flag: "🇲🇬", code: "+261", name: "Madagascar" },
  { iso: "MW", flag: "🇲🇼", code: "+265", name: "Malawi" },
  { iso: "MV", flag: "🇲🇻", code: "+960", name: "Maldives", nameUr: "مالدیپ" },
  { iso: "ML", flag: "🇲🇱", code: "+223", name: "Mali" },
  { iso: "MT", flag: "🇲🇹", code: "+356", name: "Malta" },
  { iso: "MR", flag: "🇲🇷", code: "+222", name: "Mauritania", nameUr: "موریتانیہ" },
  { iso: "MU", flag: "🇲🇺", code: "+230", name: "Mauritius" },
  { iso: "MX", flag: "🇲🇽", code: "+52", name: "Mexico" },
  { iso: "MD", flag: "🇲🇩", code: "+373", name: "Moldova" },
  { iso: "MC", flag: "🇲🇨", code: "+377", name: "Monaco" },
  { iso: "MN", flag: "🇲🇳", code: "+976", name: "Mongolia" },
  { iso: "ME", flag: "🇲🇪", code: "+382", name: "Montenegro" },
  { iso: "MA", flag: "🇲🇦", code: "+212", name: "Morocco", nameUr: "مراکش" },
  { iso: "MZ", flag: "🇲🇿", code: "+258", name: "Mozambique" },
  { iso: "MM", flag: "🇲🇲", code: "+95", name: "Myanmar (Burma)" },

  // N
  { iso: "NA", flag: "🇳🇦", code: "+264", name: "Namibia" },
  { iso: "NP", flag: "🇳🇵", code: "+977", name: "Nepal", nameUr: "نیپال" },
  { iso: "NL", flag: "🇳🇱", code: "+31", name: "Netherlands" },
  { iso: "NZ", flag: "🇳🇿", code: "+64", name: "New Zealand" },
  { iso: "NI", flag: "🇳🇮", code: "+505", name: "Nicaragua" },
  { iso: "NE", flag: "🇳🇪", code: "+227", name: "Niger" },
  { iso: "NG", flag: "🇳🇬", code: "+234", name: "Nigeria" },
  { iso: "MK", flag: "🇲🇰", code: "+389", name: "North Macedonia" },
  { iso: "NO", flag: "🇳🇴", code: "+47", name: "Norway" },

  // P
  { iso: "PS", flag: "🇵🇸", code: "+970", name: "Palestine", nameUr: "فلسطین" },
  { iso: "PA", flag: "🇵🇦", code: "+507", name: "Panama" },
  { iso: "PG", flag: "🇵🇬", code: "+675", name: "Papua New Guinea" },
  { iso: "PY", flag: "🇵🇾", code: "+595", name: "Paraguay" },
  { iso: "PE", flag: "🇵🇪", code: "+51", name: "Peru" },
  { iso: "PH", flag: "🇵🇭", code: "+63", name: "Philippines" },
  { iso: "PL", flag: "🇵🇱", code: "+48", name: "Poland" },
  { iso: "PT", flag: "🇵🇹", code: "+351", name: "Portugal" },

  // R
  { iso: "RO", flag: "🇷🇴", code: "+40", name: "Romania" },
  { iso: "RU", flag: "🇷🇺", code: "+7", name: "Russia", nameUr: "روس" },
  { iso: "RW", flag: "🇷🇼", code: "+250", name: "Rwanda" },

  // S
  { iso: "WS", flag: "🇼🇸", code: "+685", name: "Samoa" },
  { iso: "SN", flag: "🇸🇳", code: "+221", name: "Senegal" },
  { iso: "RS", flag: "🇷🇸", code: "+381", name: "Serbia" },
  { iso: "SC", flag: "🇸🇨", code: "+248", name: "Seychelles" },
  { iso: "SL", flag: "🇸🇱", code: "+232", name: "Sierra Leone" },
  { iso: "SG", flag: "🇸🇬", code: "+65", name: "Singapore" },
  { iso: "SK", flag: "🇸🇰", code: "+421", name: "Slovakia" },
  { iso: "SI", flag: "🇸🇮", code: "+386", name: "Slovenia" },
  { iso: "SO", flag: "🇸🇴", code: "+252", name: "Somalia", nameUr: "صومالیہ" },
  { iso: "LK", flag: "🇱🇰", code: "+94", name: "Sri Lanka", nameUr: "سری لنکا" },
  { iso: "SD", flag: "🇸🇩", code: "+249", name: "Sudan", nameUr: "سوڈان" },
  { iso: "SE", flag: "🇸🇪", code: "+46", name: "Sweden" },
  { iso: "CH", flag: "🇨🇭", code: "+41", name: "Switzerland" },
  { iso: "SY", flag: "🇸🇾", code: "+963", name: "Syria", nameUr: "شام" },

  // T
  { iso: "TW", flag: "🇹🇼", code: "+886", name: "Taiwan" },
  { iso: "TJ", flag: "🇹🇯", code: "+992", name: "Tajikistan", nameUr: "تاجکستان" },
  { iso: "TZ", flag: "🇹🇿", code: "+255", name: "Tanzania" },
  { iso: "TH", flag: "🇹🇭", code: "+66", name: "Thailand" },
  { iso: "TG", flag: "🇹🇬", code: "+228", name: "Togo" },
  { iso: "TO", flag: "🇹🇴", code: "+676", name: "Tonga" },
  { iso: "TT", flag: "🇹🇹", code: "+1868", name: "Trinidad and Tobago" },
  { iso: "TN", flag: "🇹🇳", code: "+216", name: "Tunisia", nameUr: "تیونس" },
  { iso: "TM", flag: "🇹🇲", code: "+993", name: "Turkmenistan", nameUr: "ترکمانستان" },

  // U
  { iso: "UG", flag: "🇺🇬", code: "+256", name: "Uganda" },
  { iso: "UA", flag: "🇺🇦", code: "+380", name: "Ukraine" },
  { iso: "UY", flag: "🇺🇾", code: "+598", name: "Uruguay" },
  { iso: "UZ", flag: "🇺🇿", code: "+998", name: "Uzbekistan", nameUr: "ازبکستان" },

  // V
  { iso: "VE", flag: "🇻🇪", code: "+58", name: "Venezuela" },
  { iso: "VN", flag: "🇻🇳", code: "+84", name: "Vietnam" },

  // Y & Z
  { iso: "YE", flag: "🇾🇪", code: "+967", name: "Yemen", nameUr: "یمن" },
  { iso: "ZM", flag: "🇿🇲", code: "+260", name: "Zambia" },
  { iso: "ZW", flag: "🇿🇼", code: "+263", name: "Zimbabwe" }
];

/**
 * Helper to find country by calling code or ISO
 */
export function getCountryByCode(code: string): CountryData {
  const clean = code.trim();
  const match = allCountries.find(c => c.code === clean || clean.startsWith(c.code));
  return match || allCountries[0]; // defaults to Pakistan
}

export function getCountryByIso(iso: string): CountryData {
  const match = allCountries.find(c => c.iso.toUpperCase() === iso.toUpperCase());
  return match || allCountries[0];
}
