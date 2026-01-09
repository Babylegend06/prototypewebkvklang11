# WhatsApp Integration Setup - WasapBot.my

## 🚨 Current Status
WhatsApp API returning error: **"Instance ID Invalidated"**

This means the Instance ID is either:
1. Invalid/incorrect
2. WhatsApp account logged out from WasapBot.my dashboard
3. Need to create new instance

## ✅ How to Fix

### Step 1: Login to WasapBot.my Dashboard
1. Go to: https://dash.wasapbot.my/
2. Login with your account

### Step 2: Check WhatsApp Instance
1. Navigate to "Instances" or "My Instances"
2. Check if your WhatsApp is connected (should show green/online status)
3. If logged out, click "Connect" or "Login" to scan QR code with WhatsApp

### Step 3: Get Correct Credentials
1. Once instance is active, find:
   - **Instance ID**: (example: `67A8B9C012345`)
   - **Access Token**: (example: `abc123def456xyz`)
2. Copy these exact values

### Step 4: Update Backend Configuration
Edit `/app/backend/.env`:

```env
WASAPBOT_INSTANCE_ID="YOUR_ACTUAL_INSTANCE_ID"
WASAPBOT_ACCESS_TOKEN="YOUR_ACTUAL_ACCESS_TOKEN"
```

**IMPORTANT**: Remove the "XXXX" placeholders with real values!

### Step 5: Restart Backend
```bash
sudo supervisorctl restart backend
```

### Step 6: Test WhatsApp API
```bash
# Test with curl (replace with your real credentials)
curl "https://dash.wasapbot.my/api/send?number=0189892155&type=text&message=Test+Smart+Dobi&instance_id=YOUR_INSTANCE_ID&access_token=YOUR_ACCESS_TOKEN"

# Expected response:
{"status":"success","message":"Message sent successfully"}

# If still error, check:
# 1. WhatsApp still connected in dashboard
# 2. Instance ID copied correctly (no spaces/typos)
# 3. Access token copied correctly
# 4. Phone number has credit/subscription active
```

## 📋 Current Configuration
```
URL: https://dash.wasapbot.my/api/send
Instance ID: 609ACF283XXXX (NEEDS UPDATE)
Access Token: 695df3770b34a (VERIFY THIS)
```

## 🔍 How to Find Your Credentials

### Method 1: Dashboard UI
1. Login to https://dash.wasapbot.my/
2. Click on your instance/phone number
3. Look for "Instance Details" or "API Settings"
4. Copy Instance ID and Access Token

### Method 2: API Tab
1. Go to "API" or "Documentation" tab
2. Your credentials should be displayed there
3. Usually shown in example curl commands

## ⚠️ Common Issues

### Issue 1: "Instance ID Invalidated"
- **Cause**: WhatsApp logged out or wrong Instance ID
- **Fix**: Reconnect WhatsApp in dashboard, get new Instance ID

### Issue 2: "Access Token Invalid"
- **Cause**: Token expired or incorrect
- **Fix**: Generate new Access Token from dashboard

### Issue 3: "Insufficient Credits"
- **Cause**: No balance in WasapBot.my account
- **Fix**: Top up credits in dashboard

### Issue 4: "Rate Limited"
- **Cause**: Too many messages sent
- **Fix**: Wait a few minutes, check rate limits

## 📞 Support
If still having issues:
1. Check WasapBot.my dashboard for any alerts
2. Contact WasapBot.my support
3. Verify WhatsApp number is business account (if required)

## 🎯 Once Fixed
After updating credentials and restarting backend, test the complete flow:

1. **Start Machine** (should send WhatsApp):
   ```bash
   curl -X POST https://iot-laundry.preview.emergentagent.com/api/machines/1/start \
     -H "Content-Type: application/json" \
     -d '{"whatsapp_number": "YOUR_PHONE", "amount": 5.00}'
   ```

2. **Check Phone**: You should receive:
   "Smart Dobi: Mesin 1 telah dimulakan! Basuhan akan siap dalam 3 minit..."

3. **Check Backend Logs**:
   ```bash
   tail -f /var/log/supervisor/backend.*.log | grep -i whatsapp
   ```
   Should see: "WhatsApp notification sent to..."

---

**Remember**: WhatsApp notifications are LIVE. Test with your own number first!
