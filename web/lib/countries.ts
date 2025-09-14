export interface Country {
  code: string;
  name: string;
  phone: string;
  flag: string;
}

export interface State {
  code: string;
  name: string;
}

export const countries: Country[] = [
  { code: 'US', name: 'United States', phone: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', phone: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', phone: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', phone: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', phone: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', phone: '+33', flag: '🇫🇷' },
  { code: 'IN', name: 'India', phone: '+91', flag: '🇮🇳' },
  { code: 'NG', name: 'Nigeria', phone: '+234', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', phone: '+27', flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil', phone: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', phone: '+52', flag: '🇲🇽' },
  { code: 'JP', name: 'Japan', phone: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', phone: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', phone: '+86', flag: '🇨🇳' },
  { code: 'IT', name: 'Italy', phone: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', phone: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', phone: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', phone: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', phone: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', phone: '+45', flag: '🇩🇰' }
];

export const usStates: State[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getStateByCode = (code: string): State | undefined => {
  return usStates.find(state => state.code === code);
};

export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  // Basic validation - can be enhanced with more specific rules per country
  const cleanPhone = phone.replace(/\D/g, '');
  
  switch (countryCode) {
    case '+1': // US/Canada
      return cleanPhone.length === 10;
    case '+44': // UK
      return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    case '+91': // India
      return cleanPhone.length === 10;
    case '+234': // Nigeria
      return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    default:
      return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
};