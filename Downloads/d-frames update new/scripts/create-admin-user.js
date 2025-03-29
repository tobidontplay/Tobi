import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Validate environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read and execute SQL schema
async function setupDatabase() {
  try {
    console.log('Setting up employee database schema...');
    
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'employees-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        console.error('Error executing SQL statement:', error);
        console.error('Statement:', statement);
      }
    }
    
    console.log('Database schema setup complete.');
  } catch (error) {
    console.error('Error setting up database schema:', error);
    process.exit(1);
  }
}

// Create an admin user
async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Default admin credentials
    const adminEmail = 'admin@dframes.com';
    const adminPassword = 'admin123'; // This should be changed after first login
    const adminName = 'Admin User';
    const adminRole = 'admin';
    
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', adminEmail)
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('Admin user already exists.');
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    
    // Create the admin user
    const { data, error } = await supabase
      .from('employees')
      .insert([
        {
          email: adminEmail,
          name: adminName,
          password_hash: passwordHash,
          role: adminRole
        }
      ]);
    
    if (error) {
      throw error;
    }
    
    console.log('Admin user created successfully.');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the setup
async function main() {
  try {
    await setupDatabase();
    await createAdminUser();
    console.log('Setup completed successfully.');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
