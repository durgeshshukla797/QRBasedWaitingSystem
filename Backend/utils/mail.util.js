import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});


//to send mail
export const sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

export const sendOtpEmail = (to, code) =>
  sendMail({
    to,
    subject: `Your verification code: ${code}`,
    text: `Your code is ${code}. It is valid for 5 minutes. If you did not request it, ignore this email.`,
    html: `<p>Your verification code is:</p>
           <p style="font-size:28px;letter-spacing:4px"><b>${code}</b></p>
           <p>It is valid for 5 minutes. If you did not request it, ignore this email.</p>`,
  });