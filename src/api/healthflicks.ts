// HealthFlicks API routes for Cloudflare Workers
// This would be in src/api/healthflicks.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { createLogger } from '../utils/logger';
import type { 
  HealthVideo, 
  VideoCategory, 
  HealthcareProfessional, 
  VideoInteraction,
  VideoComment,
  VideoCollection,
  VideoAnalytics 
} from '../types/healthflicks';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', jwt({
  secret: process.env.JWT_SECRET || 'default-secret',
  cookie: 'auth-token'
}));

// Video feed endpoints
app.get('/feed/:userId', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const category = c.req.query('category');

  try {
    // Get user's personalized feed
    const feedKey = `user:${userId}:feed`;
    const feedData = await c.env.BRAINSAIT_KV.get(feedKey);
    let videoIds: string[] = [];

    if (feedData) {
      videoIds = JSON.parse(feedData);
    } else {
      // Generate initial feed based on trending and user preferences
      const trendingKey = category ? `trending:${category}` : 'trending:all';
      const trendingData = await c.env.BRAINSAIT_KV.get(trendingKey);
      videoIds = trendingData ? JSON.parse(trendingData) : [];
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageVideoIds = videoIds.slice(startIndex, endIndex);

    // Fetch video details
    const videos: HealthVideo[] = [];
    for (const videoId of pageVideoIds) {
      const videoData = await c.env.BRAINSAIT_KV.get(`video:${videoId}`);
      if (videoData) {
        videos.push(JSON.parse(videoData));
      }
    }

    logger.info('Feed fetched successfully', { userId, page, limit, videoCount: videos.length });

    return c.json({
      videos,
      pagination: {
        page,
        limit,
        total: videoIds.length,
        hasMore: endIndex < videoIds.length
      }
    });
  } catch (error) {
    logger.error('Error fetching feed', error as Error, { userId, page, limit });
    return c.json({ error: 'Failed to fetch feed' }, 500);
  }
});

// Video upload endpoint
app.post('/upload', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  const body = await c.req.json();
  const userId = c.get('jwtPayload').userId;

  try {
    // Validate healthcare professional
    const professionalData = await c.env.BRAINSAIT_KV.get(`professional:${userId}`);
    if (!professionalData) {
      return c.json({ error: 'Must be a verified healthcare professional to upload' }, 403);
    }

    const professional: HealthcareProfessional = JSON.parse(professionalData);
    if (professional.verificationStatus !== 'verified') {
      return c.json({ error: 'Professional verification required' }, 403);
    }

    // Create video record
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const video: HealthVideo = {
      id: videoId,
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl,
      duration: body.duration,
      categoryId: body.categoryId,
      creatorId: userId,
      medicalReviewStatus: 'pending',
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store video
    await c.env.BRAINSAIT_KV.put(`video:${videoId}`, JSON.stringify(video));

    // Add to professional's video list
    const professionalVideosKey = `professional:${userId}:videos`;
    const existingVideos = await c.env.BRAINSAIT_KV.get(professionalVideosKey);
    const videoIds = existingVideos ? JSON.parse(existingVideos) : [];
    videoIds.push(videoId);
    await c.env.BRAINSAIT_KV.put(professionalVideosKey, JSON.stringify(videoIds));

    logger.info('Video uploaded successfully', { videoId, userId, title: body.title });

    return c.json({ video, message: 'Video uploaded successfully. Pending medical review.' }, 201);
  } catch (error) {
    logger.error('Error uploading video', error as Error, { userId });
    return c.json({ error: 'Failed to upload video' }, 500);
  }
});

