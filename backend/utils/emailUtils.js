const nodemailer = require('nodemailer');

/**
 * Cấu hình transporter email (cài đặt SMTP)
 * Trong production, bạn nên sử dụng thông tin thật. Với development, chúng ta sử dụng
 * tài khoản test để ghi email ra console.
 */
const configureTransporter = async () => {
  // Sử dụng Gmail SMTP để gửi email
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Using configured email provider:', process.env.EMAIL_HOST);
    return {
      transporter: nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }),
      isTestAccount: false
    };
  }
  
  // Sử dụng cấu hình Gmail mặc định nếu không có cấu hình cụ thể
  console.log('Using default Gmail SMTP configuration');
  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true cho cổng 465, false cho các cổng khác
      auth: {
        user: process.env.GMAIL_USER || 'your_gmail@gmail.com', // thay đổi trong file .env
        pass: process.env.GMAIL_APP_PASSWORD || 'your_app_password' // thay đổi trong file .env với Gmail App Password
      }
    }),
    isTestAccount: false
  };
};

/**
 * Gửi email xác nhận đặt lịch
 * @param {Object} options - Tùy chọn email
 * @param {string} options.to - Email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {Object} options.booking - Thông tin booking
 * @param {string} options.token - Token xác nhận
 * @param {string} options.baseUrl - URL cơ sở của frontend
 */
const sendBookingConfirmationEmail = async (options) => {
  try {
    const { transporter, isTestAccount } = await configureTransporter();
      const { to, subject, booking, token, baseUrl } = options;
    const confirmationLink = `${baseUrl}/booking-confirmed?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"The Gentlemans Cut" <barbershop@example.com>',
      to,
      subject: subject || 'Confirm Your Barber Shop Appointment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">The Gentleman's Cut</h1>
            <p style="color: #777; font-size: 16px; margin-top: 0;">Your Premium Barber Shop Experience</p>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello ${booking.name},</p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Thank you for booking an appointment with The Gentleman's Cut. Please confirm your booking by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Confirm Appointment</a>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">Appointment Details:</h2>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Service:</strong> ${booking.service}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Time:</strong> ${booking.time}</p>
            ${booking.barber_name ? `<p style="margin: 10px 0; font-size: 16px;"><strong>Barber:</strong> ${booking.barber_name}</p>` : ''}
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 10px;">If you did not make this booking, please ignore this email.</p>
          
          <p style="font-size: 14px; color: #777; margin-bottom: 10px;"><strong>Note:</strong> This confirmation link will expire in 24 hours.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} The Gentleman's Cut. All rights reserved.</p>
            <p>123 Barber Street, Your City, State 12345</p>
          </div>
        </div>
      `
    };
      const info = await transporter.sendMail(mailOptions);
    
    const result = {
      messageId: info.messageId,
      success: true
    };
    
    // Với email test, bao gồm URL xem trước
    if (isTestAccount) {
      const previewURL = nodemailer.getTestMessageUrl(info);
      console.log('Test email sent: %s', info.messageId);
      console.log('Preview URL: %s', previewURL);
      result.testEmailUrl = previewURL;
    } else {
      // Với email thật (ví dụ Gmail)
      console.log('Email sent successfully. Message ID:', info.messageId);
      console.log('Email sent to:', to);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmationEmail
};
