import { AppShell } from "@/components/app/AppShell";
import { ClayCard } from "@/components/app/ClayCard";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { renderMarkdownNodes } from "@/lib/markdown";
import { postService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";
import { supabase } from "@/lib/supabase";
import { aiPostEnhancer, PostEnhancementOptions, EnhancementResult } from "@/lib/ai-post-enhancer";
import { Loader2, ImagePlus, Send, Sparkles, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiServiceAvailable, setAiServiceAvailable] = useState<boolean | null>(null);
  const [enhancementOptions, setEnhancementOptions] = useState<PostEnhancementOptions>({
    style: 'professional',
    tone: 'friendly',
    length: 'same',
    focus: 'clarity'
  });
  const [lastEnhancement, setLastEnhancement] = useState<EnhancementResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Check AI service availability on component mount
  useEffect(() => {
    const checkAIService = async () => {
      const isAvailable = await aiPostEnhancer.isAvailable();
      setAiServiceAvailable(isAvailable);
    };
    checkAIService();
  }, []);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    // Create a temporary preview URL that we'll replace after upload
    setImage(URL.createObjectURL(file));
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleEnhanceWithAI = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content before enhancing",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsEnhancing(true);
      console.log('Starting AI enhancement with options:', enhancementOptions);
      
      const result = await aiPostEnhancer.enhancePost(content, enhancementOptions);
      console.log('AI enhancement result:', result);
      
      setContent(result.enhancedContent);
      setLastEnhancement(result);
      
      // Auto-suggest hashtags if none exist
      if (tags.length === 0) {
        try {
          console.log('Generating hashtags...');
          const suggestedTags = await aiPostEnhancer.generateHashtags(result.enhancedContent);
          console.log('Generated hashtags:', suggestedTags);
          if (suggestedTags.length > 0) {
            setTags(suggestedTags.slice(0, 5));
          }
        } catch (error) {
          console.warn('Failed to generate hashtags:', error);
        }
      }
      
      toast({
        title: "Content Enhanced!",
        description: `${result.improvements.length} improvements applied with ${result.confidence}% confidence`
      });
      
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Failed to enhance content",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!content.trim()) return;
    
    try {
      const suggestedTags = await aiPostEnhancer.generateHashtags(content);
      if (suggestedTags.length > 0) {
        setTags(prev => {
          const newTags = [...prev];
          suggestedTags.forEach(tag => {
            if (!newTags.includes(tag) && newTags.length < 5) {
              newTags.push(tag);
            }
          });
          return newTags;
        });
        toast({
          title: "Hashtags Generated",
          description: `Added ${suggestedTags.length} relevant hashtags`
        });
      }
    } catch (error) {
      console.warn('Failed to generate hashtags:', error);
      toast({
        title: "Hashtag Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate hashtags",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive"
      });
      return;
    }

    // Check for inappropriate content before submitting
    if (aiPostEnhancer.containsInappropriateContent(content)) {
      toast({
        title: "Inappropriate Content Detected",
        description: "Your post contains inappropriate content. Please remove any explicit or adult content before posting.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsPosting(true);
      
      let imageUrls: string[] | undefined = undefined;
      
      // Upload image to Supabase Storage if one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(uploadData.path);
        
        imageUrls = [publicUrl];
      }
      
      // Detect code language from content
      const codeMatch = content.match(/```(\w+)/);
      const codeLanguage = codeMatch ? codeMatch[1] : undefined;
      
      const { data, error } = await postService.createPost({
        content: content.trim(),
        image_urls: imageUrls,
        code_language: codeLanguage,
        tags: tags.length > 0 ? tags : undefined
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create post');
      }
      
      toast({
        title: "Success",
        description: "Your post has been created successfully!"
      });
      
      // Clean up the blob URL
      if (image) {
        URL.revokeObjectURL(image);
      }
      
      // Navigate back to feed
      navigate('/feed');
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AppShell>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(130,87,230,0.22),transparent_60%)]" />
      <div className={`w-full ${isMobile ? 'max-w-full' : 'max-w-2xl mx-auto'}`}>
        <h1 className={`mb-6 font-bold ${
          isMobile ? 'text-xl' : 'text-2xl'
        }`}>
          Create a new post
        </h1>
        
        <ClayCard>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content (supports ```code``` blocks)
              </label>
              <textarea
                id="content"
                rows={isMobile ? 8 : 12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-y rounded-2xl border bg-background/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                placeholder="Share what you're building today...\n\n```tsx\n// code here\n```"
              />
              
              {/* AI Enhancement Controls */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing || !content.trim() || aiServiceAvailable === false}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Enhance with AI
                    </>
                  )}
                </Button>
                
                {aiServiceAvailable === false && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    AI service unavailable (requires server setup)
                  </div>
                )}
                
                {aiServiceAvailable === true && (
                  <Popover open={showAIOptions} onOpenChange={setShowAIOptions}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        AI Options
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-4">
                        <h4 className="font-medium leading-none">Enhancement Options</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Style</label>
                            <Select
                              value={enhancementOptions.style}
                              onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, style: value as any }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="creative">Creative</SelectItem>
                                <SelectItem value="academic">Academic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Tone</label>
                            <Select
                              value={enhancementOptions.tone}
                              onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, tone: value as any }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                <SelectItem value="informative">Informative</SelectItem>
                                <SelectItem value="motivational">Motivational</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Length</label>
                            <Select
                              value={enhancementOptions.length}
                              onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, length: value as any }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shorter">Make Shorter</SelectItem>
                                <SelectItem value="same">Keep Same Length</SelectItem>
                                <SelectItem value="longer">Make Longer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Focus</label>
                            <Select
                              value={enhancementOptions.focus}
                              onValueChange={(value) => setEnhancementOptions(prev => ({ ...prev, focus: value as any }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clarity">Clarity</SelectItem>
                                <SelectItem value="engagement">Engagement</SelectItem>
                                <SelectItem value="technical_accuracy">Technical Accuracy</SelectItem>
                                <SelectItem value="storytelling">Storytelling</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {lastEnhancement && (
                  <div className="text-xs text-muted-foreground">
                    Enhanced with {lastEnhancement.confidence}% confidence
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="group relative pr-6 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              
              {tags.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag"
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                  <Button
                    onClick={handleGenerateHashtags}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={!content.trim() || aiServiceAvailable === false}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Button>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Image (optional)</label>
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="grid place-items-center rounded-3xl border border-dashed border-white/15 bg-background/60 p-6 text-sm text-muted-foreground shadow-[inset_8px_8px_20px_rgba(0,0,0,0.15),inset_-8px_-8px_20px_rgba(255,255,255,0.04)]"
              >
                <div className="text-center">
                  <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Drag & drop an image here, or</p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Browse files
                  </button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                  className="hidden"
                />
              </div>
              {image && (
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  <img src={image} alt="Selected" className="w-full object-cover" />
                  <button
                    onClick={() => {
                      if (image) {
                        URL.revokeObjectURL(image);
                      }
                      setImage(undefined);
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={isPosting || !content.trim()}
              className="w-full"
              size={isMobile ? 'default' : 'lg'}
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </ClayCard>

        {/* Preview */}
        {content && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Preview</h2>
            <ClayCard>
              <div className="prose prose-invert max-w-none">
                <div className="space-y-1 text-sm">{renderMarkdownNodes(content)}</div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/10">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </ClayCard>
            
            {/* AI Enhancement Results */}
            {lastEnhancement && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Enhancement Results
                </h3>
                <ClayCard>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence Score</span>
                      <span className="font-medium">{lastEnhancement.confidence}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Length Change</span>
                      <span className={`font-medium ${
                        lastEnhancement.enhancedLength > lastEnhancement.originalLength 
                          ? 'text-blue-400' 
                          : lastEnhancement.enhancedLength < lastEnhancement.originalLength 
                          ? 'text-green-400' 
                          : 'text-muted-foreground'
                      }`}>
                        {lastEnhancement.originalLength} → {lastEnhancement.enhancedLength} chars
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Improvements Applied:</h4>
                      <ul className="space-y-1">
                        {lastEnhancement.improvements.map((improvement, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-brand mt-2 flex-shrink-0" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </ClayCard>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
