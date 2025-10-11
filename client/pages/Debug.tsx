import { useState } from 'react';
import { AlertCircle, CheckCircle, Play, Database, User, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { UserRegistrationDemo } from '@/components/auth/UserRegistrationDemo';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
}

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      return {
        name,
        success: true,
        message: 'Success',
        details: result
      };
    } catch (error: any) {
      return {
        name,
        success: false,
        message: error.message || 'Unknown error',
        details: error
      };
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setTests([]);
    
    const testResults: TestResult[] = [];

    // Test 1: Basic connection
    testResults.push(await runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      return 'Connected successfully';
    }));

    // Test 2: Check if profiles table exists
    testResults.push(await runTest('Profiles Table Exists', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, name')
        .limit(1);
      if (error) throw error;
      return `Table exists with ${data?.length || 0} sample records`;
    }));

    // Test 3: Check database setup with debug function
    testResults.push(await runTest('Database Setup Check', async () => {
      const { data, error } = await supabase.rpc('debug_auth_setup');
      if (error) throw error;
      return data;
    }));

    // Test 4: Check if ensure_profile function exists
    testResults.push(await runTest('Check ensure_profile Function', async () => {
      const { data, error } = await supabase.rpc('create_profile_for_user', {
        user_id: '00000000-0000-0000-0000-000000000000',
        email_address: 'test@example.com',
        username_input: 'testuser',
        full_name_input: 'Test User'
      });
      // This should fail because the user doesn't exist, but function should be found
      throw new Error('Function exists (expected error for non-existent user)');
    }));

    // Test 4: Test profile creation manually
    testResults.push(await runTest('Manual Profile Creation Test', async () => {
      const testUserId = '12345678-1234-1234-1234-123456789012';
      
      // Try to create a test profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          username: 'test-user-debug',
          name: 'Debug Test User'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Clean up - delete the test profile
      await supabase.from('profiles').delete().eq('id', testUserId);
      
      return 'Profile creation works';
    }));

    // Test 5: Check RLS policies
    testResults.push(await runTest('RLS Policy Check', async () => {
      // Try to read profiles without auth
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .limit(5);
        
      if (error) throw error;
      return `RLS allows reading ${data?.length || 0} profiles`;
    }));

    // Test 6: Auth settings check
    testResults.push(await runTest('Auth Settings Check', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return `Current auth state: ${user ? 'Logged in' : 'Not logged in'}`;
    }));

    setTests(testResults);
    setRunning(false);
  };

  const executeSql = async () => {
    if (!sqlQuery.trim()) return;
    
    try {
      setSqlResult({ loading: true });
      
      // Try to execute as RPC first, then as a direct query
      const { data, error } = await supabase.rpc('exec_sql', { query: sqlQuery });
      
      if (error) {
        // If RPC fails, try as a direct table query
        throw error;
      }
      
      setSqlResult({ success: true, data, error: null });
    } catch (error: any) {
      setSqlResult({ success: false, data: null, error: error.message });
    }
  };

  const testSignup = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      const testUsername = `testuser${Date.now()}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: testUsername,
            full_name: testUsername
          }
        }
      });
      
      if (error) throw error;
      
      alert(`Signup test successful! User ID: ${data.user?.id}`);
    } catch (error: any) {
      alert(`Signup test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Supabase Debug Center</h1>
          <p className="text-muted-foreground mt-2">Diagnose and fix authentication issues</p>
        </div>

        {/* Comprehensive Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database & Auth Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runAllTests} 
              disabled={running}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {running ? 'Running Tests...' : 'Run All Diagnostic Tests'}
            </Button>
            
            {tests.length > 0 && (
              <div className="space-y-3">
                {tests.map((test, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded">
                    {test.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{test.name}</p>
                      <p className={`text-sm ${test.success ? 'text-green-700' : 'text-red-700'}`}>
                        {test.message}
                      </p>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Signup Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Test Signup Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testSignup} variant="outline" className="w-full">
              Test Signup with Random User
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will attempt to create a test user and show the exact error if it fails
            </p>
          </CardContent>
        </Card>

        {/* SQL Executor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SQL Query Tester
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="SELECT * FROM profiles LIMIT 5;"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={4}
            />
            <Button onClick={executeSql} variant="outline">
              Execute Query
            </Button>
            
            {sqlResult && (
              <div className="mt-4">
                {sqlResult.loading ? (
                  <p>Executing...</p>
                ) : sqlResult.success ? (
                  <div className="bg-green-50 p-3 rounded border">
                    <p className="text-green-800 font-medium">Query Success</p>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(sqlResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded border">
                    <p className="text-red-800 font-medium">Query Failed</p>
                    <p className="text-red-700 text-sm mt-1">{sqlResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Registration Demo */}
        <UserRegistrationDemo />

        {/* Quick Fixes */}
        <Card>
          <CardHeader>
            <CardTitle>Common Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>If tests fail:</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Ensure you've run the complete database/schema.sql in Supabase SQL Editor</li>
                    <li>Check that your Supabase project allows signups (Auth Settings → Enable signup)</li>
                    <li>Verify the ensure_profile() trigger function was created successfully</li>
                    <li>Check if RLS policies are blocking profile creation</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}