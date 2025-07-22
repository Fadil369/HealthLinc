// Database models for HealthFlicks
// This would typically be in src/types/healthflicks.ts

export interface HealthVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  categoryId: string;
  creatorId: string;
  medicalReviewStatus: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  order: number;
}

export interface HealthcareProfessional {
  id: string;
  userId: string;
  licenseNumber: string;
  specialization: string;
  institution: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate?: string;
  credentials: string[];
  bio: string;
  profileImage: string;
}

export interface VideoInteraction {
  id: string;
  userId: string;
  videoId: string;
  interactionType: 'view' | 'like' | 'save' | 'share' | 'complete';
  timestamp: string;
  sessionId: string;
  metadata?: {
    watchTime?: number;
    completion?: number;
    shareDestination?: string;
  };
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  parentId?: string;
  isApproved: boolean;
  moderatedBy?: string;
  moderationNote?: string;
  createdAt: string;
}

export interface VideoCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  totalLikes: number;
  totalSaves: number;
  totalShares: number;
  totalComments: number;
  avgWatchTime: number;
  completionRate: number;
  engagementRate: number;
  demographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
    professions: Record<string, number>;
  };
}

export interface UserRecommendation {
  userId: string;
  videoId: string;
  score: number;
  reasons: string[];
  createdAt: string;
}

// Database schema for KV storage
export interface HealthFlicksKVData {
  [`video:${string}`]: HealthVideo;
  [`category:${string}`]: VideoCategory;
  [`professional:${string}`]: HealthcareProfessional;
  [`interaction:${string}`]: VideoInteraction;
  [`comment:${string}`]: VideoComment;
  [`collection:${string}`]: VideoCollection;
  [`analytics:${string}`]: VideoAnalytics;
  [`recommendation:${string}:${string}`]: UserRecommendation;
  [`user:${string}:feed`]: string[]; // video IDs for user's feed
  [`user:${string}:liked`]: string[]; // liked video IDs
  [`user:${string}:saved`]: string[]; // saved video IDs
  [`video:${string}:comments`]: string[]; // comment IDs for a video
  [`trending:${string}`]: string[]; // trending video IDs by category
  [`professional:${string}:videos`]: string[]; // video IDs by professional
}