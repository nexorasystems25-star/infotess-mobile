import { supabase } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const random = uuidv4().slice(0, 8).toUpperCase();
  return `SDMS-${year}-${random}`;
}

export async function getRequiredDuesAmount(): Promise<number> {
  const { data } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'annual_dues_amount')
    .single();
  return data ? parseFloat(data.setting_value) : 200.00;
}

export async function calculateStudentDues(studentId: number, academicYear: string) {
  const required = await getRequiredDuesAmount();

  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('student_id', studentId)
    .eq('academic_year', academicYear);

  const paid = (data || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, required - paid);

  return { required, paid, balance, academic_year: academicYear };
}

export async function createPayment(data: {
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
  const required = await getRequiredDuesAmount();

  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('student_id', data.student_id)
    .eq('academic_year', data.academic_year);

  const alreadyPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, required - alreadyPaid);

  if (remaining <= 0) {
    throw new Error(`Student has already paid the full required amount of GH₵ ${required} for ${data.academic_year}. No further payments allowed.`);
  }

  if (data.amount > remaining) {
    throw new Error(`Amount GH₵ ${data.amount} exceeds the outstanding balance of GH₵ ${remaining}.`);
  }

  const receiptNumber = generateReceiptNumber();

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      student_id: data.student_id,
      amount: data.amount,
      academic_year: data.academic_year,
      semester: data.semester,
      payment_method: data.payment_method,
      payment_date: data.payment_date,
      receipt_number: receiptNumber,
      recorded_by: data.recorded_by,
      phone_number: data.phone_number || null,
      transaction_id: data.transaction_id || null,
      account_number: data.account_number || null,
    })
    .select('id')
    .single();

  if (payErr) throw payErr;

  const verificationHash = Buffer.from(receiptNumber + ':' + Date.now()).toString('base64url');

  await supabase.from('receipts').insert({
    payment_id: payment.id,
    receipt_file_path: `/receipts/${receiptNumber}.pdf`,
    verification_hash: verificationHash,
  });

  return { id: payment.id, receipt_number: receiptNumber, verification_hash: verificationHash };
}

export async function getDashboardStats() {
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const { count: totalPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true });

  const { data: allPayments } = await supabase.from('payments').select('amount');
  const totalRevenue = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  const currentYear = new Date().getFullYear().toString();
  const requiredDues = await getRequiredDuesAmount();

  const { data: yearPayments } = await supabase
    .from('payments')
    .select('student_id, amount')
    .eq('academic_year', currentYear);

  // Group by student and check who paid full
  const studentTotals: Record<number, number> = {};
  (yearPayments || []).forEach(p => {
    studentTotals[p.student_id] = (studentTotals[p.student_id] || 0) + Number(p.amount);
  });
  const studentsWithFullPayment = Object.values(studentTotals).filter(total => total >= requiredDues).length;
  const complianceRate = (totalStudents || 0) > 0 ? Math.round((studentsWithFullPayment / (totalStudents || 1)) * 100) : 0;

  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*, students(full_name, index_number)')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    total_students: totalStudents || 0,
    total_payments: totalPayments || 0,
    total_revenue: totalRevenue,
    compliance_rate: complianceRate,
    recent_payments: recentPayments || [],
  };
}
