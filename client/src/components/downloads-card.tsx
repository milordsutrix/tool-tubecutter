import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Download, FileAudio, Archive, RotateCcw, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface Selection {
  id: string;
  title: string;
  status: string;
  filename: string | null;
  fileSize: number | null;
  startTime: number;
  endTime: number;
}

interface Job {
  id: string;
  status: string;
  progress: number;
  error: string | null;
}

interface DownloadsCardProps {
  jobId: string;
  videoId: string;
  onReset: () => void;
}

export default function DownloadsCard({ jobId, videoId, onReset }: DownloadsCardProps) {
  const [pollingInterval, setPollingInterval] = useState(1000);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/jobs", jobId],
    refetchInterval: pollingInterval,
  });

  const job: Job = data?.job;
  const selections: Selection[] = data?.selections || [];

  // Stop polling when job is completed or errored
  useEffect(() => {
    if (job?.status === "completed" || job?.status === "error") {
      setPollingInterval(0);
    }
  }, [job?.status]);

  const completedSelections = selections.filter(s => s.status === "completed");
  const processingSelections = selections.filter(s => s.status === "processing");
  const errorSelections = selections.filter(s => s.status === "error");

  const handleDownload = (selectionId: string) => {
    const link = document.createElement('a');
    link.href = `/api/download/${selectionId}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    const link = document.createElement('a');
    link.href = `/api/download-all/${videoId}`;
    link.download = 'audio-selections.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Processing...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading job status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load job status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Download className="text-success mr-2" />
            Processing Status & Downloads
          </h2>
          <Button variant="outline" onClick={onReset} className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>New Job</span>
          </Button>
        </div>

        {/* Overall Progress */}
        {job && job.status !== "pending" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {completedSelections.length} of {selections.length} completed
              </span>
            </div>
            <Progress value={job.progress} className="h-2" />
            
            {job.status === "error" && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                Error: {job.error}
              </div>
            )}
          </div>
        )}

        {/* Selections List */}
        <div className="space-y-3">
          {selections.map((selection) => (
            <div key={selection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                  <FileAudio className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selection.filename || `${selection.title}.mp3`}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDuration(selection.startTime, selection.endTime)} • 
                    {selection.fileSize ? ` ${formatFileSize(selection.fileSize)} • ` : " "}
                    {getStatusBadge(selection.status)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selection.status)}
                {selection.status === "completed" && (
                  <Button
                    onClick={() => handleDownload(selection.id)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Download All Button */}
          {completedSelections.length > 1 && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleDownloadAll}
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Archive className="h-4 w-4" />
                <span>Download All as ZIP</span>
              </Button>
            </div>
          )}

          {/* Empty State */}
          {selections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Download className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No files ready yet</p>
              <p className="text-sm">Processed files will appear here for download</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
