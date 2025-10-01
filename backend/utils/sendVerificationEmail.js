import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `http://localhost:5000/api/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your StudyTaa account',
    html: `<p>Click the link below to verify your account:</p><a href="${verificationUrl}">${verificationUrl}</a>`
  };

  await transporter.sendMail(mailOptions);
}
