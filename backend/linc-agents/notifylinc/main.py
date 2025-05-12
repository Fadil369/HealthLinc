"""
NotifyLinc Agent - Main entry point

This agent handles notifications and alerts for the HealthLinc ecosystem:
- Email notifications
- SMS notifications
- Push notifications
- Slack/Teams integrations
- Notification delivery status tracking
"""

import os
import json
import logging
import uuid
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, Optional, List, Union

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("notifylinc")

# Initialize FastAPI app
app = FastAPI(
    title="NotifyLinc Agent",
    description="LINC Agent for handling notifications and alerts",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "noreply@healthlinc.app")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "password")
SMS_API_KEY = os.environ.get("SMS_API_KEY", "your-sms-api-key")
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK", "")
TEAMS_WEBHOOK = os.environ.get("TEAMS_WEBHOOK", "")
DEFAULT_SENDER = os.environ.get("DEFAULT_SENDER", "HealthLinc <noreply@healthlinc.app>")

# Models
class EmailNotification(BaseModel):
    to: Union[List[EmailStr], EmailStr]
    subject: str
    body_text: str
    body_html: Optional[str] = None
    cc: Optional[Union[List[EmailStr], EmailStr]] = None
    bcc: Optional[Union[List[EmailStr], EmailStr]] = None
    from_email: Optional[str] = None
    reply_to: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class SMSNotification(BaseModel):
    to: Union[List[str], str]  # List of phone numbers or single phone number
    message: str
    sender_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None


class PushNotification(BaseModel):
    user_ids: List[str]
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    action_buttons: Optional[List[Dict[str, Any]]] = None


class SlackNotification(BaseModel):
    channel: str
    message: str
    blocks: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None


class TeamsNotification(BaseModel):
    title: str
    text: str
    sections: Optional[List[Dict[str, Any]]] = None
    potential_actions: Optional[List[Dict[str, Any]]] = None


class NotificationBatch(BaseModel):
    emails: Optional[List[EmailNotification]] = None
    sms: Optional[List[SMSNotification]] = None
    push: Optional[List[PushNotification]] = None
    slack: Optional[List[SlackNotification]] = None
    teams: Optional[List[TeamsNotification]] = None


class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


# Helper functions
def log_request(task: str, data: Dict[str, Any], request_id: str) -> None:
    """Log the incoming request details"""
    logger.info(f"Task: {task}, Request ID: {request_id}")
    logger.debug(f"Data: {json.dumps(data, default=str)}")  # Use default=str for serializing datetime objects


def generate_notification_id() -> str:
    """Generate a unique notification ID with NOTIF prefix"""
    return f"NOTIF-{uuid.uuid4().hex[:8].upper()}"


def send_email(notification: EmailNotification) -> Dict[str, Any]:
    """Send an email notification"""
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = notification.subject
        msg['From'] = notification.from_email or DEFAULT_SENDER
        
        # Handle to/cc/bcc fields which could be lists or single emails
        if isinstance(notification.to, list):
            msg['To'] = ', '.join(notification.to)
        else:
            msg['To'] = notification.to
            
        if notification.cc:
            if isinstance(notification.cc, list):
                msg['Cc'] = ', '.join(notification.cc)
            else:
                msg['Cc'] = notification.cc
                
        if notification.reply_to:
            msg['Reply-To'] = notification.reply_to
        
        # Attach text part
        text_part = MIMEText(notification.body_text, 'plain')
        msg.attach(text_part)
        
        # Attach HTML part if provided
        if notification.body_html:
            html_part = MIMEText(notification.body_html, 'html')
            msg.attach(html_part)
        
        # For demo purposes, just log the email details
        logger.info(f"Would send email to {msg['To']} with subject '{notification.subject}'")
        
        # In a real implementation, this would use smtplib to send the email
        # context = ssl.create_default_context()
        # with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        #     server.starttls(context=context)
        #     server.login(SMTP_USERNAME, SMTP_PASSWORD)
        #     
        #     recipients = []
        #     if isinstance(notification.to, list):
        #         recipients.extend(notification.to)
        #     else:
        #         recipients.append(notification.to)
        #     
        #     if notification.cc:
        #         if isinstance(notification.cc, list):
        #             recipients.extend(notification.cc)
        #         else:
        #             recipients.append(notification.cc)
        #     
        #     if notification.bcc:
        #         if isinstance(notification.bcc, list):
        #             recipients.extend(notification.bcc)
        #         else:
        #             recipients.append(notification.bcc)
        #     
        #     server.sendmail(
        #         SMTP_USERNAME,
        #         recipients,
        #         msg.as_string()
        #     )
        
        return {
            "notification_id": generate_notification_id(),
            "channel": "email",
            "status": "delivered",
            "recipients": notification.to,
            "sent_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}", exc_info=True)
        return {
            "notification_id": generate_notification_id(),
            "channel": "email",
            "status": "failed",
            "error": str(e),
            "recipients": notification.to,
            "sent_at": datetime.now().isoformat()
        }


def send_sms(notification: SMSNotification) -> Dict[str, Any]:
    """Send an SMS notification"""
    try:
        # For demo purposes, just log the SMS details
        recipients = notification.to if isinstance(notification.to, list) else [notification.to]
        
        logger.info(f"Would send SMS to {recipients} with message: {notification.message[:20]}...")
        
        # In a real implementation, this would use an SMS API provider like Twilio
        # twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # 
        # for recipient in recipients:
        #     message = twilio_client.messages.create(
        #         body=notification.message,
        #         from_=TWILIO_PHONE_NUMBER,
        #         to=recipient
        #     )
        
        return {
            "notification_id": generate_notification_id(),
            "channel": "sms",
            "status": "delivered",
            "recipients": notification.to,
            "sent_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}", exc_info=True)
        return {
            "notification_id": generate_notification_id(),
            "channel": "sms",
            "status": "failed",
            "error": str(e),
            "recipients": notification.to,
            "sent_at": datetime.now().isoformat()
        }


