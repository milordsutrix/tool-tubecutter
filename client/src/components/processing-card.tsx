import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ServerCog, Play, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VideoInfo, Selection } from "@/pages/home";

interface ProcessingCardProps {
  youtubeUrl: string;
  videoInfo: VideoInfo | null;
  selections: Selection[];
  onProcessingStart: (jobId: string, videoId: string) => void;
}

export default function ProcessingCard({
  youtubeUrl,
  videoInfo,
  selections,
  onProcessingStart,
}: ProcessingCardProps) {
  const [error, setError] = useState<string | null>(null);

  const processMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/process", {
        youtubeUrl,
        selections: selections.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          title: s.title,
        })),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      onProcessingStart(data.jobId, data.videoId);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const calculateTotalDuration = (): string => {
    let totalSeconds = 0;
    
    selections.forEach(selection => {
      if (selection.startTime && selection.endTime) {
        const parseTime = (time: string): number => {
          const parts = time.split(':').map(n => parseInt(n));
          if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
          return 0;
        };

        const start = parseTime(selection.startTime);
        const end = parseTime(selection.endTime);
        totalSeconds += Math.max(0, end - start);
      }
    });

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateEstimatedSize = (): string => {
    const totalDuration = calculateTotalDuration();
    const [minutes, seconds] = totalDuration.split(':').map(n => parseInt(n));
    const totalDurationSeconds = minutes * 60 + seconds;
    
    // Estimate ~128kbps MP3 = ~1MB per minute
    const estimatedMB = (totalDurationSeconds / 60) * 1;
    return `${estimatedMB.toFixed(1)}MB`;
  };

  const isValidForProcessing = (): boolean => {
    if (!youtubeUrl || !videoInfo || selections.length === 0) return false;
    
    return selections.every(s => {
      if (!s.startTime || !s.endTime || !s.title.trim()) return false;
      
      // More flexible time pattern - allow MM:SS or HH:MM:SS format
      const timePattern = /^(\d{1,2}):([0-5]?\d)$|^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/;
      const startValid = timePattern.test(s.startTime);
      const endValid = timePattern.test(s.endTime);
      
      if (!startValid || !endValid) return false;
      
      // Validate start < end
      const parseTime = (time: string): number => {
        const parts = time.split(':').map(n => parseInt(n));
        if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
      };
      
      const startSeconds = parseTime(s.startTime);
      const endSeconds = parseTime(s.endTime);
      return startSeconds < endSeconds;
    });
  };

  const handleStartProcessing = () => {
    if (!isValidForProcessing()) {
      setError("Please ensure all selections have valid start times, end times, and titles");
      return;
    }
    setError(null);
    processMutation.mutate();
  };

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <ServerCog className="text-primary mr-2" />
          Processing
        </h2>

        {/* Processing Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{selections.length}</div>
              <div className="text-sm text-gray-600">Selections</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{calculateTotalDuration()}</div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{calculateEstimatedSize()}</div>
              <div className="text-sm text-gray-600">Estimated Size</div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Validation Status */}
        {selections.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-blue-900">Validation Status:</span>
                {isValidForProcessing() ? (
                  <span className="text-green-600 font-medium">✓ Ready to process</span>
                ) : (
                  <span className="text-amber-600 font-medium">⚠ Please complete all fields</span>
                )}
              </div>
              <div className="text-blue-700 text-xs">
                • YouTube URL: {youtubeUrl && videoInfo ? '✓' : '✗'}<br/>
                • Selections: {selections.length > 0 ? '✓' : '✗'}<br/>
                • All fields filled: {selections.every(s => s.startTime && s.endTime && s.title.trim()) ? '✓' : '✗'}
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleStartProcessing}
            disabled={!isValidForProcessing() || processMutation.isPending}
            size="lg"
            className="px-8 py-3 text-lg flex items-center space-x-3"
          >
            <Play className="h-5 w-5" />
            <span>{processMutation.isPending ? "Starting..." : "Start Processing"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
