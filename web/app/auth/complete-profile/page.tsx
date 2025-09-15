'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getProfile, updateProfile } from '@/lib/auth';
import { completeProfile } from '@/lib/profile';
import api from '@/lib/api';
import Navigation from '@/components/Navigation';
import LocationSelector from '@/components/LocationSelector';
import { LocationData } from '@/lib/location';
import toast from 'react-hot-toast';

const countries = [
  { code: 'AF', name: 'Afghanistan', phone: '+93' },
  { code: 'AL', name: 'Albania', phone: '+355' },
  { code: 'DZ', name: 'Algeria', phone: '+213' },
  { code: 'AR', name: 'Argentina', phone: '+54' },
  { code: 'AM', name: 'Armenia', phone: '+374' },
  { code: 'AU', name: 'Australia', phone: '+61' },
  { code: 'AT', name: 'Austria', phone: '+43' },
  { code: 'AZ', name: 'Azerbaijan', phone: '+994' },
  { code: 'BH', name: 'Bahrain', phone: '+973' },
  { code: 'BD', name: 'Bangladesh', phone: '+880' },
  { code: 'BY', name: 'Belarus', phone: '+375' },
  { code: 'BE', name: 'Belgium', phone: '+32' },
  { code: 'BZ', name: 'Belize', phone: '+501' },
  { code: 'BJ', name: 'Benin', phone: '+229' },
  { code: 'BT', name: 'Bhutan', phone: '+975' },
  { code: 'BO', name: 'Bolivia', phone: '+591' },
  { code: 'BA', name: 'Bosnia and Herzegovina', phone: '+387' },
  { code: 'BW', name: 'Botswana', phone: '+267' },
  { code: 'BR', name: 'Brazil', phone: '+55' },
  { code: 'BN', name: 'Brunei', phone: '+673' },
  { code: 'BG', name: 'Bulgaria', phone: '+359' },
  { code: 'BF', name: 'Burkina Faso', phone: '+226' },
  { code: 'BI', name: 'Burundi', phone: '+257' },
  { code: 'KH', name: 'Cambodia', phone: '+855' },
  { code: 'CM', name: 'Cameroon', phone: '+237' },
  { code: 'CA', name: 'Canada', phone: '+1' },
  { code: 'CV', name: 'Cape Verde', phone: '+238' },
  { code: 'CF', name: 'Central African Republic', phone: '+236' },
  { code: 'TD', name: 'Chad', phone: '+235' },
  { code: 'CL', name: 'Chile', phone: '+56' },
  { code: 'CN', name: 'China', phone: '+86' },
  { code: 'CO', name: 'Colombia', phone: '+57' },
  { code: 'KM', name: 'Comoros', phone: '+269' },
  { code: 'CG', name: 'Congo', phone: '+242' },
  { code: 'CD', name: 'Congo (DRC)', phone: '+243' },
  { code: 'CR', name: 'Costa Rica', phone: '+506' },
  { code: 'CI', name: 'Côte d\'Ivoire', phone: '+225' },
  { code: 'HR', name: 'Croatia', phone: '+385' },
  { code: 'CU', name: 'Cuba', phone: '+53' },
  { code: 'CY', name: 'Cyprus', phone: '+357' },
  { code: 'CZ', name: 'Czech Republic', phone: '+420' },
  { code: 'DK', name: 'Denmark', phone: '+45' },
  { code: 'DJ', name: 'Djibouti', phone: '+253' },
  { code: 'DM', name: 'Dominica', phone: '+1767' },
  { code: 'DO', name: 'Dominican Republic', phone: '+1809' },
  { code: 'EC', name: 'Ecuador', phone: '+593' },
  { code: 'EG', name: 'Egypt', phone: '+20' },
  { code: 'SV', name: 'El Salvador', phone: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', phone: '+240' },
  { code: 'ER', name: 'Eritrea', phone: '+291' },
  { code: 'EE', name: 'Estonia', phone: '+372' },
  { code: 'ET', name: 'Ethiopia', phone: '+251' },
  { code: 'FJ', name: 'Fiji', phone: '+679' },
  { code: 'FI', name: 'Finland', phone: '+358' },
  { code: 'FR', name: 'France', phone: '+33' },
  { code: 'GA', name: 'Gabon', phone: '+241' },
  { code: 'GM', name: 'Gambia', phone: '+220' },
  { code: 'GE', name: 'Georgia', phone: '+995' },
  { code: 'DE', name: 'Germany', phone: '+49' },
  { code: 'GH', name: 'Ghana', phone: '+233' },
  { code: 'GR', name: 'Greece', phone: '+30' },
  { code: 'GD', name: 'Grenada', phone: '+1473' },
  { code: 'GT', name: 'Guatemala', phone: '+502' },
  { code: 'GN', name: 'Guinea', phone: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', phone: '+245' },
  { code: 'GY', name: 'Guyana', phone: '+592' },
  { code: 'HT', name: 'Haiti', phone: '+509' },
  { code: 'HN', name: 'Honduras', phone: '+504' },
  { code: 'HK', name: 'Hong Kong', phone: '+852' },
  { code: 'HU', name: 'Hungary', phone: '+36' },
  { code: 'IS', name: 'Iceland', phone: '+354' },
  { code: 'IN', name: 'India', phone: '+91' },
  { code: 'ID', name: 'Indonesia', phone: '+62' },
  { code: 'IR', name: 'Iran', phone: '+98' },
  { code: 'IQ', name: 'Iraq', phone: '+964' },
  { code: 'IE', name: 'Ireland', phone: '+353' },
  { code: 'IL', name: 'Israel', phone: '+972' },
  { code: 'IT', name: 'Italy', phone: '+39' },
  { code: 'JM', name: 'Jamaica', phone: '+1876' },
  { code: 'JP', name: 'Japan', phone: '+81' },
  { code: 'JO', name: 'Jordan', phone: '+962' },
  { code: 'KZ', name: 'Kazakhstan', phone: '+7' },
  { code: 'KE', name: 'Kenya', phone: '+254' },
  { code: 'KI', name: 'Kiribati', phone: '+686' },
  { code: 'KP', name: 'North Korea', phone: '+850' },
  { code: 'KR', name: 'South Korea', phone: '+82' },
  { code: 'KW', name: 'Kuwait', phone: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', phone: '+996' },
  { code: 'LA', name: 'Laos', phone: '+856' },
  { code: 'LV', name: 'Latvia', phone: '+371' },
  { code: 'LB', name: 'Lebanon', phone: '+961' },
  { code: 'LS', name: 'Lesotho', phone: '+266' },
  { code: 'LR', name: 'Liberia', phone: '+231' },
  { code: 'LY', name: 'Libya', phone: '+218' },
  { code: 'LI', name: 'Liechtenstein', phone: '+423' },
  { code: 'LT', name: 'Lithuania', phone: '+370' },
  { code: 'LU', name: 'Luxembourg', phone: '+352' },
  { code: 'MO', name: 'Macao', phone: '+853' },
  { code: 'MK', name: 'North Macedonia', phone: '+389' },
  { code: 'MG', name: 'Madagascar', phone: '+261' },
  { code: 'MW', name: 'Malawi', phone: '+265' },
  { code: 'MY', name: 'Malaysia', phone: '+60' },
  { code: 'MV', name: 'Maldives', phone: '+960' },
  { code: 'ML', name: 'Mali', phone: '+223' },
  { code: 'MT', name: 'Malta', phone: '+356' },
  { code: 'MH', name: 'Marshall Islands', phone: '+692' },
  { code: 'MR', name: 'Mauritania', phone: '+222' },
  { code: 'MU', name: 'Mauritius', phone: '+230' },
  { code: 'MX', name: 'Mexico', phone: '+52' },
  { code: 'FM', name: 'Micronesia', phone: '+691' },
  { code: 'MD', name: 'Moldova', phone: '+373' },
  { code: 'MC', name: 'Monaco', phone: '+377' },
  { code: 'MN', name: 'Mongolia', phone: '+976' },
  { code: 'ME', name: 'Montenegro', phone: '+382' },
  { code: 'MA', name: 'Morocco', phone: '+212' },
  { code: 'MZ', name: 'Mozambique', phone: '+258' },
  { code: 'MM', name: 'Myanmar', phone: '+95' },
  { code: 'NA', name: 'Namibia', phone: '+264' },
  { code: 'NR', name: 'Nauru', phone: '+674' },
  { code: 'NP', name: 'Nepal', phone: '+977' },
  { code: 'NL', name: 'Netherlands', phone: '+31' },
  { code: 'NZ', name: 'New Zealand', phone: '+64' },
  { code: 'NI', name: 'Nicaragua', phone: '+505' },
  { code: 'NE', name: 'Niger', phone: '+227' },
  { code: 'NG', name: 'Nigeria', phone: '+234' },
  { code: 'NO', name: 'Norway', phone: '+47' },
  { code: 'OM', name: 'Oman', phone: '+968' },
  { code: 'PK', name: 'Pakistan', phone: '+92' },
  { code: 'PW', name: 'Palau', phone: '+680' },
  { code: 'PS', name: 'Palestine', phone: '+970' },
  { code: 'PA', name: 'Panama', phone: '+507' },
  { code: 'PG', name: 'Papua New Guinea', phone: '+675' },
  { code: 'PY', name: 'Paraguay', phone: '+595' },
  { code: 'PE', name: 'Peru', phone: '+51' },
  { code: 'PH', name: 'Philippines', phone: '+63' },
  { code: 'PL', name: 'Poland', phone: '+48' },
  { code: 'PT', name: 'Portugal', phone: '+351' },
  { code: 'QA', name: 'Qatar', phone: '+974' },
  { code: 'RO', name: 'Romania', phone: '+40' },
  { code: 'RU', name: 'Russia', phone: '+7' },
  { code: 'RW', name: 'Rwanda', phone: '+250' },
  { code: 'KN', name: 'Saint Kitts and Nevis', phone: '+1869' },
  { code: 'LC', name: 'Saint Lucia', phone: '+1758' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', phone: '+1784' },
  { code: 'WS', name: 'Samoa', phone: '+685' },
  { code: 'SM', name: 'San Marino', phone: '+378' },
  { code: 'ST', name: 'São Tomé and Príncipe', phone: '+239' },
  { code: 'SA', name: 'Saudi Arabia', phone: '+966' },
  { code: 'SN', name: 'Senegal', phone: '+221' },
  { code: 'RS', name: 'Serbia', phone: '+381' },
  { code: 'SC', name: 'Seychelles', phone: '+248' },
  { code: 'SL', name: 'Sierra Leone', phone: '+232' },
  { code: 'SG', name: 'Singapore', phone: '+65' },
  { code: 'SK', name: 'Slovakia', phone: '+421' },
  { code: 'SI', name: 'Slovenia', phone: '+386' },
  { code: 'SB', name: 'Solomon Islands', phone: '+677' },
  { code: 'SO', name: 'Somalia', phone: '+252' },
  { code: 'ZA', name: 'South Africa', phone: '+27' },
  { code: 'SS', name: 'South Sudan', phone: '+211' },
  { code: 'ES', name: 'Spain', phone: '+34' },
  { code: 'LK', name: 'Sri Lanka', phone: '+94' },
  { code: 'SD', name: 'Sudan', phone: '+249' },
  { code: 'SR', name: 'Suriname', phone: '+597' },
  { code: 'SZ', name: 'Eswatini', phone: '+268' },
  { code: 'SE', name: 'Sweden', phone: '+46' },
  { code: 'CH', name: 'Switzerland', phone: '+41' },
  { code: 'SY', name: 'Syria', phone: '+963' },
  { code: 'TW', name: 'Taiwan', phone: '+886' },
  { code: 'TJ', name: 'Tajikistan', phone: '+992' },
  { code: 'TZ', name: 'Tanzania', phone: '+255' },
  { code: 'TH', name: 'Thailand', phone: '+66' },
  { code: 'TL', name: 'Timor-Leste', phone: '+670' },
  { code: 'TG', name: 'Togo', phone: '+228' },
  { code: 'TO', name: 'Tonga', phone: '+676' },
  { code: 'TT', name: 'Trinidad and Tobago', phone: '+1868' },
  { code: 'TN', name: 'Tunisia', phone: '+216' },
  { code: 'TR', name: 'Turkey', phone: '+90' },
  { code: 'TM', name: 'Turkmenistan', phone: '+993' },
  { code: 'TV', name: 'Tuvalu', phone: '+688' },
  { code: 'UG', name: 'Uganda', phone: '+256' },
  { code: 'UA', name: 'Ukraine', phone: '+380' },
  { code: 'AE', name: 'United Arab Emirates', phone: '+971' },
  { code: 'GB', name: 'United Kingdom', phone: '+44' },
  { code: 'US', name: 'United States', phone: '+1' },
  { code: 'UY', name: 'Uruguay', phone: '+598' },
  { code: 'UZ', name: 'Uzbekistan', phone: '+998' },
  { code: 'VU', name: 'Vanuatu', phone: '+678' },
  { code: 'VA', name: 'Vatican City', phone: '+39' },
  { code: 'VE', name: 'Venezuela', phone: '+58' },
  { code: 'VN', name: 'Vietnam', phone: '+84' },
  { code: 'YE', name: 'Yemen', phone: '+967' },
  { code: 'ZM', name: 'Zambia', phone: '+260' },
  { code: 'ZW', name: 'Zimbabwe', phone: '+263' }
];

const usStates = [
  { code: 'CA', name: 'California' }, { code: 'NY', name: 'New York' }, 
  { code: 'TX', name: 'Texas' }, { code: 'FL', name: 'Florida' }
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    phone_number: '',
    country: '',
    state: '',
    city: '',
    skills: '',
    experience_level: 'entry'
  });

  const [phoneVerification, setPhoneVerification] = useState({
    step: 'input',
    verificationCode: '',
    recaptchaVerifier: null as any
  });

  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  useEffect(() => {
    const userProfile = getProfile();
    if (!userProfile) {
      router.push('/auth');
      return;
    }
    setProfile(userProfile);
    setLoading(false);
    
    // Auto-detect phone country code
    autoDetectPhoneCountry();
  }, [router]);

  // Auto-detect phone country based on location
  const autoDetectPhoneCountry = async () => {
    try {
      const { LocationService } = await import('@/lib/location');
      const result = await LocationService.autoDetectLocation();
      if (result.success && result.country_code) {
        const detectedCountry = countries.find(c => c.code === result.country_code);
        if (detectedCountry) {
          setSelectedCountry(detectedCountry);
          setFormData(prev => ({ ...prev, country: detectedCountry.code }));
        }
      }
    } catch (error) {
      console.log('Phone country auto-detection failed:', error);
    }
  };

  // Get country flag image
  const getFlagUrl = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return null;
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
  };

  const CountryFlag = ({ countryCode, className = "w-6 h-4" }: { countryCode: string; className?: string }) => {
    const flagUrl = getFlagUrl(countryCode);
    if (!flagUrl) return <span className="text-xs">🌍</span>;
    
    return (
      <img 
        src={flagUrl} 
        alt={`${countryCode} flag`}
        className={`inline-block ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    setSelectedCountry(country || null);
    setFormData(prev => ({ ...prev, country: countryCode, state: '' }));
  };

  const sendVerificationCode = async () => {
    if (!formData.phone_number || !selectedCountry) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      const fullPhoneNumber = `${selectedCountry.phone}${formData.phone_number}`;
      await api.post('/auth/send-phone-verification/', {
        phone_number: fullPhoneNumber
      });
      setPhoneVerification(prev => ({ ...prev, step: 'verify' }));
      toast.success('Verification code sent to your phone');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      toast.error('Failed to send verification code');
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneVerification.verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      await api.post('/auth/verify-phone/', {
        code: phoneVerification.verificationCode
      });
      setPhoneVerification(prev => ({ ...prev, step: 'verified' }));
      toast.success('Phone number verified successfully');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      toast.error('Invalid verification code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Send profile data to backend API
      const profileData = {
        ...formData,
        phone: `${selectedCountry?.phone}${formData.phone_number}`,
        phone_verified: phoneVerification.step === 'verified',
        experience_level: formData.experience_level as 'entry' | 'intermediate' | 'expert'
      };
      
      await completeProfile(profileData);
      
      // Update local profile
      const updatedProfile = {
        ...profile,
        ...profileData,
        profile_completed: true
      };
      updateProfile(updatedProfile);
      
      toast.success('Profile completed successfully!');
      router.push('/role-selection');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please provide additional information to complete your registration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Phone Verification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.phone})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center gap-2 px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                      {selectedCountry && <CountryFlag countryCode={selectedCountry.code} className="w-5 h-3" />}
                      {selectedCountry?.phone || '+1'}
                    </span>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="1234567890"
                      required
                      disabled={phoneVerification.step === 'verified'}
                    />
                  </div>
                </div>
              </div>

              {phoneVerification.step === 'input' && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  className="mt-4 btn-secondary"
                  disabled={!formData.phone_number || !selectedCountry}
                >
                  Send Verification Code
                </button>
              )}

              {phoneVerification.step === 'verify' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={phoneVerification.verificationCode}
                      onChange={(e) => setPhoneVerification(prev => ({ ...prev, verificationCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifyPhoneCode}
                    className="btn-primary"
                  >
                    Verify Code
                  </button>
                </div>
              )}

              {phoneVerification.step === 'verified' && (
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Phone number verified
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Location Information
              </h3>
              
              <LocationSelector 
                onLocationChange={(location: LocationData) => {
                  if (location.success) {
                    setFormData(prev => ({
                      ...prev,
                      country: location.country || '',
                      state: location.state || '',
                      city: location.city || ''
                    }));
                    
                    // Also update phone country if detected
                    if (location.country_code) {
                      const detectedCountry = countries.find(c => c.code === location.country_code);
                      if (detectedCountry && !selectedCountry) {
                        setSelectedCountry(detectedCountry);
                        setFormData(prev => ({ ...prev, country: detectedCountry.code }));
                      }
                    }
                  }
                }}
                showAutoDetect={true}
                className="mb-4"
              />
              
              {/* Manual City Input */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City (Optional)
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your city"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Python, Machine Learning, TensorFlow"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="btn-secondary"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Completing...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}