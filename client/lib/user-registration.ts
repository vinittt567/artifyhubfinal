import { supabase } from './supabase';

export interface UserRegistrationData {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  additionalData?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url?: string;
  tagline?: string;
  bio?: string;
  created_at: string;
}

/**
 * Comprehensive user registration service that ensures user data is saved to database tables
 * Includes multiple fallback mechanisms for reliability
 */
export class UserRegistrationService {
  
  /**
   * Register a new user with Supabase Auth and ensure profile is created
   */
  static async registerUser(data: UserRegistrationData): Promise<{
    user: any;
    profile?: UserProfile;
    error?: any;
  }> {
    try {
      console.log('🚀 Starting user registration process...');
      
      // Step 1: Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName || data.username,
            ...data.additionalData
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        return { user: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, error: { message: 'No user returned from signup' } };
      }

      console.log('✅ User created in Supabase Auth:', authData.user.id);

      // Step 2: Ensure profile is created in our database
      const profile = await this.ensureUserProfile(authData.user, data);
      
      return {
        user: authData.user,
        profile,
        error: null
      };

    } catch (error) {
      console.error('❌ Registration process failed:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : { message: 'Unknown registration error' }
      };
    }
  }

  /**
   * Ensure user profile exists in database using multiple fallback strategies
   */
  private static async ensureUserProfile(user: any, registrationData: UserRegistrationData): Promise<UserProfile | undefined> {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔄 Profile creation attempt ${attempt}/${maxAttempts}`);

      try {
        // Check if profile already exists (trigger might have created it)
        const existingProfile = await this.checkProfileExists(user.id);
        if (existingProfile) {
          console.log('✅ Profile already exists from trigger');
          return existingProfile;
        }

        // Wait a bit for trigger to potentially create the profile
        if (attempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue; // Check again after waiting
        }

        // Attempt to create profile using different methods
        const profile = await this.createProfileWithFallback(user, registrationData);
        if (profile) {
          console.log('✅ Profile created successfully');
          return profile;
        }

      } catch (error) {
        console.warn(`⚠️ Profile creation attempt ${attempt} failed:`, error);
      }

      // Wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.error('❌ All profile creation attempts failed');
    return undefined;
  }

  /**
   * Check if user profile already exists
   */
  private static async checkProfileExists(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.warn('Profile existence check failed:', error);
      return null;
    }
  }

  /**
   * Create profile using multiple fallback methods
   */
  private static async createProfileWithFallback(user: any, data: UserRegistrationData): Promise<UserProfile | null> {
    const methods = [
      () => this.createProfileViaRPC(user, data),
      () => this.createProfileDirectInsert(user, data),
      () => this.createProfileBasic(user, data)
    ];

    for (const method of methods) {
      try {
        const profile = await method();
        if (profile) return profile;
      } catch (error) {
        console.warn('Profile creation method failed:', error);
      }
    }

    return null;
  }

  /**
   * Method 1: Create profile using RPC function
   */
  private static async createProfileViaRPC(user: any, data: UserRegistrationData): Promise<UserProfile | null> {
    console.log('📞 Attempting profile creation via RPC...');
    
    const { data: profileId, error } = await supabase.rpc('create_profile_for_user', {
      user_id: user.id,
      email_address: data.email,
      username_input: data.username,
      full_name_input: data.fullName || data.username
    });

    if (error) throw error;

    // Fetch the created profile
    return await this.checkProfileExists(user.id);
  }

  /**
   * Method 2: Create profile with direct insert
   */
  private static async createProfileDirectInsert(user: any, data: UserRegistrationData): Promise<UserProfile | null> {
    console.log('📝 Attempting direct profile insert...');
    
    const username = `${data.username}-${user.id.substring(0, 8)}`;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        name: data.fullName || data.username,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  /**
   * Method 3: Create basic profile (minimal data)
   */
  private static async createProfileBasic(user: any, data: UserRegistrationData): Promise<UserProfile | null> {
    console.log('🎯 Attempting basic profile creation...');
    
    const username = `user-${user.id.substring(0, 8)}`;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        name: data.username
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Validate that user data is properly stored
   */
  static async validateUserRegistration(userId: string): Promise<{
    isValid: boolean;
    issues: string[];
    profile?: UserProfile;
  }> {
    const issues: string[] = [];
    
    try {
      // Check if user exists in auth
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !user) {
        issues.push('User not found in Supabase Auth');
      }

      // Check if profile exists
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        issues.push('User profile not found in database');
      }

      return {
        isValid: issues.length === 0,
        issues,
        profile: profile || undefined
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}