def send_push_notification(notification: PushNotification) -> Dict[str, Any]:
    """Send a push notification"""
    try:
        # For demo purposes, just log the push notification details
        logger.info(f"Would send push notification to {len(notification.user_ids)} users with title: {notification.title}")
        
        # In a real implementation, this would use an API like Firebase Cloud Messaging
        # fcm = FCMNotification(api_key=FCM_API_KEY)
        # 
        # registration_ids = get_device_tokens_for_users(notification.user_ids)
        # 
        # message_title = notification.title
        # message_body = notification.body
        # result = fcm.notify_multiple_devices(
        #     registration_ids=registration_ids,
        #     message_title=message_title,
        #     message_body=message_body,
        #     data_message=notification.data
        # )
        
        return {
            "notification_id": generate_notification_id(),
            "channel": "push",
            "status": "delivered",
            "recipients": notification.user_ids,
            "sent_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending push notification: {str(e)}", exc_info=True)
        return {
            "notification_id": generate_notification_id(),
            "channel": "push",
            "status": "failed",
            "error": str(e),
            "recipients": notification.user_ids,
            "sent_at": datetime.now().isoformat()
        }


def send_slack_notification(notification: SlackNotification) -> Dict[str, Any]:
    """Send a Slack notification"""
    try:
        # For demo purposes, just log the Slack notification details
        logger.info(f"Would send Slack notification to channel {notification.channel}: {notification.message[:20]}...")
        
        # In a real implementation, this would use the Slack API
        # import requests
        # 
        # payload = {
        #     "channel": notification.channel,
        #     "text": notification.message
        # }
        # 
        # if notification.blocks:
        #     payload["blocks"] = notification.blocks
        #     
        # if notification.attachments:
        #     payload["attachments"] = notification.attachments
        #     
        # response = requests.post(
        #     SLACK_WEBHOOK,
        #     json=payload
        # )
        # response.raise_for_status()
        
        return {
            "notification_id": generate_notification_id(),
            "channel": "slack",
            "status": "delivered",
            "recipients": [notification.channel],
            "sent_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}", exc_info=True)
        return {
            "notification_id": generate_notification_id(),
            "channel": "slack",
            "status": "failed",
            "error": str(e),
            "recipients": [notification.channel],
            "sent_at": datetime.now().isoformat()
        }


# API Routes
@app.post("/agents/notify")
async def handle_notify_request(request: Request) -> JSONResponse:
    """Main entry point for all notification-related tasks"""
    try:
        # Get the task type from header
        task = request.headers.get("X-MCP-Task")
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        if not task:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Missing X-MCP-Task header"}
            )
        
        # Parse request body
        data = await request.json()
        log_request(task, data, request_id)
        
        # Route to appropriate handler based on task
        if task == "email":
            email_data = EmailNotification(**data)
            result = send_email(email_data)
            return JSONResponse(
                content={
                    "status": "success" if result["status"] == "delivered" else "error",
                    "message": f"Email notification {result['status']}",
                    "data": result,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                },
                status_code=200 if result["status"] == "delivered" else 500
            )
            
        elif task == "sms":
            sms_data = SMSNotification(**data)
            result = send_sms(sms_data)
            return JSONResponse(
                content={
                    "status": "success" if result["status"] == "delivered" else "error",
                    "message": f"SMS notification {result['status']}",
                    "data": result,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                },
                status_code=200 if result["status"] == "delivered" else 500
            )
            
        elif task == "push":
            push_data = PushNotification(**data)
            result = send_push_notification(push_data)
            return JSONResponse(
                content={
                    "status": "success" if result["status"] == "delivered" else "error",
                    "message": f"Push notification {result['status']}",
                    "data": result,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                },
                status_code=200 if result["status"] == "delivered" else 500
            )
            
        elif task == "slack":
            slack_data = SlackNotification(**data)
            result = send_slack_notification(slack_data)
            return JSONResponse(
                content={
                    "status": "success" if result["status"] == "delivered" else "error",
                    "message": f"Slack notification {result['status']}",
                    "data": result,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                },
                status_code=200 if result["status"] == "delivered" else 500
            )
            
        elif task == "batch":
            batch_data = NotificationBatch(**data)
            results = {
                "email": [],
                "sms": [],
                "push": [],
                "slack": []
            }
            
            # Process email notifications
            if batch_data.emails:
                for email in batch_data.emails:
                    results["email"].append(send_email(email))
                    
            # Process SMS notifications
            if batch_data.sms:
                for sms in batch_data.sms:
                    results["sms"].append(send_sms(sms))
                    
            # Process push notifications
            if batch_data.push:
                for push in batch_data.push:
                    results["push"].append(send_push_notification(push))
                    
            # Process Slack notifications
            if batch_data.slack:
                for slack in batch_data.slack:
                    results["slack"].append(send_slack_notification(slack))
            
            return JSONResponse(
                content={
                    "status": "success",
                    "message": "Batch notifications processed",
                    "data": results,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
            
        else:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": f"Unknown task: {task}"}
            )
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Internal server error: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "NotifyLinc", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3004))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
