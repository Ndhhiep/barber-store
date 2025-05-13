const path = require('path');
const fs = require('fs');

// First try to find .env in the current directory
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
  require('dotenv').config();
} else {
  // If not found, try to load from parent directory (backend root)
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Try to determine the right path for emailUtils
let emailUtils;
try {
  // First try relative to current directory
  emailUtils = require('../utils/emailUtils');
} catch (error) {
  try {
    // If that fails, try from the tests directory
    emailUtils = require(path.join(__dirname, '../utils/emailUtils'));
  } catch (innerError) {
    console.error('Error importing emailUtils:', innerError);
    process.exit(1);
  }
}

const { sendBookingConfirmationEmail } = emailUtils;

async function testEmailSending() {
  console.log('Starting email test...');
  console.log('Current directory:', process.cwd());
  
  try {
    console.log('Creating test booking data...');
    const testBooking = {
      _id: '123456789012345678901234',
      name: 'Test User',
      service: 'Haircut and Beard Trim',
      date: new Date(),
      time: '14:30',
      email: 'test@example.com',
      barber_name: 'John Doe'
    };

    console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
    console.log('Sending test confirmation email to:', testBooking.email);
    
    const result = await sendBookingConfirmationEmail({
      to: testBooking.email,
      booking: testBooking,
      token: 'test-token-123456',
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

    console.log('\n✅ Email sent successfully!');
    console.log('📝 Test message ID:', result.messageId);
    
    // If using Ethereal, show the preview URL
    if (result.testEmailUrl) {
      console.log('🔗 Preview URL:', result.testEmailUrl);
      console.log('\nOpen this URL in your browser to view the test email');
    }
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\nModule not found error. Make sure you are running this script from the backend directory.');
      console.error('Try running: cd backend && node tests/test-email.js');
    }
  }
}

testEmailSending();
