import nodemailer from 'nodemailer';

// Sends a verification email. The link will prefer the frontend verification page
// if FRONTEND_BASE is provided. Otherwise it will fall back to a backend verify
// endpoint using BACKEND_BASE or localhost:PORT.
export async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Prefer sending users to the frontend verification route when set.
  // Example: FRONTEND_BASE=https://app.studytaa.com -> https://app.studytaa.com/verify-email?token=...
  const frontendBase = process.env.FRONTEND_BASE;
  const backendBase = process.env.BACKEND_BASE || `http://localhost:${process.env.PORT || 5000}`;

  const verificationUrl = frontendBase
    ? `${frontendBase.replace(/\/$/, '')}/verify-email?token=${token}`
    : `${backendBase.replace(/\/$/, '')}/api/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your StudyTaa account',
    html: `<p>Click the link below to verify your account:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`
  };

  await transporter.sendMail(mailOptions);
}
