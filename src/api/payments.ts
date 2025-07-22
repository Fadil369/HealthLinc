import { Hono } from 'hono';
import { Env } from '../worker';
import { authenticateJWT } from '../auth/session';
import { createLogger } from '../utils/logger';

export const paymentsRoutes = new Hono<{ Bindings: Env }>();

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  isDefault: boolean;
  expiresAt?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  maxUsers: number;
  maxClaims: number;
}

// Available subscription plans
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential healthcare management features',
    price: 99,
    currency: 'SAR',
    interval: 'month',
    features: [
      'Patient Management',
      'Appointment Scheduling',
      'Basic Clinical Notes',
      'Claims Processing (100/month)',
      'Email Support'
    ],
    maxUsers: 5,
    maxClaims: 100
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    description: 'Advanced features for growing practices',
    price: 299,
    currency: 'SAR',
    interval: 'month',
    features: [
      'All Basic Features',
      'AI-Powered Documentation',
      'Advanced Analytics',
      'Claims Processing (500/month)',
      'Telehealth Integration',
      'Priority Support'
    ],
    maxUsers: 20,
    maxClaims: 500
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Complete solution for large healthcare organizations',
    price: 799,
    currency: 'SAR',
    interval: 'month',
    features: [
      'All Professional Features',
      'Unlimited Claims Processing',
      'Custom AI Agents',
      'Advanced RCM Optimization',
      'White-label Options',
      'Dedicated Support',
      'API Access'
    ],
    maxUsers: -1, // Unlimited
    maxClaims: -1 // Unlimited
  }
];

