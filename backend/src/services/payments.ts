import db from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = uuidv4().slice(0, 8).toUpperCase();
  return `SDMS-${year}-${random}`;
}

export function getRequiredDuesAmount(): number {
  const row = db.prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'annual_dues_amount'").get() as { setting_value: string } | undefined;
  return row ? parseFloat(row.setting_value) : 200.00;
}

export function calculateStudentDues(studentId: number, academicYear: string) {
  const required = getRequiredDuesAmount();

  const paidRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE student_id = ? AND academic_year = ?").get(studentId, academicYear) as { total: number };
  const paid = paidRow.total;
  const balance = Math.max(0, required - paid);

  return { required, paid, balance, academic_year: academicYear };
}

export function createPayment(data: {
  student_id: number;
  amount: number;
  academic_year: string;
  semester: string;
  payment_method: string;
  payment_date: string;
  recorded_by: number;
  phone_number?: string;
  transaction_id?: string;
  account_number?: string;
}) {
  const required = getRequiredDuesAmount();
  const paidRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE student_id = ? AND academic_year = ?").get(data.student_id, data.academic_year) as { total: number };
  const alreadyPaid = paidRow.total;
  const remaining = Math.max(0, required - alreadyPaid);

  if (remaining <= 0) {
    throw new Error(`Student has already paid the full required amount of GH₵ ${required} for ${data.academic_year}. No further payments allowed.`);
  }

  if (data.amount > remaining) {
    throw new Error(`Amount GH₵ ${data.amount} exceeds the outstanding balance of GH₵ ${remaining}.`);
  }

  const receiptNumber = generateReceiptNumber();

  const stmt = db.prepare(
    `INSERT INTO payments (student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number, recorded_by, phone_number, transaction_id, account_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const info = stmt.run(
    data.student_id,
    data.amount,
    data.academic_year,
    data.semester,
    data.payment_method,
    data.payment_date,
    receiptNumber,
    data.recorded_by,
    data.phone_number || null,
    data.transaction_id || null,
    data.account_number || null
  );

  const verificationHash = Buffer.from(receiptNumber + ':' + Date.now()).toString('base64url');

  db.prepare("INSERT INTO receipts (payment_id, receipt_file_path, verification_hash) VALUES (?, ?, ?)").run(
    info.lastInsertRowid as number,
    `/receipts/${receiptNumber}.pdf`,
    verificationHash
  );

  return { id: info.lastInsertRowid as number, receipt_number: receiptNumber, verification_hash: verificationHash };
}

export function getDashboardStats() {
  const totalStudents = (db.prepare("SELECT COUNT(*) as c FROM students").get() as { c: number }).c;
  const totalPayments = (db.prepare("SELECT COUNT(*) as c FROM payments").get() as { c: number }).c;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM payments").get() as { t: number }).t;

  const currentYear = new Date().getFullYear().toString();
  const requiredDues = getRequiredDuesAmount();
  const compliantStudents = db.prepare(
    "SELECT COUNT(DISTINCT student_id) as c FROM payments WHERE academic_year = ? GROUP BY student_id HAVING SUM(amount) >= ?"
  ).all(currentYear, requiredDues) as { c: number }[];
  const studentsWithFullPayment = compliantStudents.length;
  const complianceRate = totalStudents > 0 ? Math.round((studentsWithFullPayment / totalStudents) * 100) : 0;

  const recentPayments = db.prepare(
    `SELECT p.*, s.full_name, s.index_number
     FROM payments p
     JOIN students s ON s.id = p.student_id
     ORDER BY p.created_at DESC
     LIMIT 10`
  ).all();

  return { total_students: totalStudents, total_payments: totalPayments, total_revenue: totalRevenue, compliance_rate: complianceRate, recent_payments: recentPayments };
}