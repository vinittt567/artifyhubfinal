import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import express from 'express';

// We'll initialize AI later with proper API key
let ai: any = null;

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

function initializeAI() {
  if (ai) return ai;
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not found. Please add GOOGLE_AI_API_KEY to your environment variables.');
  }
  
  // Set the API key as environment variable for Google AI
  process.env.GOOGLE_GENAI_API_KEY = apiKey;
  
  // Configure Genkit with Google AI
  ai = genkit({
    plugins: [googleAI()],
  });
  
  return ai;
}

// Check if content contains inappropriate keywords
function containsInappropriateContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return INAPPROPRIATE_KEYWORDS.some(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  );
}

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

class ServerAIPostEnhancer {
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    // Check if Google AI API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Google AI API key not found. Please add GOOGLE_AI_API_KEY to your environment variables.'
      );
    }

    this.isInitialized = true;
  }

  public async enhancePost(
    content: string,
    options: PostEnhancementOptions = {}
  ): Promise<EnhancementResult> {
    // Check for inappropriate content before processing
    if (containsInappropriateContent(content)) {
      throw new Error('Post contains inappropriate content. Please remove any explicit or adult content.');
    }

    await this.initialize();

    const {
      style = 'professional',
      tone = 'friendly',
      length = 'same',
      focus = 'clarity'
    } = options;

    try {
      const prompt = this.buildPrompt(content, style, tone, length, focus);
      
      const aiInstance = initializeAI();
      const response = await aiInstance.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40,
        },
      });

      const result = this.parseResponse(response.text, content);
      
      // Check the enhanced content for inappropriate content as well
      if (containsInappropriateContent(result.enhancedContent)) {
        throw new Error('AI enhancement generated inappropriate content. Please try different enhancement options.');
      }
      
      return result;
    } catch (error) {
      console.error('AI Post Enhancement Error:', error);
      throw new Error(`Failed to enhance post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(
    content: string,
    style: string,
    tone: string,
    length: string,
    focus: string
  ): string {
    const lengthInstruction = {
      shorter: 'Make it more concise and brief',
      same: 'Keep approximately the same length',
      longer: 'Expand with more details and examples'
    }[length];

    const styleInstruction = {
      professional: 'professional and polished',
      casual: 'casual and conversational',
      technical: 'technical and precise',
      creative: 'creative and engaging',
      academic: 'academic and scholarly'
    }[style];

    const toneInstruction = {
      friendly: 'friendly and approachable',
      formal: 'formal and respectful',
      enthusiastic: 'enthusiastic and energetic',
      informative: 'informative and educational',
      motivational: 'motivational and inspiring'
    }[tone];

    const focusInstruction = {
      clarity: 'improve clarity and readability',
      engagement: 'increase engagement and interest',
      technical_accuracy: 'enhance technical accuracy and precision',
      storytelling: 'improve narrative flow and storytelling'
    }[focus];

    return `You are an expert content enhancer for a developer social media platform. Your task is to improve the following post while maintaining its core message and authenticity.

Original Post:
"${content}"

Enhancement Instructions:
- Style: Make it ${styleInstruction}
- Tone: Keep it ${toneInstruction}
- Length: ${lengthInstruction}
- Focus: ${focusInstruction}

Guidelines:
1. Preserve any code blocks exactly as they are (including \`\`\` syntax)
2. Maintain any technical terms and programming concepts
3. Keep the author's voice and personality
4. If there are hashtags, improve or suggest better ones
5. Fix any grammar or spelling issues
6. Improve structure and flow
7. Make it more engaging for developers and tech professionals
8. DO NOT include any explicit, sexual, or adult content
9. Keep the content appropriate for a professional developer community

Please respond in the following JSON format:
{
  "enhanced_content": "The improved version of the post",
  "improvements": ["List of specific improvements made"],
  "confidence": 85
}

Enhanced Post:`;
  }

  private parseResponse(responseText: string, originalContent: string): EnhancementResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          enhancedContent: parsed.enhanced_content || responseText,
          improvements: parsed.improvements || ['General improvements applied'],
          originalLength: originalContent.length,
          enhancedLength: (parsed.enhanced_content || responseText).length,
          confidence: parsed.confidence || 75,
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using raw text:', error);
    }

    // Fallback: use the entire response as enhanced content
    return {
      enhancedContent: responseText.trim(),
      improvements: ['Content enhanced by AI'],
      originalLength: originalContent.length,
      enhancedLength: responseText.trim().length,
      confidence: 70,
    };
  }

  public async generateHashtags(content: string): Promise<string[]> {
    // Check for inappropriate content before generating hashtags
    if (containsInappropriateContent(content)) {
      throw new Error('Content contains inappropriate material. Cannot generate hashtags.');
    }

    await this.initialize();

    try {
      const prompt = `Analyze this developer/tech post and suggest 5-7 relevant hashtags:

"${content}"

Return only the hashtags in this format: #hashtag1 #hashtag2 #hashtag3
Focus on programming languages, frameworks, concepts, and general tech topics mentioned.
DO NOT include any explicit or adult-related hashtags.`;

      const aiInstance = initializeAI();
      const response = await aiInstance.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: prompt,
        config: {
          temperature: 0.5,
          maxOutputTokens: 100,
        },
      });

      const hashtags = response.text
        .split(/\s+/)
        .filter(word => word.startsWith('#'))
        .map(tag => tag.replace('#', '').toLowerCase())
        .slice(0, 7);

      return hashtags;
    } catch (error) {
      console.error('Hashtag generation error:', error);
      return [];
    }
  }
}

// Export the service instance
export const serverAIEnhancer = new ServerAIPostEnhancer();

// Express route handlers
export const aiRoutes = express.Router();

aiRoutes.post('/enhance', async (req, res) => {
  try {
    const { content, options } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    // Check for inappropriate content before processing
    if (containsInappropriateContent(content)) {
      return res.status(400).json({ 
        error: 'Post contains inappropriate content. Please remove any explicit or adult content.' 
      });
    }

    const result = await serverAIEnhancer.enhancePost(content, options);
    res.json(result);
  } catch (error) {
    console.error('Enhancement API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

aiRoutes.post('/hashtags', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    // Check for inappropriate content before processing
    if (containsInappropriateContent(content)) {
      return res.status(400).json({ 
        error: 'Content contains inappropriate material. Cannot generate hashtags.' 
      });
    }

    const hashtags = await serverAIEnhancer.generateHashtags(content);
    res.json({ hashtags });
  } catch (error) {
    console.error('Hashtag generation API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Health check endpoint
aiRoutes.get('/health', (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    res.json({ 
      status: 'ok', 
      service: 'AI Post Enhancement',
      timestamp: new Date().toISOString(),
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'Not found'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint
aiRoutes.get('/test', (req, res) => {
  res.json({ message: 'AI service is reachable', timestamp: new Date().toISOString() });
});