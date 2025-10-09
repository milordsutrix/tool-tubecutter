import { type Video, type InsertVideo, type Selection, type InsertSelection, type Job, type InsertJob } from "@shared/schema";
import { randomUUID } from "crypto";

// Interface pour le stockage de l'état OAuth
export interface IOAuthState {
  state: string;
  selectionId: string;
  createdAt: number;
}

export interface IStorage {
  // Opérations sur les vidéos
  getVideo(id: string): Promise<Video | undefined>;
  getVideoByUrl(youtubeUrl: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;

  // Opérations sur les sélections
  getSelection(id: string): Promise<Selection | undefined>;
  getSelectionsByVideoId(videoId: string): Promise<Selection[]>;
  createSelection(selection: InsertSelection): Promise<Selection>;
  updateSelection(id: string, updates: Partial<Selection>): Promise<Selection | undefined>;

  // Opérations sur les tâches (Jobs)
  getJob(id: string): Promise<Job | undefined>;
  getJobByVideoId(videoId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  // Opérations sur l'état OAuth
  createAuthState(selectionId: string): Promise<IOAuthState>;
  getAuthState(state: string): Promise<IOAuthState | undefined>;
  deleteAuthState(state: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video> = new Map();
  private selections: Map<string, Selection> = new Map();
  private jobs: Map<string, Job> = new Map();
  private oauthStates: Map<string, IOAuthState> = new Map();

  constructor() {
    // Nettoyage périodique des états OAuth expirés (toutes les minutes)
    setInterval(() => {
      const now = Date.now();
      this.oauthStates.forEach((authState, state) => {
        // Supprimer si plus vieux que 10 minutes (600000 ms)
        if (now - authState.createdAt > 600000) {
          this.oauthStates.delete(state);
          console.log(`État OAuth expiré et supprimé: ${state}`);
        }
      });
    }, 60000);
  }

  // --- Opérations sur les vidéos ---
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

  // --- Opérations sur les sélections ---
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

  // --- Opérations sur les tâches (Jobs) ---
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

  // --- NOUVELLES MÉTHODES POUR L'ÉTAT OAUTH ---
  async createAuthState(selectionId: string): Promise<IOAuthState> {
    const state = randomUUID();
    const authState: IOAuthState = {
      state,
      selectionId,
      createdAt: Date.now(),
    };
    this.oauthStates.set(state, authState);
    return authState;
  }

  async getAuthState(state: string): Promise<IOAuthState | undefined> {
    return this.oauthStates.get(state);
  }

  async deleteAuthState(state: string): Promise<void> {
    this.oauthStates.delete(state);
  }
}

export const storage = new MemStorage();