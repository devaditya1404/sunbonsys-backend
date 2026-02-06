import sqlite3 from 'sqlite3';

console.log('🔄 Starting product name migration...');

const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
});

// Update FRA Proposal Guidance to FRA/FFC/SSS Proposal
db.run(
  `UPDATE contacts SET product = 'FRA/FFC/SSS Proposal' WHERE product = 'FRA Proposal Guidance'`,
  function(err) {
    if (err) {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    }
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Updated ${this.changes} record(s)`);
    
    // Verify the changes
    db.all(`SELECT DISTINCT product FROM contacts`, [], (err, rows) => {
      if (err) {
        console.error('❌ Verification failed:', err);
      } else {
        console.log('\n📋 Current unique products in database:');
        rows.forEach(row => {
          console.log(`   - ${row.product}`);
        });
      }
      
      db.close();
    });
  }
);
