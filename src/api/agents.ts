import { Hono } from 'hono';
import { Env } from '../worker';
import { authenticateJWT } from '../auth/session';

export const agentsRoutes = new Hono<{ Bindings: Env }>();

// AI Agents available in BrainSAIT
const AGENTS = {
  doculinc: {
    name: 'DocuLinc',
    description: 'Clinical documentation and coding assistance',
    model: '@cf/meta/llama-2-7b-chat-int8',
    systemPrompt: 'You are DocuLinc, an AI assistant specialized in clinical documentation and medical coding. Help healthcare providers with accurate documentation, ICD-10 coding, and clinical note optimization.'
  },
  claimlinc: {
    name: 'ClaimLinc',
    description: 'Insurance claims optimization',
    model: '@cf/meta/llama-2-7b-chat-int8',
    systemPrompt: 'You are ClaimLinc, an AI assistant specialized in insurance claims processing and optimization. Help with claim submissions, denials management, and revenue cycle optimization.'
  },
  recordlinc: {
    name: 'RecordLinc',
    description: 'Medical records management',
    model: '@cf/meta/llama-2-7b-chat-int8',
    systemPrompt: 'You are RecordLinc, an AI assistant for medical records management. Help organize, analyze, and maintain patient medical records efficiently and accurately.'
  },
  datalinc: {
    name: 'DataLinc',
    description: 'Analytics and visualization',
    model: '@cf/meta/llama-2-7b-chat-int8',
    systemPrompt: 'You are DataLinc, an AI assistant for healthcare analytics and data visualization. Help analyze clinical data, generate insights, and create meaningful reports.'
  },
  telelinc: {
    name: 'TeleLinc',
    description: 'Telehealth integration',
    model: '@cf/meta/llama-2-7b-chat-int8',
    systemPrompt: 'You are TeleLinc, an AI assistant for telehealth services. Help facilitate remote consultations, patient monitoring, and virtual care coordination.'
  }
};

// Get available agents
agentsRoutes.get('/', async (c) => {
  try {
    // Verify authentication
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      agents: Object.entries(AGENTS).map(([id, agent]) => ({
        id,
        ...agent,
        status: 'available'
      }))
    });

  } catch (error) {
    console.error('Get agents error:', error);
    return c.json({ 
      error: 'Failed to get agents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Chat with a specific agent
agentsRoutes.post('/:agentId/chat', async (c) => {
  try {
    // Verify authentication
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const agentId = c.req.param('agentId');
    const agent = AGENTS[agentId as keyof typeof AGENTS];

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    const body = await c.req.json();
    const { message, sessionId, context } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Check if AI binding is available
    if (!c.env.AI) {
      return c.json({ error: 'AI service not available' }, 503);
    }

    // Prepare conversation context
    const messages = [
      { role: 'system', content: agent.systemPrompt }
    ];

    // Add context if provided (previous conversation, patient data, etc.)
    if (context && Array.isArray(context)) {
      messages.push(...context);
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Get AI response
    const aiResponse = await c.env.AI.run(agent.model, { messages });

    const response = {
      agent: {
        id: agentId,
        name: agent.name
      },
      message: aiResponse.response || 'I apologize, but I couldn\'t generate a response at this time.',
      sessionId: sessionId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: payload.userId,
      status: 'success'
    };

    // Store conversation in KV for session management
    if (sessionId) {
      const sessionKey = `session:${sessionId}`;
      const existingSession = await c.env.BRAINSAIT_KV.get(sessionKey);
      
      let sessionData = existingSession ? JSON.parse(existingSession) : {
        id: sessionId,
        agentId,
        userId: payload.userId,
        messages: [],
        createdAt: new Date().toISOString()
      };

      sessionData.messages.push(
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response.message, timestamp: new Date().toISOString() }
      );
      sessionData.updatedAt = new Date().toISOString();

      // Keep only last 20 messages to manage storage
      if (sessionData.messages.length > 20) {
        sessionData.messages = sessionData.messages.slice(-20);
      }

      await c.env.BRAINSAIT_KV.put(sessionKey, JSON.stringify(sessionData), {
        expirationTtl: 7 * 24 * 60 * 60 // 7 days
      });
    }

    return c.json(response);

  } catch (error) {
    console.error('Agent chat error:', error);
    return c.json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get chat session history
agentsRoutes.get('/sessions/:sessionId', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const sessionData = await c.env.BRAINSAIT_KV.get(`session:${sessionId}`);

    if (!sessionData) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const session = JSON.parse(sessionData);

    // Verify user owns this session
    if (session.userId !== payload.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json(session);

  } catch (error) {
    console.error('Get session error:', error);
    return c.json({ 
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user's chat sessions
agentsRoutes.get('/sessions', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Note: In a production setup, you'd want to index sessions by userId
    // For now, this is a simplified implementation
    return c.json({
      sessions: [],
      message: 'Session listing requires additional indexing setup'
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    return c.json({ 
      error: 'Failed to get sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete a chat session
agentsRoutes.delete('/sessions/:sessionId', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const sessionData = await c.env.BRAINSAIT_KV.get(`session:${sessionId}`);

    if (!sessionData) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const session = JSON.parse(sessionData);

    // Verify user owns this session
    if (session.userId !== payload.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.BRAINSAIT_KV.delete(`session:${sessionId}`);

    return c.json({ message: 'Session deleted successfully' });

  } catch (error) {
    console.error('Delete session error:', error);
    return c.json({ 
      error: 'Failed to delete session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
