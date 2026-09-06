import nodemailer from "nodemailer";

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendEmail(to: string, subject: string, text: string) {
  if (!transporter) {
    console.log(`[notification:dev-log] to=${to} subject=${subject} text=${text.slice(0, 200)}`);
    return { delivered: false, reason: "no-smtp" };
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  return { delivered: true };
}
