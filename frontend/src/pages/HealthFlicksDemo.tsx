import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Heart, Bookmark, Share2, 
  MessageCircle, User, MoreHorizontal, ChevronUp, ChevronDown,
  CheckCircle, Stethoscope, Clock, Eye
} from 'lucide-react';

interface HealthVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  creator: {
    id: string;
    name: string;
    title: string;
    avatar: string;
    isVerified: boolean;
    specialization: string;
  };
  stats: {
    views: number;
    likes: number;
    saves: number;
    comments: number;
  };
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  medicalReviewStatus: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

// Mock data
const mockVideos: HealthVideo[] = [
  {
    id: '1',
    title: 'How to Check Your Blood Pressure at Home',
    description: 'Learn the proper technique for accurate blood pressure readings at home. Essential for managing hypertension effectively.',
    videoUrl: 'https://via.placeholder.com/400x600/4a90e2/ffffff?text=Blood+Pressure+Video',
    thumbnailUrl: 'https://via.placeholder.com/400x600/4a90e2/ffffff?text=Blood+Pressure',
    duration: 65,
    category: 'Preventive Care',
    creator: {
      id: 'dr-sarah-johnson',
      name: 'Dr. Sarah Johnson',
      title: 'Cardiologist',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
      isVerified: true,
      specialization: 'Cardiology'
    },
    stats: {
      views: 12500,
      likes: 982,
      saves: 347,
      comments: 89
    },
    tags: ['blood pressure', 'hypertension', 'home monitoring', 'preventive care'],
    isLiked: false,
    isSaved: false,
    medicalReviewStatus: 'approved',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Recognizing Early Signs of Stroke',
    description: 'F.A.S.T. method for identifying stroke symptoms. Time is critical - know what to look for.',
    videoUrl: 'https://via.placeholder.com/400x600/e74c3c/ffffff?text=Stroke+Signs+Video',
    thumbnailUrl: 'https://via.placeholder.com/400x600/e74c3c/ffffff?text=Stroke+Signs',
    duration: 72,
    category: 'Emergency Care',
    creator: {
      id: 'dr-michael-chen',
      name: 'Dr. Michael Chen',
      title: 'Emergency Medicine Physician',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
      isVerified: true,
      specialization: 'Emergency Medicine'
    },
    stats: {
      views: 28700,
      likes: 2341,
      saves: 1205,
      comments: 234
    },
    tags: ['stroke', 'emergency', 'symptoms', 'fast method'],
    isLiked: true,
    isSaved: true,
    medicalReviewStatus: 'approved',
    createdAt: '2024-01-14T14:20:00Z'
  }
];

// Simplified Button component
const Button = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  onClick,
  className = '',
  ...props 
}: any) => (
  <button 
    onClick={onClick}
    className={`inline-flex items-center justify-center font-medium transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Simplified Avatar component
const Avatar = ({ src, alt, size = 'md' }: any) => (
  <img 
    src={src} 
    alt={alt}
    className={`rounded-full object-cover ${size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'}`}
  />
);

// Simplified Badge component
const Badge = ({ children, className = '' }: any) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

export function HealthFlicksDemo() {
  const [videos, setVideos] = useState<HealthVideo[]>(mockVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    document.title = "HealthFlicks Demo | BrainSAIT";
  }, []);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleLike = () => {
    setVideos(prev => prev.map(video => 
      video.id === currentVideo.id 
        ? { 
            ...video, 
            isLiked: !video.isLiked,
            stats: { 
              ...video.stats, 
              likes: video.isLiked ? video.stats.likes - 1 : video.stats.likes + 1 
            }
          }
        : video
    ));
  };

  const handleSave = () => {
    setVideos(prev => prev.map(video => 
      video.id === currentVideo.id 
        ? { 
            ...video, 
            isSaved: !video.isSaved,
            stats: { 
              ...video.stats, 
              saves: video.isSaved ? video.stats.saves - 1 : video.stats.saves + 1 
            }
          }
        : video
    ));
  };

  const handleShare = () => {
    console.log('Share video:', currentVideo.id);
  };

  const nextVideo = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
    }
  };

  const previousVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
    }
  };

  const handleSwipe = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex < videos.length - 1) {
      nextVideo();
    } else if (direction === 'down' && currentIndex > 0) {
      previousVideo();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Main Video Container */}
      <div 
        ref={containerRef}
        className="h-full w-full relative"
        onClick={() => setShowControls(true)}
      >
        {/* Video Player Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
            style={{
              backgroundImage: `url(${currentVideo.thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-white text-center p-8">
              <div className="text-6xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold mb-2">{currentVideo.title}</h2>
              <p className="text-lg opacity-90">Demo Mode</p>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Swipe Navigation */}
        <motion.div
          className="absolute inset-0 z-10"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -50) {
              handleSwipe('up');
            } else if (info.offset.y > 50) {
              handleSwipe('down');
            }
          }}
        >
          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            onClick={handlePlayPause}
          >
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Navigation Hints */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex flex-col items-center space-y-2">
            <ChevronUp 
              className={`w-6 h-6 text-white transition-opacity ${
                currentIndex === 0 ? 'opacity-30' : 'opacity-70'
              }`}
            />
            <span className="text-xs text-white opacity-70">Swipe up for next</span>
          </div>
        </div>

        {/* Video Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 pointer-events-none"
            >
              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
                <Badge className="bg-blue-600 text-white">
                  {currentVideo.category}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleMute}
                    className="w-10 h-10 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button
                    className="w-10 h-10 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-auto">
                <div className="flex items-end justify-between">
                  {/* Video Info */}
                  <div className="flex-1 pr-4">
                    {/* Creator Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar
                        src={currentVideo.creator.avatar}
                        alt={currentVideo.creator.name}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium text-sm">
                            {currentVideo.creator.name}
                          </span>
                          {currentVideo.creator.isVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-300">
                          <Stethoscope className="w-3 h-3" />
                          <span>{currentVideo.creator.specialization}</span>
                        </div>
                      </div>
                    </div>

                    {/* Video Details */}
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {currentVideo.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {currentVideo.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentVideo.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(currentVideo.stats.views)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(currentVideo.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center space-y-4">
                    <Button
                      onClick={handleLike}
                      className="w-12 h-12 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 flex-col"
                    >
                      <Heart 
                        className={`w-6 h-6 ${currentVideo.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                      <span className="text-xs mt-1">
                        {formatNumber(currentVideo.stats.likes)}
                      </span>
                    </Button>

                    <Button
                      onClick={handleSave}
                      className="w-12 h-12 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 flex-col"
                    >
                      <Bookmark 
                        className={`w-6 h-6 ${currentVideo.isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} 
                      />
                      <span className="text-xs mt-1">
                        {formatNumber(currentVideo.stats.saves)}
                      </span>
                    </Button>

                    <Button
                      className="w-12 h-12 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 flex-col"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-xs mt-1">
                        {formatNumber(currentVideo.stats.comments)}
                      </span>
                    </Button>

                    <Button
                      onClick={handleShare}
                      className="w-12 h-12 rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50"
                    >
                      <Share2 className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
          <div className="flex flex-col space-y-2">
            {videos.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-8 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-blue-500' 
                    : index < currentIndex 
                      ? 'bg-gray-600' 
                      : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}