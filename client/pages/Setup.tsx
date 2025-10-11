import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Database, Key, Settings, Terminal, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runDatabaseDiagnostics, getDiagnosticSummary, type DatabaseDiagnostics } from '@/lib/database-diagnostics';

export default function SetupPage() {
  const [envStatus, setEnvStatus] = useState({
    hasUrl: false,
    hasKey: false,
    urlValid: false,
    keyValid: false
  });

  const [supabaseTest, setSupabaseTest] = useState({
    tested: false,
    connected: false,
    error: null
  });

  const [dbDiagnostics, setDbDiagnostics] = useState<DatabaseDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    setEnvStatus({
      hasUrl: !!url,
      hasKey: !!key,
      urlValid: url && url.includes('.supabase.co') && url !== 'https://your-project-id.supabase.co',
      keyValid: key && key.startsWith('eyJ') && key !== 'your-anon-key-here'
    });
  }, []);

  const testSupabaseConnection = async () => {
    setSupabaseTest({ tested: false, connected: false, error: null });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      setSupabaseTest({
        tested: true,
        connected: !error,
        error: error?.message || null
      });
    } catch (err) {
      setSupabaseTest({
        tested: true,
        connected: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const runDiagnostics = async () => {
    if (!allConfigured) return;
    
    setDiagnosticsLoading(true);
    try {
      const diagnostics = await runDatabaseDiagnostics();
      setDbDiagnostics(diagnostics);
    } catch (err) {
      console.error('Diagnostics failed:', err);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const allConfigured = envStatus.urlValid && envStatus.keyValid;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ARTIFYHUB Setup</h1>
          <p className="text-muted-foreground mt-2">Configure your Supabase database to get started</p>
        </div>

        {/* Environment Variables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Environment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {envStatus.hasUrl ? (
                  envStatus.urlValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">VITE_SUPABASE_URL</p>
                  <p className="text-sm text-muted-foreground">
                    {envStatus.hasUrl 
                      ? envStatus.urlValid 
                        ? 'Configured correctly' 
                        : 'Invalid URL format'
                      : 'Not configured'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {envStatus.hasKey ? (
                  envStatus.keyValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">VITE_SUPABASE_ANON_KEY</p>
                  <p className="text-sm text-muted-foreground">
                    {envStatus.hasKey 
                      ? envStatus.keyValid 
                        ? 'Configured correctly' 
                        : 'Invalid key format'
                      : 'Not configured'
                    }
                  </p>
                </div>
              </div>
            </div>

            {!allConfigured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Required</AlertTitle>
                <AlertDescription>
                  <p className="mb-3">Follow these steps to configure Supabase:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Copy <code>.env.example</code> to <code>.env</code></li>
                    <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">supabase.com</a></li>
                    <li>Get your Project URL and anon key from Settings → API</li>
                    <li>Update the values in your <code>.env</code> file</li>
                    <li>Restart the development server</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Database Connection Test */}
        {allConfigured && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={testSupabaseConnection}
                  disabled={!allConfigured}
                  variant="outline"
                >
                  Test Connection
                </Button>
                {supabaseTest.tested && (
                  <div className="flex items-center gap-2">
                    {supabaseTest.connected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">Connected successfully</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">Connection failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {supabaseTest.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Database Error</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{supabaseTest.error}</p>
                    <p className="text-sm">
                      This usually means the database schema hasn't been executed yet. 
                      Please run the SQL schema in your Supabase dashboard.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Schema Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Database Schema Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                After configuring your environment variables, you need to set up the database schema:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open your Supabase project dashboard</li>
                <li>Go to <strong>SQL Editor</strong></li>
                <li>Copy the contents of <code>database/schema.sql</code></li>
                <li>Paste and run the SQL in the editor</li>
                <li>Verify tables and functions are created</li>
              </ol>
            </div>
            
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                The database schema creates all tables, RLS policies, and triggers needed for the application.
                Without this, you'll encounter 500 errors when trying to use authentication features.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {allConfigured && supabaseTest.connected && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200">
                🎉 Setup Complete!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Your Supabase configuration is working correctly. You can now:
              </p>
              <div className="space-y-2">
                <Button asChild>
                  <a href="/login">Go to Login</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/signup">Create Account</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}