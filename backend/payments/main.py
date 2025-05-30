from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import httpx
import stripe
import os
import uuid
from datetime import datetime, timedelta
import jwt
from jwt.exceptions import InvalidTokenError

# Initialize FastAPI app
app = FastAPI(title="NPHIES Payments Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify your allowed origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_test_key")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Models
class CustomerCreate(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    organization: Optional[str] = None

class SubscriptionCreate(BaseModel):
    customer_id: str
    price_id: str
    payment_method_id: str
    
class PaymentMethod(BaseModel):
    type: str = "card"
    card_number: str
    exp_month: int
    exp_year: int
    cvc: str
    
class PaymentIntent(BaseModel):
    amount: int  # in cents
    currency: str = "sar"
    customer_id: Optional[str] = None
    payment_method_id: Optional[str] = None
    description: Optional[str] = None

# Authentication dependency
async def get_current_user(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or "Bearer " not in auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split("Bearer ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if token is expired
        if payload.get("exp") < datetime.utcnow().timestamp():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "role": payload.get("role"),
        }
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Subscription plans
SUBSCRIPTION_PLANS = {
    "basic": {
        "id": "price_basic",
        "name": "Basic",
        "price": 499,  # SAR 499/month
        "description": "Up to 100 claims/month",
        "features": ["100 claims per month", "Basic reporting", "Email support"],
    },
    "professional": {
        "id": "price_professional",
        "name": "Professional",
        "price": 999,  # SAR 999/month
        "description": "Up to 500 claims/month",
        "features": ["500 claims per month", "Advanced reporting", "Priority support", "Batch processing"],
    },
    "enterprise": {
        "id": "price_enterprise",
        "name": "Enterprise",
        "price": 2499,  # SAR 2499/month
        "description": "Unlimited claims/month",
        "features": ["Unlimited claims", "Custom reporting", "24/7 support", "API access", "Dedicated account manager"],
    }
}

# Routes
@app.get("/")
async def root():
    return {"message": "NPHIES Payments Service"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

# Stripe Customers
@app.post("/customers")
async def create_customer(customer: CustomerCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        stripe_customer = stripe.Customer.create(
            email=customer.email,
            name=customer.name,
            phone=customer.phone,
            metadata={
                "organization": customer.organization,
                "user_id": current_user["user_id"]
            }
        )
        
        return {
            "id": stripe_customer.id,
            "email": stripe_customer.email,
            "name": stripe_customer.name,
            "created": datetime.fromtimestamp(stripe_customer.created).isoformat()
        }
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating customer: {str(e)}"
        )

@app.get("/subscription/status")
async def get_user_subscription_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        # Find customer by user_id in metadata
        customers = stripe.Customer.list(
            limit=1,
            expand=["data.subscriptions"],
            metadata={"user_id": current_user["user_id"]}
        )
        
        if not customers.data:
            return {
                "status": "no_subscription",
                "customer": None,
                "subscription": None,
                "plan": None
            }
            
        customer = customers.data[0]
        
        # Check if customer has active subscriptions
        if not customer.subscriptions.data:
            return {
                "status": "no_subscription",
                "customer": customer.id,
                "subscription": None,
                "plan": None
            }
            
        subscription = customer.subscriptions.data[0]
        price_id = subscription.items.data[0].price.id
        
        # Find plan details based on price_id
        plan_info = None
        for plan_key, plan in SUBSCRIPTION_PLANS.items():
            if plan["id"] == price_id:
                plan_info = {
                    "key": plan_key,
                    **plan
                }
                break
                
        return {
            "status": subscription.status,
            "customer": customer.id,
            "subscription": {
                "id": subscription.id,
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end).isoformat(),
                "cancel_at_period_end": subscription.cancel_at_period_end,
            },
            "plan": plan_info
        }
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving subscription status: {str(e)}"
        )

# Webhook for handling Stripe events
@app.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook_received(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Handle successful payment
        print(f"Payment succeeded: {payment_intent['id']}")
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        # Handle failed payment
        print(f"Payment failed: {payment_intent['id']}")
    elif event['type'] == 'customer.subscription.created':
        subscription = event['data']['object']
        # Handle subscription created
        print(f"Subscription created: {subscription['id']}")
    
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
