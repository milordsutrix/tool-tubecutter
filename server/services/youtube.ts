import { spawn } from "child_process";
import path from "path";

export interface VideoInfo {
  title: string;
  duration: number; // in seconds
  thumbnail?: string;
  channel?: string;
}

export class YouTubeService {
  private static instance: YouTubeService;
  
  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async validateUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ytDlp = spawn('yt-dlp', ['--quiet', '--no-download', '--print', 'id', url]);
      
      ytDlp.on('close', (code) => {
        resolve(code === 0);
      });

      ytDlp.on('error', () => {
        resolve(false);
      });
    });
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', [
        '--quiet',
        '--no-download',
        '--print', '%(title)s|%(duration)s|%(thumbnail)s|%(uploader)s',
        url
      ]);

      let output = '';
      let error = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        error += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to get video info: ${error}`));
          return;
        }

        try {
          const [title, duration, thumbnail, channel] = output.trim().split('|');
          resolve({
            title: title || 'Unknown Title',
            duration: parseInt(duration) || 0,
            thumbnail: thumbnail || undefined,
            channel: channel || undefined,
          });
        } catch (err) {
          reject(new Error('Failed to parse video info'));
        }
      });

      ytDlp.on('error', (err) => {
        reject(new Error(`yt-dlp error: ${err.message}`));
      });
    });
  }

  async downloadAudio(url: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', path.join(outputPath, '%(title)s.%(ext)s'),
        url
      ]);

      let output = '';
      let error = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        error += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to download audio: ${error}`));
          return;
        }

        // Extract the downloaded file path from output
        const match = output.match(/\[download\] (.+\.mp3)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error('Could not determine downloaded file path'));
        }
      });

      ytDlp.on('error', (err) => {
        reject(new Error(`yt-dlp error: ${err.message}`));
      });
    });
  }
}
