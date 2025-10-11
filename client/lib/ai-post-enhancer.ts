// Client-side AI Post Enhancer Service
// This service communicates with the server-side AI API

// List of inappropriate keywords to check for
const INAPPROPRIATE_KEYWORDS = [
  'sex', 'sexual', 'nude', 'naked', 'porn', 'xxx', 'adult', 'erotic',
  'explicit', 'nsfw', '18+', 'xxx', 'escort', 'prostitute', 'hooker',
  'whore', 'slut', 'fuck', 'fucking', 'shit', 'damn', 'asshole',
  'bitch', 'cunt', 'dick', 'penis', 'vagina', 'breast', 'boob',
  'nipple', 'strip', 'stripper', 'lap dance', 'blowjob', 'cum',
  'orgasm', 'masturbat', 'rape', 'rapist', 'incest', 'pedophil',
  'zoophil', 'bestiality', 'gangbang', 'orgy', 'threesome',
  'swinger', 'kinky', 'fetish', 'bdsm'
];

export interface PostEnhancementOptions {
  style?: 'professional' | 'casual' | 'technical' | 'creative' | 'academic';
  tone?: 'friendly' | 'formal' | 'enthusiastic' | 'informative' | 'motivational';
  length?: 'shorter' | 'same' | 'longer';
  focus?: 'clarity' | 'engagement' | 'technical_accuracy' | 'storytelling';
}

export interface EnhancementResult {
  enhancedContent: string;
  improvements: string[];
  originalLength: number;
  enhancedLength: number;
  confidence: number;
}

class ClientAIPostEnhancer {
  private static instance: ClientAIPostEnhancer;
  private baseUrl: string;

  private constructor() {
    // Use the current origin for API calls
    this.baseUrl = '/api/ai';
  }

  public static getInstance(): ClientAIPostEnhancer {
    if (!ClientAIPostEnhancer.instance) {
      ClientAIPostEnhancer.instance = new ClientAIPostEnhancer();
    }
    return ClientAIPostEnhancer.instance;
  }

  // Check if content contains inappropriate keywords (public method)
  public containsInappropriateContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return INAPPROPRIATE_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  public async enhancePost(
    content: string,
    options: PostEnhancementOptions = {}
  ): Promise<EnhancementResult> {
    // Check for inappropriate content before sending to AI
    if (this.containsInappropriateContent(content)) {
      throw new Error('Post contains inappropriate content. Please remove any explicit or adult content before enhancing.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, options }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check the enhanced content for inappropriate content as well
      if (this.containsInappropriateContent(result.enhancedContent)) {
        throw new Error('AI enhancement generated inappropriate content. Please try different enhancement options or modify your original content.');
      }
      
      return result;
    } catch (error) {
      console.error('AI Post Enhancement Error:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to AI service. Please ensure the server is running.');
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to enhance post: ${error.message}`);
      }
      
      throw new Error('Failed to enhance post: Unknown error occurred');
    }
  }

  public async generateHashtags(content: string): Promise<string[]> {
    // Check for inappropriate content before generating hashtags
    if (this.containsInappropriateContent(content)) {
      throw new Error('Content contains inappropriate material. Cannot generate hashtags.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/hashtags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.hashtags || [];
    } catch (error) {
      console.error('Hashtag generation error:', error);
      return [];
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }

  // Utility method to check if AI service is available
  public async isAvailable(): Promise<boolean> {
    return await this.checkHealth();
  }
}

// Export singleton instance
export const aiPostEnhancer = ClientAIPostEnhancer.getInstance();