import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Youtube, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VideoInfo } from "@/pages/home";
import YouTubeNotice from "./youtube-notice";

interface YouTubeInputProps {
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  videoInfo: VideoInfo | null;
  setVideoInfo: (info: VideoInfo | null, videoId?: string) => void;
}

export default function YouTubeInput({
  youtubeUrl,
  setYoutubeUrl,
  videoInfo,
  setVideoInfo,
}: YouTubeInputProps) {
  const [error, setError] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/youtube/validate", { youtubeUrl: url });
      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      setVideoInfo({
        title: data.videoInfo.title,
        duration: formatDuration(data.videoInfo.duration),
        thumbnail: data.videoInfo.thumbnail,
        channel: data.videoInfo.channel,
      }, data.videoId);
    },
    onError: (error: Error) => {
      setError(error.message);
      setVideoInfo(null);
    },
  });

  const handleValidate = () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }
    setError(null);
    validateMutation.mutate(youtubeUrl);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Youtube className="text-red-600 mr-2" />
          YouTube Video Input
        </h2>
        
        <YouTubeNotice />
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="youtube-url" className="text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </Label>
            <div className="relative">
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="pr-12"
                disabled={validateMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleValidate();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleValidate}
                disabled={validateMutation.isPending}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Video Preview */}
          {videoInfo && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start space-x-4">
                {videoInfo.thumbnail && (
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="w-30 h-20 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {videoInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Duration: {videoInfo.duration}
                    {videoInfo.channel && ` • ${videoInfo.channel}`}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Video loaded successfully
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
