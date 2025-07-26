import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function YouTubeNotice() {
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="space-y-2">
          <p className="font-medium">YouTube Download Notice</p>
          <p className="text-sm">
            YouTube has implemented strong anti-bot measures since 2024. Some videos may fail to download. 
            If you encounter issues, try:
          </p>
          <ul className="text-sm list-disc ml-4 space-y-1">
            <li>Using a different YouTube video</li>
            <li>Shorter videos (under 10 minutes work better)</li>
            <li>Videos from smaller channels</li>
            <li>Public videos without age restrictions</li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Try Test Video
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}