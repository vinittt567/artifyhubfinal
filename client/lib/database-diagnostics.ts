import { supabase } from './supabase';

export interface DatabaseDiagnostics {
  tablesExist: {
    profiles: boolean;
    posts: boolean;
    likes: boolean;
    comments: boolean;
  };
  functionsExist: {
    ensure_profile: boolean;
    create_profile_for_user: boolean;
  };
  triggersExist: {
    auth_users_create_profile: boolean;
  };
  rlsPolicies: {
    profiles_select: boolean;
    profiles_insert: boolean;
  };
  error?: string;
}

export async function runDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const result: DatabaseDiagnostics = {
    tablesExist: {
      profiles: false,
      posts: false,
      likes: false,
      comments: false,
    },
    functionsExist: {
      ensure_profile: false,
      create_profile_for_user: false,
    },
    triggersExist: {
      auth_users_create_profile: false,
    },
    rlsPolicies: {
      profiles_select: false,
      profiles_insert: false,
    }
  };

  try {
    // Check if tables exist by trying to select from them
    const tableChecks = await Promise.allSettled([
      supabase.from('profiles').select('count').limit(1),
      supabase.from('posts').select('count').limit(1),
      supabase.from('likes').select('count').limit(1),
      supabase.from('comments').select('count').limit(1),
    ]);

    result.tablesExist.profiles = tableChecks[0].status === 'fulfilled';
    result.tablesExist.posts = tableChecks[1].status === 'fulfilled';
    result.tablesExist.likes = tableChecks[2].status === 'fulfilled';
    result.tablesExist.comments = tableChecks[3].status === 'fulfilled';

    // Check if RPC functions exist by calling them with test parameters
    try {
      await supabase.rpc('create_profile_for_user', {
        user_id: '00000000-0000-0000-0000-000000000000',
        email_address: 'test@example.com',
        username_input: 'test',
        full_name_input: 'Test User'
      });
      result.functionsExist.create_profile_for_user = true;
    } catch (err: any) {
      // Function exists if we get a different error than "function not found"
      if (err?.message && !err.message.includes('function') && !err.message.includes('does not exist')) {
        result.functionsExist.create_profile_for_user = true;
      }
    }

    // Test basic operations to check RLS policies
    if (result.tablesExist.profiles) {
      try {
        await supabase.from('profiles').select('count').limit(1);
        result.rlsPolicies.profiles_select = true;
      } catch (err) {
        result.rlsPolicies.profiles_select = false;
      }
    }

  } catch (err: any) {
    result.error = err.message || 'Unknown database error';
  }

  return result;
}

export function getDiagnosticSummary(diagnostics: DatabaseDiagnostics): {
  status: 'healthy' | 'partial' | 'broken';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!diagnostics.tablesExist.profiles) {
    issues.push('Profiles table is missing');
    recommendations.push('Run the complete database schema from database/schema.sql');
  }

  if (!diagnostics.functionsExist.create_profile_for_user) {
    issues.push('Profile creation function is missing');
    recommendations.push('Ensure the database schema includes the create_profile_for_user function');
  }

  if (!diagnostics.rlsPolicies.profiles_select) {
    issues.push('Profile read permissions not working');
    recommendations.push('Check RLS policies for profiles table');
  }

  if (diagnostics.error) {
    issues.push(`Database connection error: ${diagnostics.error}`);
    recommendations.push('Verify your Supabase credentials and project status');
  }

  const criticalIssues = issues.filter(issue => 
    issue.includes('missing') || issue.includes('connection error')
  );

  let status: 'healthy' | 'partial' | 'broken';
  if (criticalIssues.length > 0) {
    status = 'broken';
  } else if (issues.length > 0) {
    status = 'partial';
  } else {
    status = 'healthy';
  }

  return { status, issues, recommendations };
}