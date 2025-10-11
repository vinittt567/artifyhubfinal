import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRegistrationService } from '@/lib/user-registration';
import { CheckCircle, AlertCircle, User, Database, Loader2 } from 'lucide-react';

export function UserRegistrationDemo() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setLogs([]);

    try {
      addLog('🚀 Starting user registration process...');
      
      const registrationResult = await UserRegistrationService.registerUser({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        fullName: formData.username
      });

      if (registrationResult.error) {
        addLog(`❌ Registration failed: ${registrationResult.error.message}`);
        setResult({ success: false, error: registrationResult.error });
      } else {
        addLog('✅ User created in Supabase Auth');
        
        if (registrationResult.profile) {
          addLog(`✅ Profile created in database: ${registrationResult.profile.username}`);
        } else {
          addLog('⚠️ Profile creation status unclear');
        }

        // Validate the registration
        if (registrationResult.user) {
          addLog('🔍 Validating registration...');
          const validation = await UserRegistrationService.validateUserRegistration(registrationResult.user.id);
          
          if (validation.isValid) {
            addLog('✅ Registration validation passed');
          } else {
            addLog(`❌ Validation issues: ${validation.issues.join(', ')}`);
          }
          
          setResult({ 
            success: validation.isValid, 
            user: registrationResult.user,
            profile: validation.profile,
            issues: validation.issues
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Unexpected error: ${errorMessage}`);
      setResult({ success: false, error: { message: errorMessage } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Registration Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering User...
                </>
              ) : (
                'Test User Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Registration Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Registration Process Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Registration Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    User successfully registered and saved to database tables!
                  </AlertDescription>
                </Alert>
                
                {result.user && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Auth User
                    </h4>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p><strong>ID:</strong> {result.user.id}</p>
                      <p><strong>Email:</strong> {result.user.email}</p>
                      <p><strong>Created:</strong> {new Date(result.user.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {result.profile && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Database Profile
                    </h4>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p><strong>Username:</strong> {result.profile.username}</p>
                      <p><strong>Name:</strong> {result.profile.name}</p>
                      <p><strong>Created:</strong> {new Date(result.profile.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Registration failed: {result.error?.message || 'Unknown error'}
                  </AlertDescription>
                </Alert>
                
                {result.issues && result.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Issues Found:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.issues.map((issue: string, index: number) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}