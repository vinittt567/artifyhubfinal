#!/usr/bin/env node

/**
 * Script to apply the definitive RLS fix to resolve infinite recursion
 * This should be run to fix the "infinite recursion detected in policy for relation 'conversations'" error
 */

import { supabase } from './client/lib/supabase.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyRLSFix() {
  console.log('🔧 Starting RLS Policy Fix...');
  
  try {
    // Read the definitive fix SQL
    const sqlContent = readFileSync(join(process.cwd(), 'database', 'definitive-rls-fix.sql'), 'utf8');
    
    console.log('📄 Loaded SQL fix content...');
    
    // Execute the fix
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Error applying RLS fix:', error);
      return;
    }
    
    console.log('✅ RLS policies have been fixed successfully!');
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    const { data: testResult, error: testError } = await supabase.rpc('test_messaging_access');
    
    if (testError) {
      console.error('❌ Error testing fix:', testError);
      return;
    }
    
    console.log('✅ Test results:', testResult);
    console.log('🎉 Infinite recursion issue has been resolved!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyRLSFix();
}

export { applyRLSFix };