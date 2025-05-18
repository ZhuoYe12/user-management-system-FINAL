const nodemailer = require('nodemailer');
const config = require('config.json');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    console.log('Creating email transporter with config:', {
        host: config.smtpOptions.host,
        port: config.smtpOptions.port,
        user: config.smtpOptions.auth.user
    });
    
    const transporter = nodemailer.createTransport(config.smtpOptions);
    
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    
    try {
        const info = await transporter.sendMail({ from, to, subject, html });
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}