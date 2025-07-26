import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { YouTubeService } from "./services/youtube";
import { AudioService } from "./services/audio";
import { processVideoRequestSchema, validateYoutubeUrlSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const youtubeService = YouTubeService.getInstance();
  const audioService = AudioService.getInstance();

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Validate YouTube URL
  app.post("/api/youtube/validate", async (req, res) => {
    try {
      const { youtubeUrl } = validateYoutubeUrlSchema.parse(req.body);
      
      const isValid = await youtubeService.validateUrl(youtubeUrl);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      const videoInfo = await youtubeService.getVideoInfo(youtubeUrl);
      res.json({ valid: true, videoInfo });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to validate URL" });
    }
  });

  // Start processing video
  app.post("/api/process", async (req, res) => {
    try {
      const data = processVideoRequestSchema.parse(req.body);
      
      // Check if video already exists
      let video = await storage.getVideoByUrl(data.youtubeUrl);
      if (!video) {
        // Get video info and create video record
        const videoInfo = await youtubeService.getVideoInfo(data.youtubeUrl);
        video = await storage.createVideo({
          youtubeUrl: data.youtubeUrl,
          title: videoInfo.title,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail || null,
          channel: videoInfo.channel || null,
        });
      }

      // Create job
      const job = await storage.createJob({ videoId: video.id });

      // Create selections
      const selections = [];
      for (const selectionData of data.selections) {
        const startTime = parseTimeString(selectionData.startTime);
        const endTime = parseTimeString(selectionData.endTime);
        
        if (startTime >= endTime) {
          return res.status(400).json({ message: "Start time must be before end time" });
        }

        const selection = await storage.createSelection({
          videoId: video.id,
          startTime,
          endTime,
          title: selectionData.title,
        });
        selections.push(selection);
      }

      // Start background processing
      processVideoAsync(video.id, job.id);

      res.json({ jobId: job.id, videoId: video.id, selections });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to start processing" });
    }
  });

  // Get job status
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const video = await storage.getVideo(job.videoId);
      const selections = await storage.getSelectionsByVideoId(job.videoId);

      res.json({ job, video, selections });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get job status" });
    }
  });

  // Download file
  app.get("/api/download/:selectionId", async (req, res) => {
    try {
      const selection = await storage.getSelection(req.params.selectionId);
      if (!selection) {
        return res.status(404).json({ message: "Selection not found" });
      }

      if (!selection.filePath || !fs.existsSync(selection.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      const filename = selection.filename || `${selection.title}.mp3`;
      res.download(selection.filePath, filename);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to download file" });
    }
  });

  // Download all as ZIP
  app.get("/api/download-all/:videoId", async (req, res) => {
    try {
      const selections = await storage.getSelectionsByVideoId(req.params.videoId);
      const completedSelections = selections.filter(s => s.status === "completed" && s.filePath);

      if (completedSelections.length === 0) {
        return res.status(404).json({ message: "No completed files found" });
      }

      const filePaths = completedSelections.map(s => s.filePath!);
      const zipPath = path.join(uploadsDir, `${req.params.videoId}-all.zip`);

      await audioService.createZipArchive(filePaths, zipPath);

      res.download(zipPath, "audio-selections.zip", (err) => {
        if (!err) {
          // Clean up zip file after download
          fs.unlink(zipPath, () => {});
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create ZIP archive" });
    }
  });

  // Background processing function
  async function processVideoAsync(videoId: string, jobId: string) {
    try {
      await storage.updateJob(jobId, { status: "processing", progress: 10 });
      
      const video = await storage.getVideo(videoId);
      if (!video) throw new Error("Video not found");

      // Download audio
      const audioPath = await youtubeService.downloadAudio(video.youtubeUrl, uploadsDir);
      await storage.updateJob(jobId, { progress: 30 });

      const selections = await storage.getSelectionsByVideoId(videoId);
      const totalSelections = selections.length;

      // Process each selection
      for (let i = 0; i < selections.length; i++) {
        const selection = selections[i];
        await storage.updateSelection(selection.id, { status: "processing" });

        try {
          const result = await audioService.extractSegment({
            inputPath: audioPath,
            outputPath: path.join(uploadsDir, `${selection.id}.mp3`),
            startTime: selection.startTime,
            endTime: selection.endTime,
            title: selection.title,
          });

          const filename = `${selection.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp3`;
          
          await storage.updateSelection(selection.id, {
            status: "completed",
            filePath: result.filePath,
            fileSize: result.fileSize,
            filename,
          });

          const progress = 30 + Math.floor(((i + 1) / totalSelections) * 60);
          await storage.updateJob(jobId, { progress });
        } catch (error) {
          await storage.updateSelection(selection.id, { status: "error" });
        }
      }

      await storage.updateJob(jobId, { status: "completed", progress: 100 });

      // Clean up original audio file
      if (fs.existsSync(audioPath)) {
        fs.unlink(audioPath, () => {});
      }
    } catch (error) {
      await storage.updateJob(jobId, { 
        status: "error", 
        error: error instanceof Error ? error.message : "Processing failed" 
      });
    }
  }

  function parseTimeString(timeStr: string): number {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  const httpServer = createServer(app);
  return httpServer;
}
