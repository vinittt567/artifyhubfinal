// Configuration validation utilities

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return !!(
    url && 
    key && 
    url.includes('.supabase.co') && 
    url !== 'https://your-project-id.supabase.co' &&
    key.startsWith('eyJ') &&
    key !== 'your-anon-key-here'
  );
}

export function getConfigStatus() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  return {
    hasUrl: !!url,
    hasKey: !!key,
    urlValid: url && url.includes('.supabase.co') && url !== 'https://your-project-id.supabase.co',
    keyValid: key && key.startsWith('eyJ') && key !== 'your-anon-key-here',
    isConfigured: isSupabaseConfigured()
  };
}

export function getSetupInstructions() {
  const status = getConfigStatus();
  const instructions = [];
  
  if (!status.hasUrl || !status.urlValid) {
    instructions.push('Configure VITE_SUPABASE_URL in your .env file');
  }
  
  if (!status.hasKey || !status.keyValid) {
    instructions.push('Configure VITE_SUPABASE_ANON_KEY in your .env file');
  }
  
  if (status.isConfigured) {
    instructions.push('Setup complete! Your Supabase configuration is valid.');
  }
  
  return instructions;
}