// Get subscription plans
paymentsRoutes.get('/plans', async (c) => {
  try {
    return c.json({ plans: SUBSCRIPTION_PLANS });
  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get subscription plans', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_subscription_plans'
    });
    return c.json({ 
      error: 'Failed to get plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user's current subscription
paymentsRoutes.get('/subscription', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get subscription from KV
    const subscriptionData = await c.env.BRAINSAIT_KV.get(`subscription:${payload.userId}`);
    
    if (!subscriptionData) {
      return c.json({
        subscription: null,
        message: 'No active subscription found'
      });
    }

    const subscription = JSON.parse(subscriptionData);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);

    return c.json({
      subscription: {
        ...subscription,
        plan
      }
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get user subscription', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_subscription',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to get subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create subscription
paymentsRoutes.post('/subscription', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { planId, paymentMethodId } = await c.req.json();

    if (!planId || !paymentMethodId) {
      return c.json({ error: 'Plan ID and payment method are required' }, 400);
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    // In real implementation, this would:
    // 1. Verify payment method with Stripe/payment processor
    // 2. Create subscription in payment processor
    // 3. Set up recurring billing

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + (plan.interval === 'year' ? 12 : 1));

    const subscription = {
      id: subscriptionId,
      userId: payload.userId,
      planId: plan.id,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: nextBilling.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      paymentMethodId,
      lastPayment: {
        amount: plan.price,
        currency: plan.currency,
        date: now.toISOString(),
        status: 'succeeded'
      }
    };

    // Store subscription
    await c.env.BRAINSAIT_KV.put(`subscription:${payload.userId}`, JSON.stringify(subscription));

    // Update user's subscription status
    const userStr = await c.env.BRAINSAIT_KV.get(`user:id:${payload.userId}`);
    if (userStr) {
      const user = JSON.parse(userStr);
      user.subscriptionId = subscriptionId;
      user.subscriptionStatus = 'active';
      user.updatedAt = now.toISOString();
      
      await c.env.BRAINSAIT_KV.put(`user:${user.email}`, JSON.stringify(user));
      await c.env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));
    }

    return c.json({
      subscription: {
        ...subscription,
        plan
      },
      message: 'Subscription created successfully'
    }, 201);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.payment('subscription_creation_failed', plan?.price, plan?.currency, payload?.userId, { planId });
    logger.error('Failed to create subscription', error instanceof Error ? error : new Error(String(error)), {
      operation: 'create_subscription',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update subscription
paymentsRoutes.put('/subscription', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { planId } = await c.req.json();

    if (!planId) {
      return c.json({ error: 'Plan ID is required' }, 400);
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    // Get current subscription
    const subscriptionData = await c.env.BRAINSAIT_KV.get(`subscription:${payload.userId}`);
    if (!subscriptionData) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    const subscription = JSON.parse(subscriptionData);
    
    // Update subscription
    subscription.planId = planId;
    subscription.updatedAt = new Date().toISOString();

    await c.env.BRAINSAIT_KV.put(`subscription:${payload.userId}`, JSON.stringify(subscription));

    return c.json({
      subscription: {
        ...subscription,
        plan
      },
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.payment('subscription_update_failed', undefined, undefined, payload?.userId, { planId });
    logger.error('Failed to update subscription', error instanceof Error ? error : new Error(String(error)), {
      operation: 'update_subscription',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Cancel subscription
paymentsRoutes.delete('/subscription', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { cancelImmediately = false } = await c.req.json().catch(() => ({}));

    // Get current subscription
    const subscriptionData = await c.env.BRAINSAIT_KV.get(`subscription:${payload.userId}`);
    if (!subscriptionData) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    const subscription = JSON.parse(subscriptionData);
    
    if (cancelImmediately) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date().toISOString();
    } else {
      subscription.cancelAtPeriodEnd = true;
      subscription.cancelAtPeriodEndDate = new Date().toISOString();
    }

    subscription.updatedAt = new Date().toISOString();

    await c.env.BRAINSAIT_KV.put(`subscription:${payload.userId}`, JSON.stringify(subscription));

    return c.json({
      subscription,
      message: cancelImmediately 
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the current period'
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.payment('subscription_cancellation_failed', undefined, undefined, payload?.userId);
    logger.error('Failed to cancel subscription', error instanceof Error ? error : new Error(String(error)), {
      operation: 'cancel_subscription',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get payment methods
paymentsRoutes.get('/payment-methods', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get payment methods from KV
    const paymentMethodsData = await c.env.BRAINSAIT_KV.get(`payment_methods:${payload.userId}`);
    const paymentMethods = paymentMethodsData ? JSON.parse(paymentMethodsData) : [];

    return c.json({ paymentMethods });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get payment methods', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_payment_methods',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to get payment methods',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Add payment method
paymentsRoutes.post('/payment-methods', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, token, setAsDefault = false } = await c.req.json();

    if (!type || !token) {
      return c.json({ error: 'Payment method type and token are required' }, 400);
    }

    // In real implementation, this would create payment method with Stripe
    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentMethod: PaymentMethod = {
      id: paymentMethodId,
      type,
      last4: '4242', // Mock data
      brand: type === 'card' ? 'visa' : undefined,
      isDefault: setAsDefault,
      expiresAt: type === 'card' ? '2028-12' : undefined
    };

    // Get existing payment methods
    const paymentMethodsData = await c.env.BRAINSAIT_KV.get(`payment_methods:${payload.userId}`);
    const paymentMethods = paymentMethodsData ? JSON.parse(paymentMethodsData) : [];

    // If setting as default, update existing methods
    if (setAsDefault) {
      paymentMethods.forEach((pm: PaymentMethod) => {
        pm.isDefault = false;
      });
    }

    paymentMethods.push(paymentMethod);

    await c.env.BRAINSAIT_KV.put(`payment_methods:${payload.userId}`, JSON.stringify(paymentMethods));

    return c.json({
      paymentMethod,
      message: 'Payment method added successfully'
    }, 201);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.payment('payment_method_addition_failed', undefined, undefined, payload?.userId, { type });
    logger.error('Failed to add payment method', error instanceof Error ? error : new Error(String(error)), {
      operation: 'add_payment_method',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to add payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get billing history
paymentsRoutes.get('/billing/history', async (c) => {
  try {
    const payload = await authenticateJWT(
      c.req.header('Authorization'),
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get billing history from KV
    const billingData = await c.env.BRAINSAIT_KV.get(`billing:${payload.userId}`);
    const billingHistory = billingData ? JSON.parse(billingData) : [];

    return c.json({ billingHistory });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get billing history', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_billing_history',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Failed to get billing history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
