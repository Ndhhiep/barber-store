/**
 * Test script for email functionality
 * Tests the booking confirmation email with proper service names
 */

require('dotenv').config();
const { sendBookingConfirmationEmail } = require('../utils/emailUtils');

// Test booking data with service names (not ObjectIds)
const testBookingData = {
  name: 'John Doe',
  email: 'hiep.ndh1112k@gmail.com', // Change this to your test email
  phone: '0933591901',
  services: [
    'Classic Haircut',
    'Beard Trim'
  ], // Using service names instead of ObjectIds
  barber_name: 'Robert Davis',
  date: new Date('2025-06-02'),
  time: '17:00',
  _id: '6819e2foee4ae07255437ef6'
};

const testToken = 'test-token-123456789';
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testEmail() {
  try {
    console.log('🚀 Testing email with fixed service names...');
    console.log('📧 Sending to:', testBookingData.email);
    console.log('🎯 Services:', testBookingData.services);
    
    const result = await sendBookingConfirmationEmail({
      to: testBookingData.email,
      booking: testBookingData,
      token: testToken,
      baseUrl: baseUrl
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    
    if (result.testEmailUrl) {
      console.log('🔗 Test email preview URL:', result.testEmailUrl);
      console.log('\n📝 Note: This is a test email using Ethereal Email');
      console.log('   Click the preview URL above to see how the email looks');
    } else {
      console.log('📬 Real email sent to:', testBookingData.email);
      console.log('   Check your inbox for the confirmation email');
    }
    
    console.log('\n✨ Test completed successfully!');
    console.log('🎉 Service names should now display correctly in the email');
    
  } catch (error) {
    console.error('❌ Error testing email:', error);
    console.error('📄 Error details:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication error. Please check your email credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🌐 Connection refused. Please check your email server settings');
    }
  }
}

// Run the test
console.log('🧪 Starting email test...');
console.log('=' .repeat(50));
testEmail();
