export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  date_joined: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface UserProfile {
  id: number;
  user: User;
  user_type: 'client' | 'freelancer' | 'both';
  bio: string;
  skills: string;
  hourly_rate?: number;
  total_earnings: number;
  rating: number;
  total_reviews: number;
  likes_count: number;
  dislikes_count: number;
  profile_picture?: string;
  avatar_type?: string;
  selected_avatar?: string;
  google_photo_url?: string;
  // Category and subcategory fields
  primary_category?: Category;
  primary_category_name?: string;
  categories?: Category[];
  category_names?: string;
  subcategories?: Subcategory[];
  subcategory_names?: string;
  // Enhanced auth fields
  phone_number?: string;
  phone_verified?: boolean;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  experience_level?: 'entry' | 'intermediate' | 'expert';
  availability?: 'full-time' | 'part-time' | 'contract' | 'freelance';
  date_of_birth?: string;
  profile_completed?: boolean;
  email_verified?: boolean;
  auth_provider?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  category: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Gig {
  id: number;
  freelancer: User;
  freelancer_profile?: {
    rating: number;
    total_reviews: number;
    completed_gigs: number;
    profile_picture?: string;
    avatar_type?: 'upload' | 'avatar' | 'google';
    selected_avatar?: string;
    google_photo_url?: string;
  };
  category: Category;
  category_name?: string;
  subcategories?: Subcategory[];
  subcategory_names?: string;
  title: string;
  description: string;
  image?: string;
  basic_title: string;
  basic_description: string;
  basic_price: number;
  basic_delivery_time: number;
  standard_title?: string;
  standard_description?: string;
  standard_price?: number;
  standard_delivery_time?: number;
  premium_title?: string;
  premium_description?: string;
  premium_price?: number;
  premium_delivery_time?: number;
  tags: string;
  is_active: boolean;
  total_orders: number;
  rating: number;
  total_reviews: number;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

export interface Order {
  id: number;
  client: User;
  freelancer: User;
  gig?: Gig;
  package_type: 'basic' | 'standard' | 'premium' | 'custom';
  title: string;
  description: string;
  price: number;
  delivery_time: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  requirements?: string;
  progress_notes?: string;
  is_paid: boolean;
  escrow_released?: boolean;
  payment_reference?: string;
  created_at: string;
  accepted_at?: string;
  delivered_at?: string;
  completed_at?: string;
}

export interface JobOrderSummary {
  id: number;
  status: string;
  is_paid?: boolean;
  escrow_released?: boolean;
}

export interface JobAcceptedProposalSummary {
  id: number;
  proposed_price?: number;
  delivery_time?: number;
  freelancer: { id: number; username: string; first_name: string; last_name: string };
}

export interface Job {
  id: number;
  client: User & { profile?: UserProfile };
  client_profile?: {
    profile_picture?: string;
    avatar_type?: 'upload' | 'avatar' | 'google';
    selected_avatar?: string;
    google_photo_url?: string;
  };
  title: string;
  description: string;
  category: Category;
  category_name?: string;
  subcategories?: Subcategory[];
  subcategory_names?: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  skills_required: string;
  experience_level: 'entry' | 'intermediate' | 'expert';
  job_type: 'fixed' | 'hourly';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
  location?: string;
  proposal_count: number;
  attachments?: string;
  is_paid?: boolean;
  order_summary?: JobOrderSummary;
  accepted_proposal?: JobAcceptedProposalSummary;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
}

export interface Proposal {
  id: number;
  job: Job;
  freelancer: User;
  cover_letter: string;
  proposed_price: number;
  delivery_time: number;
  questions?: string;
  attachments?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: Category;
  instructor: User;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_hours: number;
  price: number;
  thumbnail?: string;
  prerequisites?: string;
  learning_outcomes: string;
  status: 'draft' | 'published' | 'archived';
  enrollment_count: number;
  rating: number;
  total_reviews: number;
  is_enrolled?: boolean;
  created_at: string;
}

export interface Enrollment {
  id: number;
  student: User;
  course: Course;
  status: 'active' | 'completed' | 'dropped' | 'suspended';
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string;
}

export interface SkillAssessment {
  id: number;
  title: string;
  description: string;
  skill_name: string;
  category: Category;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  time_limit_minutes: number;
  passing_score: number;
  questions_count: number;
  user_attempts: number;
  best_score?: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}