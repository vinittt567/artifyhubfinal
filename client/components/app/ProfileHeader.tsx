import { ClayCard } from "@/components/app/ClayCard";
import { Badge } from "@/components/ui/badge";
import { Verified } from "lucide-react";
import { useResponsive } from "@/hooks/useResponsive";

export function ProfileHeader({
  name,
  username,
  tagline,
  avatarUrl,
  isVerified,
  followerCount,
  followingCount,
  postCount,
  onEdit,
}: {
  name: string;
  username: string;
  tagline: string;
  avatarUrl?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  onEdit?: () => void;
}) {
  const { isMobile } = useResponsive();
  
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ClayCard className="relative overflow-hidden">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
      <div className={`flex gap-6 ${isMobile ? 'flex-col items-center text-center' : 'items-center'}`}>
        <div className={`flex-none rounded-full bg-muted ring-4 ring-white/5 overflow-hidden ${
          isMobile ? 'h-20 w-20' : 'h-24 w-24'
        }`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full bg-brand/10 text-brand flex items-center justify-center font-semibold ${
              isMobile ? 'text-lg' : 'text-xl'
            }`}>
              {initials}
            </div>
          )}
        </div>
        
        <div className={`min-w-0 flex-1 ${isMobile ? 'space-y-2' : ''}`}>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h1 className={`truncate font-semibold ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              {name}
            </h1>
            {isVerified && (
              <Verified className={`text-blue-500 ${
                isMobile ? 'h-5 w-5' : 'h-6 w-6'
              }`} />
            )}
          </div>
          
          <p className="text-muted-foreground">@{username}</p>
          <p className={`text-muted-foreground ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {tagline}
          </p>
          
          {/* Stats */}
          {(followerCount !== undefined || followingCount !== undefined || postCount !== undefined) && (
            <div className={`flex gap-4 text-sm ${
              isMobile ? 'justify-center mt-3' : 'mt-2'
            }`}>
              {postCount !== undefined && (
                <div className="text-center">
                  <div className="font-semibold">{postCount}</div>
                  <div className="text-muted-foreground text-xs">Posts</div>
                </div>
              )}
              {followerCount !== undefined && (
                <div className="text-center">
                  <div className="font-semibold">{followerCount}</div>
                  <div className="text-muted-foreground text-xs">Followers</div>
                </div>
              )}
              {followingCount !== undefined && (
                <div className="text-center">
                  <div className="font-semibold">{followingCount}</div>
                  <div className="text-muted-foreground text-xs">Following</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {onEdit && !isMobile && (
          <div className="ml-auto">
            <button
              onClick={onEdit}
              className="rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-muted"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
