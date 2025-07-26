import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export interface AudioSegment {
  inputPath: string;
  outputPath: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  title: string;
}

export class AudioService {
  private static instance: AudioService;
  
  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private timeToSeconds(timeString: string): number {
    const parts = timeString.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  async extractSegment(segment: AudioSegment): Promise<{ filePath: string; fileSize: number }> {
    const duration = segment.endTime - segment.startTime;
    const sanitizedTitle = this.sanitizeFilename(segment.title);
    const outputPath = path.join(path.dirname(segment.outputPath), `${sanitizedTitle}.mp3`);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', segment.inputPath,
        '-ss', segment.startTime.toString(),
        '-t', duration.toString(),
        '-acodec', 'libmp3lame',
        '-ab', '192k',
        '-y', // overwrite output file
        outputPath
      ]);

      let error = '';

      ffmpeg.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg failed: ${error}`));
          return;
        }

        // Get file size
        fs.stat(outputPath, (err, stats) => {
          if (err) {
            reject(new Error(`Failed to get file stats: ${err.message}`));
            return;
          }

          resolve({
            filePath: outputPath,
            fileSize: stats.size,
          });
        });
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      });
    });
  }

  async createZipArchive(filePaths: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const zip = spawn('zip', ['-j', outputPath, ...filePaths]);

      let error = '';

      zip.stderr.on('data', (data) => {
        error += data.toString();
      });

      zip.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Zip creation failed: ${error}`));
          return;
        }
        resolve();
      });

      zip.on('error', (err) => {
        reject(new Error(`Zip error: ${err.message}`));
      });
    });
  }
}
