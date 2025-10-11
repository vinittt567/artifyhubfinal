import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save, ArrowLeft, Plus, X, Edit, Trash2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { profileService, skillsService, workExperienceService } from "@/lib/database";
import { useResponsive } from "@/hooks/useResponsive";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  id: string;
  skill_name: string;
  proficiency?: number;
  category?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  start_date?: string;
  end_date?: string;
  currently_working?: boolean;
  description?: string;
  technologies?: string[];
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    tagline: '',
    location: '',
    website: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newWorkExperience, setNewWorkExperience] = useState({
    company: '',
    role: '',
    start_date: '',
    end_date: '',
    currently_working: false,
    description: '',
    technologies: ''
  });
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load profile
        const { data: profileData, error: profileError } = await profileService.getProfile(user.id);
        if (profileError) throw profileError;
        
        if (profileData) {
          setProfile(profileData);
          setFormData({
            name: profileData.name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            tagline: profileData.tagline || '',
            location: profileData.location || '',
            website: profileData.website || '',
            github_url: profileData.github_url || '',
            linkedin_url: profileData.linkedin_url || '',
            twitter_url: profileData.twitter_url || ''
          });
        }
        
        // Load skills
        const { data: skillsData } = await skillsService.getUserSkills(user.id);
        if (skillsData) setSkills(skillsData);
        
        // Load work experience
        const { data: workData } = await workExperienceService.getUserWorkExperience(user.id);
        if (workData) setWorkExperiences(workData);
        
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const { error } = await profileService.updateProfile(user.id, formData);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      navigate('/profile/me');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!user || !newSkill.trim()) return;
    
    try {
      const { data, error } = await skillsService.addSkill(user.id, {
        skill_name: newSkill.trim()
      });
      
      if (error) throw error;
      if (data) setSkills(prev => [...prev, data]);
      
      setNewSkill('');
      setShowAddSkill(false);
      
      toast({
        title: "Success",
        description: "Skill added successfully",
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await skillsService.deleteSkill(skillId);
      if (error) throw error;
      
      setSkills(prev => prev.filter(s => s.id !== skillId));
      
      toast({
        title: "Success",
        description: "Skill removed successfully",
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  const handleAddWorkExperience = async () => {
    if (!user || !newWorkExperience.company.trim() || !newWorkExperience.role.trim()) return;
    
    try {
      const workData = {
        ...newWorkExperience,
        technologies: newWorkExperience.technologies.split(',').map(t => t.trim()).filter(Boolean)
      };
      
      const { data, error } = await workExperienceService.addWorkExperience(user.id, workData);
      
      if (error) throw error;
      if (data) setWorkExperiences(prev => [data, ...prev]);
      
      setNewWorkExperience({
        company: '',
        role: '',
        start_date: '',
        end_date: '',
        currently_working: false,
        description: '',
        technologies: ''
      });
      setShowAddWork(false);
      
      toast({
        title: "Success",
        description: "Work experience added successfully",
      });
    } catch (error) {
      console.error('Error adding work experience:', error);
      toast({
        title: "Error",
        description: "Failed to add work experience",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWorkExperience = async (experienceId: string) => {
    try {
      const { error } = await workExperienceService.deleteWorkExperience(experienceId);
      if (error) throw error;
      
      setWorkExperiences(prev => prev.filter(w => w.id !== experienceId));
      
      toast({
        title: "Success",
        description: "Work experience removed successfully",
      });
    } catch (error) {
      console.error('Error deleting work experience:', error);
      toast({
        title: "Error",
        description: "Failed to remove work experience",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={`mx-auto space-y-6 ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'}`}>
        <div className="flex items-center gap-4">
          <Link to="/profile/me">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className={isMobile ? 'text-xl font-bold' : 'text-2xl font-bold'}>Edit Profile</h1>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className={isMobile ? 'h-16 w-16' : 'h-20 w-20'}>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {formData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size={isMobile ? 'sm' : 'default'}>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tagline</label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="A short tagline about yourself"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Your location"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GitHub</label>
                  <Input
                    value={formData.github_url}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn</label>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Twitter</label>
                  <Input
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Skills</CardTitle>
                <Button 
                  onClick={() => setShowAddSkill(true)} 
                  size={isMobile ? 'sm' : 'default'}
                  disabled={showAddSkill}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddSkill && (
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Skill name"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <Button onClick={handleAddSkill} size="sm">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowAddSkill(false);
                        setNewSkill('');
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="group relative pr-6 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {skill.skill_name}
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {skills.length === 0 && !showAddSkill && (
                  <p className="text-muted-foreground text-center py-4">
                    No skills added yet. Click "Add Skill" to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Work Experience</CardTitle>
                <Button 
                  onClick={() => setShowAddWork(true)} 
                  size={isMobile ? 'sm' : 'default'}
                  disabled={showAddWork}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddWork && (
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div>
                          <label className="text-sm font-medium">Company</label>
                          <Input
                            value={newWorkExperience.company}
                            onChange={(e) => setNewWorkExperience(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <Input
                            value={newWorkExperience.role}
                            onChange={(e) => setNewWorkExperience(prev => ({ ...prev, role: e.target.value }))}
                            placeholder="Job title"
                          />
                        </div>
                      </div>
                      
                      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div>
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            type="date"
                            value={newWorkExperience.start_date}
                            onChange={(e) => setNewWorkExperience(prev => ({ ...prev, start_date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            type="date"
                            value={newWorkExperience.end_date}
                            onChange={(e) => setNewWorkExperience(prev => ({ ...prev, end_date: e.target.value }))}
                            disabled={newWorkExperience.currently_working}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="currently_working"
                          checked={newWorkExperience.currently_working}
                          onChange={(e) => setNewWorkExperience(prev => ({ 
                            ...prev, 
                            currently_working: e.target.checked,
                            end_date: e.target.checked ? '' : prev.end_date 
                          }))}
                        />
                        <label htmlFor="currently_working" className="text-sm">
                          I currently work here
                        </label>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newWorkExperience.description}
                          onChange={(e) => setNewWorkExperience(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your role and achievements..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Technologies (comma-separated)</label>
                        <Input
                          value={newWorkExperience.technologies}
                          onChange={(e) => setNewWorkExperience(prev => ({ ...prev, technologies: e.target.value }))}
                          placeholder="React, TypeScript, Node.js"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleAddWorkExperience} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowAddWork(false);
                            setNewWorkExperience({
                              company: '',
                              role: '',
                              start_date: '',
                              end_date: '',
                              currently_working: false,
                              description: '',
                              technologies: ''
                            });
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
                
                <div className="space-y-3">
                  {workExperiences.map((experience) => (
                    <Card key={experience.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{experience.company}</h3>
                          <p className="text-sm text-muted-foreground">{experience.role}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {experience.start_date && new Date(experience.start_date).toLocaleDateString()} 
                            {' — '}
                            {experience.currently_working 
                              ? 'Present' 
                              : experience.end_date 
                                ? new Date(experience.end_date).toLocaleDateString()
                                : 'Present'
                            }
                          </p>
                          {experience.description && (
                            <p className="text-sm mt-2">{experience.description}</p>
                          )}
                          {experience.technologies && experience.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {experience.technologies.map((tech, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleDeleteWorkExperience(experience.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {workExperiences.length === 0 && !showAddWork && (
                  <p className="text-muted-foreground text-center py-4">
                    No work experience added yet. Click "Add Experience" to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-6">
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Link to="/profile/me">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}