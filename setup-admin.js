import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const db = new sqlite3.Database('database.sqlite');

const email = process.env.ADMIN_EMAIL || 'admin@sunbonsys.in';
const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

console.log('🔧 Creating admin user...');
console.log('📧 Email:', email);

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error hashing password:', err);
    db.close();
    return;
  }

  db.run(
    `INSERT OR REPLACE INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)`,
    [email, hash, 'Admin'],
    (err) => {
      if (err) {
        console.error('❌ Error creating admin:', err);
      } else {
        console.log('✅ Admin user created successfully!');
        console.log('📧  Email:', email);
        console.log('🔑 Password:', password);
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
      }
      db.close();
    }
  );
});
