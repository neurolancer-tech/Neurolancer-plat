'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import VerificationBadge from '@/components/VerificationBadge';
import ThreeDotsMenu from '@/components/ThreeDotsMenu';
import ReportModal from '@/components/ReportModal';
import { UserProfile } from '@/types';
import api from '@/lib/api';
import { profileApi } from '@/lib/profileApi';
import Pagination from '@/components/Pagination';


export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    minRate: '',
    maxRate: '',
    rating: '',
    minLikes: '',
    category: '',
    subcategory: '',
    country: '',
    city: '',
    sortBy: 'rating'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const freelancersPerPage = 9;
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadFreelancers();
    loadCategories();
    loadCountries();
  }, []);

  // Refetch freelancers when dependent filters change to leverage backend filtering
  useEffect(() => {
    loadFreelancers();
  }, [filters.category, filters.subcategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/with-subcategories/');
      console.log('Categories API response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error('Unexpected categories API response format:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      try {
        const fallbackResponse = await api.get('/categories/');
        const categoriesData = fallbackResponse.data.results || fallbackResponse.data || [];
        
        for (const category of categoriesData) {
          try {
            const subResponse = await api.get(`/categories/${category.id}/subcategories/`);
            category.subcategories = subResponse.data || [];
          } catch {
            category.subcategories = [];
          }
        }
        setCategories(categoriesData);
      } catch (fallbackError) {
        console.error('Fallback categories loading failed:', fallbackError);
        setCategories([]);
      }
    }
  };

  useEffect(() => {
    if (filters.category) {
      const selectedCategory = categories.find(cat => cat.id.toString() === filters.category);
      setSubcategories(selectedCategory?.subcategories || []);
    } else {
      setSubcategories([]);
    }
    setFilters(prev => ({ ...prev, subcategory: '' }));
  }, [filters.category, categories]);

  const loadCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
      const data = await response.json();
      const countryList = data.map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
        flag: country.flag
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));
      setCountries(countryList);
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback to basic list if API fails
      const fallbackCountries = [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
        { code: 'KE', name: 'Kenya', flag: '🇰🇪' }
      ];
      setCountries(fallbackCountries);
    }
  };

  const loadCities = async (countryCode: string) => {
    try {
      // Use GeoNames API for cities
      const response = await fetch(`https://secure.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=50&username=demo`);
      const data = await response.json();
      
      if (data.geonames && data.geonames.length > 0) {
        const cityList = data.geonames
          .filter((city: any) => city.population > 10000) // Filter cities with population > 10k
          .sort((a: any, b: any) => (b.population || 0) - (a.population || 0)) // Sort by population
          .slice(0, 20) // Take top 20 cities
          .map((city: any) => city.name);
        setCities(cityList);
      } else {
        // Fallback to CountryStateCity API
        const fallbackResponse = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}/cities`, {
          headers: {
            'X-CSCAPI-KEY': 'YOUR_API_KEY' // This would need a real API key
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setCities(fallbackData.slice(0, 20).map((city: any) => city.name));
        } else {
          // Final fallback - use static data for major countries
          const staticCities = getStaticCities(countryCode);
          setCities(staticCities);
        }
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      // Use static fallback
      const staticCities = getStaticCities(countryCode);
      setCities(staticCities);
    }
  };

  const getStaticCities = (countryCode: string): string[] => {
    const cityMap: { [key: string]: string[] } = {
      'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
      'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
      'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],
      'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
      'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
      'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
      'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
      'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
      'NG': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos'],
      'KE': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'],
      'PK': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta'],
      'BD': ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Comilla', 'Narayanganj', 'Gazipur'],
      'PH': ['Manila', 'Quezon City', 'Davao', 'Cebu', 'Zamboanga', 'Antipolo', 'Pasig', 'Taguig', 'Cagayan de Oro', 'Paranaque'],
      'EG': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'],
      'ZA': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Nelspruit', 'Kimberley'],
      'GH': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshie', 'Tema'],
      'UG': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Bwizibwera', 'Mbale', 'Mukono', 'Kasese', 'Masaka'],
      'TZ': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Kigoma'],
      'ET': ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama', 'Awasa', 'Bahir Dar', 'Jimma', 'Jijiga', 'Shashamane'],
      'MA': ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'],
      'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
      'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
      'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'Mérida'],
      'JP': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama'],
      'CN': ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing'],
      'RU': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don']
    };
    return cityMap[countryCode] || [];
  };

  const getFlagUrl = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return null;
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
  };

  const CountryFlag = ({ countryCode, className = "w-4 h-3" }: { countryCode: string; className?: string }) => {
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

  const loadFreelancers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.subcategory) params.set('subcategory', filters.subcategory);
      const query = params.toString();
      const response = await api.get(`/profiles/freelancers/public/${query ? `?${query}` : ''}`);
      const freelancerProfiles = response.data.profiles || response.data || [];
      
      const freelancersWithProfiles = freelancerProfiles.map((profile: any) => {
        const userInfo = profile.user_info || {};
        
        return {
          id: profile.id,
          user: {
            id: userInfo.id || profile.user?.id,
            username: userInfo.username || '',
            first_name: userInfo.first_name || '',
            last_name: userInfo.last_name || '',
            email: userInfo.email || ''
          },
          user_type: 'freelancer',
          bio: profile.bio || '',
          skills: profile.skills || '',
          hourly_rate: profile.hourly_rate || 0,
          rating: profile.rating || 0,
          total_reviews: profile.total_reviews || 0,
          profile_picture: userInfo.avatar_url || '',
          avatar_type: 'upload',
          selected_avatar: 'user',
          google_photo_url: '',
          city: userInfo.city || '',
          country: userInfo.country || '',
          title: profile.title || '',
          experience_years: profile.experience_years || 0,
          portfolio_url: profile.portfolio_url || '',
          github_url: profile.github_url || '',
          linkedin_url: profile.linkedin_url || '',
          availability: profile.availability || 'freelance',
          completed_projects: profile.completed_projects || 0,
          // Add category and subcategory data from user_info
          primary_category_name: userInfo.primary_category_name,
          category_names: userInfo.category_names,
          subcategory_names: userInfo.subcategory_names,
          categories: userInfo.categories || [],
          subcategories: userInfo.subcategories || [],
          // Add verification status from user_info
          is_verified: userInfo.is_verified || false,
          professionalProfile: profile
        };
      });
      
      setFreelancers(freelancersWithProfiles);
    } catch (error) {
      console.error('Error loading freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDirectConversation = async (userId: number) => {
    try {
      const response = await api.post('/conversations/direct/start/', { user_id: userId });
      const conversationId = response.data.id || response.data.conversation?.id;
      if (conversationId) {
        window.location.href = `/messages?conversation=${conversationId}`;
      } else {
        window.location.href = `/messages`;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(freelancer => {
      const matchesSearch = (freelancer.user.first_name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                           (freelancer.user.last_name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                           (freelancer.bio || '').toLowerCase().includes(filters.search.toLowerCase());
      const matchesSkills = !filters.skills || (freelancer.skills || '').toLowerCase().includes(filters.skills.toLowerCase());
      const matchesMinRate = !filters.minRate || ((freelancer.hourly_rate || 0) >= parseFloat(filters.minRate));
      const matchesMaxRate = !filters.maxRate || ((freelancer.hourly_rate || 0) <= parseFloat(filters.maxRate));
      const matchesRating = !filters.rating || (freelancer.rating || 0) >= parseFloat(filters.rating);
      const matchesMinLikes = !filters.minLikes || ((freelancer.likes_count || 0) >= parseInt(filters.minLikes));
      const matchesCountry = !filters.country || (freelancer.country && freelancer.country.toLowerCase().includes(filters.country.toLowerCase()));
      const matchesCity = !filters.city || (freelancer.city && freelancer.city.toLowerCase().includes(filters.city.toLowerCase()));
      
      let matchesCategory = true;
      let matchesSubcategory = true;
      
      if (filters.category || filters.subcategory) {
        const onboardingData = (freelancer as any).onboarding_response;
        const skills = (freelancer.skills || '').toLowerCase();
        const title = ((freelancer as any).title || '').toLowerCase();
        const bio = (freelancer.bio || '').toLowerCase();
        
        if (filters.category) {
          const selectedCategory = categories.find(cat => cat.id.toString() === filters.category);
          if (selectedCategory) {
            const categoryName = selectedCategory.name.toLowerCase();
            
            // Check profile categories first
            const hasProfileCategory = freelancer.category_names && 
              freelancer.category_names.toLowerCase().includes(categoryName);
            const hasProfileCategoryById = freelancer.categories && 
              freelancer.categories.some((cat: any) => cat.id.toString() === filters.category);
            
            matchesCategory = hasProfileCategory || hasProfileCategoryById ||
                            skills.includes(categoryName) || 
                            title.includes(categoryName) || 
                            bio.includes(categoryName);
            
            if (!matchesCategory && onboardingData?.interested_subcategories) {
              const categorySubcategories = selectedCategory.subcategories || [];
              const categorySubcategoryIds = categorySubcategories.map((sub: any) => sub.id);
              matchesCategory = onboardingData.interested_subcategories.some((sub: any) => 
                categorySubcategoryIds.includes(sub.id)
              );
            }
          } else {
            matchesCategory = false;
          }
        }
        
        if (filters.subcategory) {
          const selectedSubcategory = subcategories.find(sub => sub.id.toString() === filters.subcategory);
          if (selectedSubcategory) {
            const subcategoryName = selectedSubcategory.name.toLowerCase();
            
            // Check profile subcategories first
            const hasProfileSubcategory = freelancer.subcategory_names && 
              freelancer.subcategory_names.toLowerCase().includes(subcategoryName);
            const hasProfileSubcategoryById = freelancer.subcategories && 
              freelancer.subcategories.some((sub: any) => sub.id.toString() === filters.subcategory);
            
            matchesSubcategory = hasProfileSubcategory || hasProfileSubcategoryById ||
                               skills.includes(subcategoryName) || 
                               title.includes(subcategoryName) || 
                               bio.includes(subcategoryName);
            
            if (!matchesSubcategory && onboardingData?.interested_subcategories) {
              matchesSubcategory = onboardingData.interested_subcategories.some((sub: any) => 
                sub.id.toString() === filters.subcategory
              );
            }
          } else {
            matchesSubcategory = false;
          }
        }
      }
      
      return matchesSearch && matchesSkills && matchesMinRate && matchesMaxRate && matchesRating && matchesMinLikes && matchesCategory && matchesSubcategory && matchesCountry && matchesCity;
    });
  }, [freelancers, filters, categories, subcategories]);

  const sortedFreelancers = useMemo(() => {
    const arr = [...filteredFreelancers];
    const key = filters.sortBy;
    const getVal = (f: UserProfile, k: string) => {
      switch (k) {
        case 'rating': return f.rating || 0;
        case 'total_reviews': return f.total_reviews || 0;
        case 'hourly_rate': return f.hourly_rate || 0;
        case 'likes_count': return f.likes_count || 0;
        default: return 0;
      }
    };
    if (key.startsWith('-')) {
      const k = key.slice(1);
      arr.sort((a,b) => getVal(b,k) - getVal(a,k));
    } else {
      arr.sort((a,b) => getVal(a,key) - getVal(b,key));
    }
    return arr;
  }, [filteredFreelancers, filters.sortBy]);

  const totalPages = Math.ceil(sortedFreelancers.length / freelancersPerPage);
  const startIndex = (currentPage - 1) * freelancersPerPage;
  const paginatedFreelancers = sortedFreelancers.slice(startIndex, startIndex + freelancersPerPage);

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      
      <section 
        className="text-white py-16 relative"
        style={{
          background: 'linear-gradient(to right, #0D9E86, #0d7377)',
          backgroundImage: `url('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Find AI Experts</h1>
          <p className="text-lg sm:text-xl mb-6">Connect with skilled AI professionals and freelancers</p>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="card p-4 sticky top-24">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Filter Freelancers</h3>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search freelancers..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
                <input
                  type="text"
                  placeholder="Skills..."
                  value={filters.skills}
                  onChange={(e) => setFilters({...filters, skills: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => setFilters({...filters, minRate: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => setFilters({...filters, maxRate: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Likes</label>
                <input
                  type="number"
                  placeholder="Min likes..."
                  value={filters.minLikes}
                  onChange={(e) => setFilters({...filters, minLikes: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon && `${category.icon} `}{category.name}
                    </option>
                  ))}
                </select>
              </div>

              {subcategories.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Areas of Expertise</label>
                  <select
                    value={filters.subcategory}
                    onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Areas</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Country Filter */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => {
                    const selectedCountry = e.target.value;
                    setFilters({...filters, country: selectedCountry, city: ''});
                    if (selectedCountry) {
                      const country = countries.find(c => c.name === selectedCountry);
                      if (country) {
                        loadCities(country.code);
                      }
                    } else {
                      setCities([]);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              {filters.country && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>
                        🏙️ {city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setFilters({
                  search: '',
                  skills: '',
                  minRate: '',
                  maxRate: '',
                  rating: '',
                  minLikes: '',
                  category: '',
                  subcategory: '',
                  country: '',
                  city: '',
                  sortBy: 'rating'
                })}
                className="w-full text-primary py-1.5 px-3 text-sm rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="card">
              <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Experts</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filteredFreelancers.length} freelancers found
                    {(filters.category || filters.subcategory) && (
                      <span className="ml-2 text-sm">
                        {filters.category && categories.find(cat => cat.id.toString() === filters.category) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-1">
                            {categories.find(cat => cat.id.toString() === filters.category)?.name}
                          </span>
                        )}
                        {filters.subcategory && subcategories.find(sub => sub.id.toString() === filters.subcategory) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {subcategories.find(sub => sub.id.toString() === filters.subcategory)?.name}
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="input-field w-full sm:w-auto"
                >
                  <option value="-rating">Highest Rated</option>
                  <option value="-total_reviews">Most Reviews</option>
                  <option value="hourly_rate">Hourly Rate (Low to High)</option>
                  <option value="-hourly_rate">Hourly Rate (High to Low)</option>
                  <option value="-likes_count">Most Liked</option>
                </select>
              </div>
              
              <div className="p-4 sm:p-6">
                {filteredFreelancers.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No freelancers found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedFreelancers.map(freelancer => (
                      <div key={freelancer.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full relative">
                        {/* Three Dots Menu */}
                        <div className="absolute top-2 right-2 z-10">
                          <ThreeDotsMenu
                            onReport={() => {
                              setReportData({
                                id: freelancer.user.id,
                                title: `${freelancer.user.first_name || freelancer.user.username} ${freelancer.user.last_name}`,
                                owner: freelancer.user,
                                url: `/freelancer/${freelancer.user.id}`
                              });
                              setShowReportModal(true);
                            }}
                            onView={() => window.location.href = `/freelancer/${freelancer.user.id}`}
                            onContact={() => startDirectConversation(freelancer.user.id)}
                            size="sm"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar
                              src={freelancer.profile_picture}
                              avatarType={(freelancer.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                              selectedAvatar={freelancer.selected_avatar}
                              googlePhotoUrl={freelancer.google_photo_url}
                              size="md"
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {freelancer.user.first_name || freelancer.user.username} {freelancer.user.last_name}
                                </h3>
                                <VerificationBadge isVerified={(freelancer as any).is_verified || false} size="sm" />
                              </div>
                              {(freelancer as any).title && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate mb-2">{(freelancer as any).title}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-4 pb-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center justify-between w-full sm:w-auto">
                              <div className="flex items-center">
                                <span className="text-yellow-400 text-sm">★</span>
                                <span className="text-sm font-medium ml-1">{freelancer.rating}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({freelancer.total_reviews})</span>
                              </div>
                              {(freelancer.hourly_rate || 0) > 0 && (
                                <div className="text-sm sm:text-base font-bold text-primary">
                                  ${freelancer.hourly_rate}/hr
                                </div>
                              )}
                            </div>
                            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                              <LikeButton
                                contentType="freelancer"
                                objectId={freelancer.user.id}
                                initialLikes={freelancer.likes_count || 0}
                                initialDislikes={freelancer.dislikes_count || 0}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="px-4 pb-3 flex-1">
                          {(freelancer as any).professionalProfile?.availability_status && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (freelancer as any).professionalProfile.availability_status === 'available' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : (freelancer as any).professionalProfile.availability_status === 'busy'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {(freelancer as any).professionalProfile.availability_status === 'available' ? '🟢 Available' :
                                 (freelancer as any).professionalProfile.availability_status === 'busy' ? '🟡 Busy' : '🔴 Unavailable'}
                              </span>
                            </div>
                          )}
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed mb-3">
                            {freelancer.bio || 'No bio available'}
                          </p>
                        </div>

                        <div className="px-4 pb-3 space-y-2">
                          <div>
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</div>
                            <div className="flex flex-wrap gap-1">
                              {(freelancer.skills || '').split(',').filter(skill => skill.trim()).slice(0, 3).map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                                  {skill.trim()}
                                </span>
                              ))}
                              {!freelancer.skills && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-md italic">
                                  No skills listed
                                </span>
                              )}
                            </div>
                          </div>

                          {(freelancer as any).onboarding_response?.specialization && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categories</div>
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  try {
                                    const specs = JSON.parse((freelancer as any).onboarding_response.specialization);
                                    return specs.slice(0, 2).map((spec: string, index: number) => (
                                      <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-md">
                                        {formatText(spec)}
                                      </span>
                                    ));
                                  } catch {
                                    return (
                                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-md">
                                        {formatText((freelancer as any).onboarding_response.specialization)}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Categories */}
                          {(freelancer.category_names || freelancer.categories) && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categories</div>
                              <div className="flex flex-wrap gap-1">
                                {freelancer.category_names ? (
                                  freelancer.category_names.split(', ').slice(0, 2).map((name: string, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-md">
                                      {name.length > 15 ? name.substring(0, 15) + '...' : name}
                                    </span>
                                  ))
                                ) : (
                                  freelancer.categories?.slice(0, 2).map((cat: any) => (
                                    <span key={cat.id} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-md">
                                      {cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name}
                                    </span>
                                  ))
                                )}
                                {(freelancer.category_names ? freelancer.category_names.split(', ').length : (freelancer.categories?.length || 0)) > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                    +{(freelancer.category_names ? freelancer.category_names.split(', ').length : (freelancer.categories?.length || 0)) - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Subcategories */}
                          {(freelancer.subcategory_names || freelancer.subcategories || (freelancer as any).onboarding_response?.interested_subcategories) && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expertise</div>
                              <div className="flex flex-wrap gap-1">
                                {freelancer.subcategory_names ? (
                                  // Use stored subcategory names
                                  freelancer.subcategory_names.split(', ').slice(0, 2).map((name: string, index: number) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                                      {name.length > 15 ? name.substring(0, 15) + '...' : name}
                                    </span>
                                  ))
                                ) : freelancer.subcategories ? (
                                  // Use subcategory objects
                                  freelancer.subcategories.slice(0, 2).map((sub: any) => (
                                    <span key={sub.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                                      {sub.name.length > 15 ? sub.name.substring(0, 15) + '...' : sub.name}
                                    </span>
                                  ))
                                ) : (
                                  // Fallback to onboarding data
                                  (freelancer as any).onboarding_response?.interested_subcategories?.slice(0, 2).map((sub: any) => (
                                    <span key={sub.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                                      {sub.name.length > 15 ? sub.name.substring(0, 15) + '...' : sub.name}
                                    </span>
                                  ))
                                )}
                                {(() => {
                                  const count = freelancer.subcategory_names 
                                    ? freelancer.subcategory_names.split(', ').length 
                                    : freelancer.subcategories?.length 
                                    || (freelancer as any).onboarding_response?.interested_subcategories?.length 
                                    || 0;
                                  return count > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                      +{count - 2}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Location Information */}
                          {(freelancer.country || freelancer.city) && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {(() => {
                                const countryData = countries.find(c => c.name.toLowerCase() === (freelancer.country || '').toLowerCase());
                                return (
                                  <span className="flex items-center gap-1">
                                    {countryData && <CountryFlag countryCode={countryData.code} className="w-3 h-2" />}
                                    {freelancer.city && `${freelancer.city}, `}
                                    {freelancer.country}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {(freelancer as any).professionalProfile?.experience_years > 0 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              💼 {(freelancer as any).professionalProfile.experience_years} years experience
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 mt-auto">
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Link href={`/freelancer/${freelancer.user.id}`} className="flex-1 bg-primary text-white text-center text-sm py-2 px-2 sm:px-3 rounded-lg hover:bg-primary/90 transition-colors font-medium">
                              View Profile
                            </Link>
                            <button onClick={() => startDirectConversation(freelancer.user.id)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-center text-sm py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium">
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </main>
      
      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportData(null);
        }}
        reportType="freelancer"
        reportData={reportData}
      />
    </div>
  );
}