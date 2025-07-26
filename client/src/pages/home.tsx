import { useState } from "react";
import YouTubeInput from "@/components/youtube-input";
import AudioUpload from "@/components/audio-upload";
import SelectionsManager from "@/components/selections-manager";
import ProcessingCard from "@/components/processing-card";
import DownloadsCard from "@/components/downloads-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";

export interface VideoInfo {
  title: string;
  duration: string;
  thumbnail?: string;
  channel?: string;
}

export interface Selection {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
}

export default function Home() {
  const [sourceType, setSourceType] = useState<"youtube" | "upload">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const addSelection = () => {
    const newSelection: Selection = {
      id: crypto.randomUUID(),
      startTime: "",
      endTime: "",
      title: "",
    };
    setSelections([...selections, newSelection]);
  };

  const updateSelection = (id: string, updates: Partial<Selection>) => {
    setSelections(selections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSelection = (id: string) => {
    setSelections(selections.filter(s => s.id !== id));
  };

  const resetForm = () => {
    setYoutubeUrl("");
    setVideoInfo(null);
    setSelections([]);
    setJobId(null);
    setVideoId(null);
    setSourceType("youtube");
  };

  const handleYouTubeSuccess = (url: string, info: VideoInfo, id?: string) => {
    setYoutubeUrl(url);
    setVideoInfo(info);
    setVideoId(id || null); // YouTube validation doesn't create a video yet
    setSourceType("youtube");
  };

  const handleUploadSuccess = (id: string, info: VideoInfo) => {
    setVideoInfo(info);
    setVideoId(id);
    setSourceType("upload");
    setYoutubeUrl(""); // Clear YouTube URL when using upload
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-material sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Music className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">YouTube MP3 Extractor</h1>
              <p className="text-sm text-gray-600">Extract multiple audio selections from YouTube videos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs value={sourceType} onValueChange={(value) => setSourceType(value as "youtube" | "upload")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
            <TabsTrigger value="upload">Upload MP3</TabsTrigger>
          </TabsList>
          <TabsContent value="youtube" className="mt-6">
            <YouTubeInput
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              videoInfo={videoInfo}
              setVideoInfo={(info, id) => handleYouTubeSuccess(youtubeUrl, info, id)}
            />
          </TabsContent>
          <TabsContent value="upload" className="mt-6">
            <AudioUpload
              onUploadSuccess={handleUploadSuccess}
              disabled={!!jobId}
            />
          </TabsContent>
        </Tabs>

        <SelectionsManager
          selections={selections}
          addSelection={addSelection}
          updateSelection={updateSelection}
          removeSelection={removeSelection}
        />

        <ProcessingCard
          sourceType={sourceType}
          youtubeUrl={youtubeUrl}
          uploadedFileId={sourceType === "upload" ? videoId : undefined}
          videoInfo={videoInfo}
          selections={selections}
          onProcessingStart={(jobId, videoId) => {
            setJobId(jobId);
            setVideoId(videoId);
          }}
        />

        {jobId && videoId && (
          <DownloadsCard
            jobId={jobId}
            videoId={videoId}
            onReset={resetForm}
          />
        )}
      </main>
    </div>
  );
}
