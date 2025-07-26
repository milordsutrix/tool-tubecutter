import { type Video, type InsertVideo, type Selection, type InsertSelection, type Job, type InsertJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Video operations
  getVideo(id: string): Promise<Video | undefined>;
  getVideoByUrl(youtubeUrl: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;

  // Selection operations
  getSelection(id: string): Promise<Selection | undefined>;
  getSelectionsByVideoId(videoId: string): Promise<Selection[]>;
  createSelection(selection: InsertSelection): Promise<Selection>;
  updateSelection(id: string, updates: Partial<Selection>): Promise<Selection | undefined>;

  // Job operations
  getJob(id: string): Promise<Job | undefined>;
  getJobByVideoId(videoId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video> = new Map();
  private selections: Map<string, Selection> = new Map();
  private jobs: Map<string, Job> = new Map();

  // Video operations
  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideoByUrl(youtubeUrl: string): Promise<Video | undefined> {
    return Array.from(this.videos.values()).find(v => v.youtubeUrl === youtubeUrl);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      id,
      status: "pending",
      youtubeUrl: insertVideo.youtubeUrl || null,
      uploadedFile: insertVideo.uploadedFile || null,
      sourceType: insertVideo.sourceType || "youtube",
      thumbnail: insertVideo.thumbnail || null,
      channel: insertVideo.channel || null,
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;
    
    const updatedVideo = { ...video, ...updates };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  // Selection operations
  async getSelection(id: string): Promise<Selection | undefined> {
    return this.selections.get(id);
  }

  async getSelectionsByVideoId(videoId: string): Promise<Selection[]> {
    return Array.from(this.selections.values()).filter(s => s.videoId === videoId);
  }

  async createSelection(insertSelection: InsertSelection): Promise<Selection> {
    const id = randomUUID();
    const selection: Selection = {
      ...insertSelection,
      id,
      filename: null,
      status: "pending",
      filePath: null,
      fileSize: null,
    };
    this.selections.set(id, selection);
    return selection;
  }

  async updateSelection(id: string, updates: Partial<Selection>): Promise<Selection | undefined> {
    const selection = this.selections.get(id);
    if (!selection) return undefined;
    
    const updatedSelection = { ...selection, ...updates };
    this.selections.set(id, updatedSelection);
    return updatedSelection;
  }

  // Job operations
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobByVideoId(videoId: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(j => j.videoId === videoId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      ...insertJob,
      id,
      status: "pending",
      progress: 0,
      error: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
}

export const storage = new MemStorage();
