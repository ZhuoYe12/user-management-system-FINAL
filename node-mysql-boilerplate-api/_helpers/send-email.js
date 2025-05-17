const nodemailer = require('nodemailer');

// Create reusable transporter object using Ethereal SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'mayra.nitzsche@ethereal.email',
    pass: 'f7xwXSa7FrphMf4xnG'
  }
});

/**
 * Send email function
 * @param {Object} params
 * @param {string} params.to - recipient email
 * @param {string} params.subject - email subject
 * @param {string} params.html - email HTML content
 * @param {string} [params.from] - sender email (optional)
 */
async function sendEmail({ to, subject, html, from = 'info@node-mysql-signup-verification-api.com' }) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Example usage (uncomment to test)
/*
(async () => {
  try {
    await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email via Ethereal',
      html: '<h2>Hello from Ethereal SMTP!</h2><p>This is a test email.</p>'
    });
  } catch (error) {
    console.error(error);
  }
})();
*/

module.exports = sendEmail;
