const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  console.log('Starting automated database setup...');
  
  // 1. Connect to the default "postgres" database first to ensure our target DB exists
  // Extract credentials from DATABASE_URL and swap the db name to "postgres"
  const adminUrl = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/\/[^/]+$/, '/postgres')
    : 'postgresql://postgres:postgres@localhost:5432/postgres';

  const adminClient = new Client({
    connectionString: adminUrl
  });

  try {
    await adminClient.connect();
    console.log('Connected to default postgres instance.');
    
    try {
      await adminClient.query('CREATE DATABASE job_scheduler;');
      console.log('✅ Created database "job_scheduler".');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('ℹ️ Database "job_scheduler" already exists.');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL. Is it running? Password correct?');
    console.error(err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Now connect to the actual job_scheduler database to run the schema
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/job_scheduler'
  });

  try {
    await dbClient.connect();
    console.log('Connected to job_scheduler database. Applying schema...');
    
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema by statements (basic split) or just run it as one block.
    // pg driver can execute multiple statements natively.
    await dbClient.query(schemaSql);
    
    console.log('✅ Schema applied successfully! All tables created.');
  } catch (err) {
    console.error('❌ Failed to apply schema:');
    console.error(err);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

run();
