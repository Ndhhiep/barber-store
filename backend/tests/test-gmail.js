// Test script for sending emails via Gmail SMTP
require('dotenv').config();
const path = require('path');

// Import the email utility
const emailUtils = require('../utils/emailUtils');
const { sendBookingConfirmationEmail } = emailUtils;

// Create a mock booking object
const mockBooking = {
  _id: '123456789',
  name: 'Test User',
  email: process.env.TEST_EMAIL || 'your_test_email@example.com', // recipient email
  service: 'Classic Haircut',
  date: new Date().toISOString(),
  time: '15:00',
  barber_name: 'John Barber'
};

// Create a mock token
const mockToken = 'test-token-123456789';

// Base URL for the frontend
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Run the test
async function testGmailSending() {
  console.log('Sending test email to Gmail...');
  
  try {
    const result = await sendBookingConfirmationEmail({
      to: mockBooking.email,
      booking: mockBooking,
      token: mockToken,
      baseUrl: baseUrl
    });
    
    console.log('Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testGmailSending();

console.log('\n=====================================================');
console.log('IMPORTANT GMAIL SETUP INSTRUCTIONS:');
console.log('=====================================================');
console.log('1. Make sure to update the .env file with your Gmail credentials:');
console.log('   - EMAIL_USER or GMAIL_USER = your Gmail address');
console.log('   - EMAIL_PASSWORD or GMAIL_APP_PASSWORD = your app password');
console.log('2. To generate an app password for Gmail:');
console.log('   - Go to your Google Account > Security');
console.log('   - Enable 2-Step Verification if not already enabled');
console.log('   - Go to App passwords and generate a new password');
console.log('   - Select "Mail" and "Other (Custom name)" and enter "The Gentlemans Cut"');
console.log('   - Copy the generated password and paste it in your .env file');
console.log('3. Make sure your Gmail account allows less secure apps or is using app passwords');
console.log('=====================================================');
