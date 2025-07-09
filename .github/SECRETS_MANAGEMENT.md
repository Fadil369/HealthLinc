# 🔐 GitHub Actions Secrets Management Guide

## Overview
This guide provides instructions for setting up all required secrets for the HealthLinc CI/CD pipeline, ensuring secure handling of API keys, database credentials, and other sensitive information.

## Required Secrets

### 🐳 Docker Hub Integration
```bash
# Docker Hub credentials for image publishing
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

### ☁️ Cloudflare Workers
```bash
# Cloudflare API token for Workers deployment
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

### 🔧 Server Deployment (VPS)
```bash
# SSH credentials for VPS deployment
SSH_PRIVATE_KEY=your-private-ssh-key
SSH_USER=your-ssh-username
SSH_HOST=your-server-hostname-or-ip

# Raspberry Pi 5 deployment
RPI5_SSH_USER=pi
RPI5_SSH_HOST=your-rpi5-ip-address
```

### 🚀 Render Deployment
```bash
# Render deploy hook URL
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/your-service-id
```

### 💬 Notification Services
```bash
# Slack webhook for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Telegram bot integration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 📊 Code Coverage
```bash
# Codecov token for coverage reporting
CODECOV_TOKEN=your-codecov-token
```

### 🏥 Healthcare API Keys
```bash
# NPHIES (Saudi Healthcare) Integration
NPHIES_CLIENT_ID=your-nphies-client-id
NPHIES_CLIENT_SECRET=your-nphies-client-secret
NPHIES_BASE_URL=https://api.nphies.sa

# Stripe payment processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# OpenAI for AI features
OPENAI_API_KEY=sk-your-openai-api-key

# JWT secret for authentication
JWT_SECRET=your-jwt-secret-key
```

### 🗄️ Database Credentials
```bash
# PostgreSQL database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=healthlinc
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Redis for caching
REDIS_URL=redis://your-redis-host:6379
```

## Setting Up Secrets

### 1. GitHub Repository Secrets
Navigate to your GitHub repository → Settings → Secrets and variables → Actions

Click "New repository secret" and add each secret from the list above.

### 2. Environment-Specific Secrets
Create environment-specific secrets for staging and production:

#### Staging Environment
- `SSH_HOST_STAGING`
- `DB_HOST_STAGING`
- `RENDER_DEPLOY_HOOK_URL_STAGING`

#### Production Environment
- `SSH_HOST_PRODUCTION`
- `DB_HOST_PRODUCTION`
- `RENDER_DEPLOY_HOOK_URL_PRODUCTION`

### 3. Healthcare Compliance Secrets
For HIPAA compliance, ensure these secrets are properly configured:

```bash
# Encryption keys for PHI data
PHI_ENCRYPTION_KEY=your-phi-encryption-key
AUDIT_LOG_ENCRYPTION_KEY=your-audit-log-encryption-key

# Healthcare data access tokens
HEALTHCARE_API_TOKEN=your-healthcare-api-token
MEDICAL_RECORDS_API_KEY=your-medical-records-api-key
```

## Security Best Practices

### 🔒 Secret Rotation
- Rotate secrets every 90 days
- Use automated secret rotation where possible
- Monitor secret usage in CI/CD logs

### 🛡️ Access Control
- Limit secret access to necessary environments only
- Use separate secrets for staging and production
- Implement least privilege principle

### 📋 Audit Trail
- Log all secret access attempts
- Monitor for unauthorized secret usage
- Set up alerts for secret rotation failures

### 🏥 Healthcare Compliance
- Encrypt all PHI-related secrets
- Implement proper access controls for healthcare data
- Maintain audit logs for compliance reporting

## Validation Commands

### Test Slack Integration
```bash
curl -X POST $SLACK_WEBHOOK_URL \
-H "Content-Type: application/json" \
-d '{"text": "✅ Slack integration test successful!"}'
```

### Test Telegram Integration
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
-d "chat_id=$TELEGRAM_CHAT_ID" \
-d "text=✅ Telegram integration test successful!"
```

### Test Docker Hub Authentication
```bash
echo $DOCKERHUB_TOKEN | docker login -u $DOCKERHUB_USERNAME --password-stdin
```

### Test SSH Connection
```bash
ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "echo 'SSH connection successful'"
```

## Troubleshooting

### Common Issues

1. **Docker Hub Authentication Failed**
   - Verify username and token are correct
   - Ensure token has push permissions

2. **Slack Notifications Not Working**
   - Check webhook URL format
   - Verify webhook permissions in Slack

3. **SSH Connection Failed**
   - Verify private key format (should be base64 encoded)
   - Check server firewall settings

4. **Cloudflare Deployment Failed**
   - Verify API token permissions
   - Check Cloudflare account limits

### Healthcare Compliance Issues

1. **PHI Encryption Errors**
   - Verify encryption keys are properly formatted
   - Check key rotation schedule

2. **Audit Log Failures**
   - Verify audit log encryption key
   - Check storage permissions

3. **NPHIES Integration Issues**
   - Verify client credentials
   - Check API endpoint availability

## Monitoring and Alerting

### Set up monitoring for:
- Secret expiration dates
- Failed authentication attempts
- Unauthorized access attempts
- Compliance violations

### Configure alerts for:
- Secret rotation failures
- Healthcare data access violations
- CI/CD pipeline failures
- Security scan findings

## Support

For issues with secrets management:
1. Check GitHub Actions logs
2. Verify secret format and permissions
3. Contact DevOps team for healthcare compliance issues
4. Escalate security incidents immediately

---

**⚠️ Important**: Never commit secrets to version control. Always use GitHub Secrets or environment variables for sensitive information.