// Video interaction endpoint
app.post('/:videoId/interact', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  const videoId = c.req.param('videoId');
  const userId = c.get('jwtPayload').userId;
  const body = await c.req.json();

  try {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const interaction: VideoInteraction = {
      id: interactionId,
      userId,
      videoId,
      interactionType: body.type,
      timestamp: new Date().toISOString(),
      sessionId: body.sessionId || 'unknown',
      metadata: body.metadata
    };

    // Store interaction
    await c.env.BRAINSAIT_KV.put(`interaction:${interactionId}`, JSON.stringify(interaction));

    // Update user's interaction lists
    if (body.type === 'like') {
      const likedKey = `user:${userId}:liked`;
      const likedData = await c.env.BRAINSAIT_KV.get(likedKey);
      const likedVideos = likedData ? JSON.parse(likedData) : [];
      
      if (body.isLiked) {
        likedVideos.push(videoId);
      } else {
        const index = likedVideos.indexOf(videoId);
        if (index > -1) likedVideos.splice(index, 1);
      }
      
      await c.env.BRAINSAIT_KV.put(likedKey, JSON.stringify(likedVideos));
    }

    if (body.type === 'save') {
      const savedKey = `user:${userId}:saved`;
      const savedData = await c.env.BRAINSAIT_KV.get(savedKey);
      const savedVideos = savedData ? JSON.parse(savedData) : [];
      
      if (body.isSaved) {
        savedVideos.push(videoId);
      } else {
        const index = savedVideos.indexOf(videoId);
        if (index > -1) savedVideos.splice(index, 1);
      }
      
      await c.env.BRAINSAIT_KV.put(savedKey, JSON.stringify(savedVideos));
    }

    logger.info('Video interaction recorded', { videoId, userId, type: body.type });

    return c.json({ success: true, interaction });
  } catch (error) {
    logger.error('Error recording interaction', error as Error, { videoId, userId });
    return c.json({ error: 'Failed to record interaction' }, 500);
  }
});

// Categories endpoint
app.get('/categories', async (c) => {
  const logger = createLogger(c.req.raw, c.env);

  try {
    // This would typically be stored in KV or a database
    const categories: VideoCategory[] = [
      {
        id: 'preventive-care',
        name: 'Preventive Care',
        description: 'Tips for maintaining health and preventing illness',
        icon: 'shield',
        color: '#10b981',
        order: 1
      },
      {
        id: 'emergency-care',
        name: 'Emergency Care',
        description: 'Critical information for emergency situations',
        icon: 'alert-triangle',
        color: '#ef4444',
        order: 2
      },
      {
        id: 'medication-safety',
        name: 'Medication Safety',
        description: 'Safe use and understanding of medications',
        icon: 'pill',
        color: '#8b5cf6',
        order: 3
      },
      {
        id: 'mental-health',
        name: 'Mental Health',
        description: 'Mental wellness and psychological health',
        icon: 'brain',
        color: '#06b6d4',
        order: 4
      },
      {
        id: 'nutrition',
        name: 'Nutrition & Wellness',
        description: 'Healthy eating and lifestyle choices',
        icon: 'apple',
        color: '#65a30d',
        order: 5
      },
      {
        id: 'procedures',
        name: 'Medical Procedures',
        description: 'Understanding common medical procedures',
        icon: 'stethoscope',
        color: '#dc2626',
        order: 6
      }
    ];

    return c.json({ categories });
  } catch (error) {
    logger.error('Error fetching categories', error as Error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// Professional verification endpoint
app.post('/professionals/verify', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  const body = await c.req.json();
  const userId = c.get('jwtPayload').userId;

  try {
    const professionalId = `professional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const professional: HealthcareProfessional = {
      id: professionalId,
      userId,
      licenseNumber: body.licenseNumber,
      specialization: body.specialization,
      institution: body.institution,
      verificationStatus: 'pending',
      credentials: body.credentials || [],
      bio: body.bio || '',
      profileImage: body.profileImage || ''
    };

    await c.env.BRAINSAIT_KV.put(`professional:${userId}`, JSON.stringify(professional));

    logger.info('Professional verification submitted', { userId, specialization: body.specialization });

    return c.json({ 
      professional, 
      message: 'Verification submitted successfully. Review pending.' 
    }, 201);
  } catch (error) {
    logger.error('Error submitting professional verification', error as Error, { userId });
    return c.json({ error: 'Failed to submit verification' }, 500);
  }
});

// Analytics endpoint
app.get('/analytics/:videoId', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  const videoId = c.req.param('videoId');
  const userId = c.get('jwtPayload').userId;

  try {
    // Verify user owns the video or is an admin
    const videoData = await c.env.BRAINSAIT_KV.get(`video:${videoId}`);
    if (!videoData) {
      return c.json({ error: 'Video not found' }, 404);
    }

    const video: HealthVideo = JSON.parse(videoData);
    if (video.creatorId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const analyticsData = await c.env.BRAINSAIT_KV.get(`analytics:${videoId}`);
    if (!analyticsData) {
      return c.json({ error: 'Analytics not available' }, 404);
    }

    const analytics: VideoAnalytics = JSON.parse(analyticsData);

    logger.info('Analytics fetched', { videoId, userId });

    return c.json({ analytics });
  } catch (error) {
    logger.error('Error fetching analytics', error as Error, { videoId, userId });
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

export default app;