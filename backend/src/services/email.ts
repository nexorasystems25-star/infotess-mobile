import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('⚠ SMTP credentials not configured — emails will not be sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: `"INFOTESS SDMS" <${config.smtpFrom}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    console.log(`✉ Email sent to ${opts.to}: ${opts.subject}`);
    return true;
  } catch (err: any) {
    console.error(`✉ Email failed to ${opts.to}:`, err.message);
    return false;
  }
}

function emailWrapper(content: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
    <div style="background: linear-gradient(135deg, #00C853 0%, #00796B 100%); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">INFOTESS SDMS</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 12px; letter-spacing: 0.5px;">SCHOOL DUES MANAGEMENT SYSTEM</p>
    </div>
    <div style="padding: 28px 24px; color: #1a1a2e; line-height: 1.6; font-size: 14px;">
      ${content}
    </div>
    <div style="background: #f5f5f8; padding: 16px 24px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; font-size: 11px; color: #888;">AAMUSTED INFO-TES Society &middot; Automated notification</p>
    </div>
  </div>`;
}

export async function notifyAdminProofSubmitted(data: {
  studentName: string;
  indexNumber: string;
  amount: number;
  method: string;
  academicYear: string;
  semester: string;
}) {
  return sendEmail({
    to: config.adminEmail,
    subject: `[INFOTESS] New Payment Proof — ${data.studentName} (${data.indexNumber})`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #00796B;">New Payment Proof Submitted</h2>
      <p>A student has submitted a payment proof that requires your review.</p>
      <div style="background: #f0f7f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666; width: 40%;">Student</td><td style="padding: 4px 0; font-weight: 600;">${data.studentName}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Index Number</td><td style="padding: 4px 0; font-weight: 600;">${data.indexNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Amount</td><td style="padding: 4px 0; font-weight: 600; color: #00796B; font-size: 16px;">GH₵ ${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Method</td><td style="padding: 4px 0; font-weight: 600;">${data.method}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Academic Year</td><td style="padding: 4px 0; font-weight: 600;">${data.academicYear} · Semester ${data.semester}</td></tr>
        </table>
      </div>
      <p style="color: #666;">Log in to the admin dashboard to review and approve or reject this proof.</p>
    `),
  });
}

export async function notifyStudentProofReceived(data: {
  studentEmail: string;
  studentName: string;
  amount: number;
  method: string;
  academicYear: string;
  semester: string;
}) {
  return sendEmail({
    to: data.studentEmail,
    subject: `[INFOTESS] Payment Proof Received — GH₵ ${data.amount.toFixed(2)}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #00796B;">Payment Proof Received</h2>
      <p>Hi <strong>${data.studentName}</strong>,</p>
      <p>We've received your payment proof. Our team will review it shortly.</p>
      <div style="background: #f0f7f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666; width: 40%;">Amount</td><td style="padding: 4px 0; font-weight: 600; color: #00796B; font-size: 16px;">GH₵ ${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Method</td><td style="padding: 4px 0; font-weight: 600;">${data.method}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Academic Year</td><td style="padding: 4px 0; font-weight: 600;">${data.academicYear} · Semester ${data.semester}</td></tr>
        </table>
      </div>
      <p style="color: #666;">You will receive another email once your proof has been reviewed.</p>
    `),
  });
}

export async function notifyStudentProofApproved(data: {
  studentEmail: string;
  studentName: string;
  amount: number;
  receiptNumber: string;
  method: string;
  academicYear: string;
  semester: string;
}) {
  return sendEmail({
    to: data.studentEmail,
    subject: `[INFOTESS] Payment Approved — Receipt ${data.receiptNumber}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #00796B;">Payment Approved ✓</h2>
      <p>Hi <strong>${data.studentName}</strong>,</p>
      <p>Your payment has been <strong style="color: #00796B;">approved</strong> and recorded.</p>
      <div style="background: #f0f7f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666; width: 40%;">Receipt No.</td><td style="padding: 4px 0; font-weight: 700; color: #00796B;">${data.receiptNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Amount</td><td style="padding: 4px 0; font-weight: 600;">GH₵ ${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Method</td><td style="padding: 4px 0; font-weight: 600;">${data.method}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Academic Year</td><td style="padding: 4px 0; font-weight: 600;">${data.academicYear} · Semester ${data.semester}</td></tr>
        </table>
      </div>
      <p style="color: #666;">You can view this receipt in the app under your payment history.</p>
    `),
  });
}

export async function notifyStudentProofRejected(data: {
  studentEmail: string;
  studentName: string;
  amount: number;
  reason?: string;
  academicYear: string;
  semester: string;
}) {
  return sendEmail({
    to: data.studentEmail,
    subject: `[INFOTESS] Payment Proof Rejected — GH₵ ${data.amount.toFixed(2)}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #dc2626;">Payment Proof Rejected</h2>
      <p>Hi <strong>${data.studentName}</strong>,</p>
      <p>Unfortunately, your payment proof submission has been <strong style="color: #dc2626;">rejected</strong>.</p>
      <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666; width: 40%;">Amount</td><td style="padding: 4px 0; font-weight: 600;">GH₵ ${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Academic Year</td><td style="padding: 4px 0; font-weight: 600;">${data.academicYear} · Semester ${data.semester}</td></tr>
          ${data.reason ? `<tr><td style="padding: 4px 0; color: #666;">Reason</td><td style="padding: 4px 0; font-weight: 600;">${data.reason}</td></tr>` : ''}
        </table>
      </div>
      <p style="color: #666;">If you believe this was a mistake, please contact the admin or resubmit your proof with correct details.</p>
    `),
  });
}

export async function notifyStudentRegistered(data: {
  studentEmail: string;
  studentName: string;
  indexNumber: string;
  department: string;
  level: string;
  password: string;
}) {
  return sendEmail({
    to: data.studentEmail,
    subject: `[INFOTESS] Welcome — Your Account Has Been Created`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #00796B;">Welcome to INFOTESS SDMS</h2>
      <p>Hi <strong>${data.studentName}</strong>,</p>
      <p>Your student account has been created. You can now log in to view your school dues and payment history.</p>
      <div style="background: #f0f7f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666; width: 40%;">Index Number</td><td style="padding: 4px 0; font-weight: 700;">${data.indexNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Department</td><td style="padding: 4px 0; font-weight: 600;">${data.department}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Level</td><td style="padding: 4px 0; font-weight: 600;">${data.level}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Email</td><td style="padding: 4px 0; font-weight: 600;">${data.studentEmail}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Password</td><td style="padding: 4px 0; font-weight: 600; font-family: monospace; font-size: 15px;">${data.password}</td></tr>
        </table>
      </div>
      <p style="color: #dc2626; font-weight: 600; font-size: 13px;">For your security, please change your password after your first login.</p>
      <p style="color: #666; font-size: 13px;">If you did not expect this email, please contact the admin immediately.</p>
    `),
  });
}
