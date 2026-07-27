import { initDb, getDb, db } from './index.js';
import bcrypt from 'bcryptjs';

const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

async function main() {
  await initDb();
  const database = getDb();

  // Check if already seeded
  const result = database.exec("SELECT COUNT(*) as c FROM users");
  const count = result[0]?.values[0]?.[0] as number || 0;
  if (count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Insert users
  const users = [
    { email: 'admin@infotess.com', password: 'admin123', role: 'super_admin' },
    { email: 'exec@infotess.com', password: 'exec123', role: 'admin' },
    { email: 'student@infotess.com', password: 'student123', role: 'student' },
    { email: 'john@infotess.com', password: 'student123', role: 'student' },
    { email: 'ama@infotess.com', password: 'student123', role: 'student' },
  ];

  const userIds: Record<string, number> = {};

  for (const u of users) {
    const info = db.prepare(
      'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)'
    ).run(u.email, hashPassword(u.password), u.role, 'active');
    userIds[u.email] = info.lastInsertRowid;
    console.log(`  ✓ User: ${u.email} (id=${info.lastInsertRowid})`);
  }

  // Insert students
  const students = [
    { email: 'student@infotess.com', index: 'INF/2024/001', name: 'Ama Serwaa', dept: 'Computer Science', level: '200', phone: '+233244123456' },
    { email: 'john@infotess.com', index: 'INF/2024/002', name: 'John Mensah', dept: 'Information Technology', level: '300', phone: '+233244123457' },
    { email: 'ama@infotess.com', index: 'INF/2024/003', name: 'Ama Kwarteng', dept: 'Computer Science', level: '100', phone: '+233244123458' },
  ];

  const studentIds: Record<string, number> = {};
  for (const s of students) {
    const info = db.prepare(
      'INSERT INTO students (user_id, index_number, full_name, department, level, phone_number) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userIds[s.email], s.index, s.name, s.dept, s.level, s.phone);
    studentIds[s.index] = info.lastInsertRowid;
    console.log(`  ✓ Student: ${s.name} (${s.index})`);
  }

  // System settings
  db.prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)").run('annual_dues_amount', '200.00');
  console.log('  ✓ System settings');

  // Sample payments
  const currentYear = new Date().getFullYear().toString();
  const adminId = userIds['admin@infotess.com'];

  const payments = [
    { student: 'INF/2024/001', amount: 100, year: currentYear, semester: 'First', method: 'Mobile Money', date: '2024-09-15', receipt: `SDMS-${currentYear}-A1B2C3D4` },
    { student: 'INF/2024/001', amount: 50, year: currentYear, semester: 'Second', method: 'Cash', date: '2025-01-20', receipt: `SDMS-${currentYear}-D4E5F6G7` },
    { student: 'INF/2024/002', amount: 200, year: currentYear, semester: 'First', method: 'Bank Transfer', date: '2024-09-10', receipt: `SDMS-${currentYear}-H8I9J0K1` },
    { student: 'INF/2024/003', amount: 150, year: currentYear, semester: 'First', method: 'Mobile Money', date: '2024-09-12', receipt: `SDMS-${currentYear}-L2M3N4O5` },
  ];

  for (const p of payments) {
    const info = db.prepare(
      'INSERT INTO payments (student_id, amount, academic_year, semester, payment_method, payment_date, receipt_number, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(studentIds[p.student], p.amount, p.year, p.semester, p.method, p.date, p.receipt, adminId);

    // Also create receipt record
    const hash = Buffer.from(p.receipt + ':' + Date.now()).toString('base64url');
    db.prepare('INSERT INTO receipts (payment_id, receipt_file_path, verification_hash) VALUES (?, ?, ?)').run(info.lastInsertRowid, `/receipts/${p.receipt}.pdf`, hash);
  }
  console.log(`  ✓ ${payments.length} payments`);

  // Notifications
  for (const [email, uid] of Object.entries(userIds)) {
    if (email.includes('student')) {
      db.prepare('INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)').run(uid, 'Welcome to INFOTESS', 'Your account has been created. Start paying your dues!', 0);
      db.prepare('INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)').run(uid, 'Payment Reminder', 'First semester dues are due by end of September.', 0);
    }
  }
  console.log('  ✓ Notifications');

  // Executives
  db.prepare("INSERT INTO executives (full_name, position, bio, email) VALUES (?, ?, ?, ?)").run('Dr. Kwame Nkrumah', 'President', 'Leading INFOTESS since 2020', 'president@infotess.com');
  db.prepare("INSERT INTO executives (full_name, position, bio, email) VALUES (?, ?, ?, ?)").run('Akosua Adjei', 'Vice President', 'Managing operations and events', 'vp@infotess.com');
  console.log('  ✓ Executives');

  // Activities
  db.prepare("INSERT INTO activities (title, description, activity_date, registration_link) VALUES (?, ?, ?, ?)").run('Tech Talk: AI in Education', 'Exploring how AI transforms learning', new Date(Date.now() + 7*86400000).toISOString(), 'https://forms.gle/example');
  console.log('  ✓ Activities');

  // Events
  db.prepare("INSERT INTO events (title, description, event_date, location) VALUES (?, ?, ?, ?)").run('Annual General Meeting', 'General meeting for all members', new Date(Date.now() + 30*86400000).toISOString(), 'AAMUSTED Auditorium');
  console.log('  ✓ Events');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin:    admin@infotess.com / admin123');
  console.log('  Exec:     exec@infotess.com / exec123');
  console.log('  Student1: student@infotess.com / student123 (INF/2024/001)');
  console.log('  Student2: john@infotess.com / student123 (INF/2024/002)');
  console.log('  Student3: ama@infotess.com / student123 (INF/2024/003)');
}

main().catch(console.error);