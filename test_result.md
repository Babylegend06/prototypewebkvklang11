# Smart Dobi Testing

## Application Overview
Smart Dobi - IoT-integrated self-service laundry system using HTML/CSS/JavaScript + Firebase

## Test URLs
- Main Kiosk: https://iot-laundry.preview.emergentagent.com/dobi/index.html
- Payment: https://iot-laundry.preview.emergentagent.com/dobi/payment.html?machine=1
- Waiting: https://iot-laundry.preview.emergentagent.com/dobi/waiting.html?machine=1
- Instructions: https://iot-laundry.preview.emergentagent.com/dobi/instructions.html
- Dashboard: https://iot-laundry.preview.emergentagent.com/dobi/dashboard.html

## Firebase Configuration
- Database URL: https://smart-dobi-system-fyp-default-rtdb.asia-southeast1.firebasedatabase.app
- Project ID: smart-dobi-system-fyp

## Features to Test
1. Main page loads with machine cards
2. Onboarding modal shows on first visit
3. Payment page shows QR code and WhatsApp input
4. Waiting page shows instructions and animation
5. Dashboard login page shows Google login button
6. Instructions page shows step-by-step guide

## Testing Protocol
- Test each page loads correctly
- Verify Firebase connection works
- Check navigation between pages
- Verify responsive design

## Incorporate User Feedback
- User wants pure HTML/CSS/JS with Firebase (NOT React)
- Application is in Malay language
- Dark mode theme with glassmorphism UI
