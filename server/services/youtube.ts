import { spawn } from "child_process";
import path from "path";
import fs from "fs";

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
      // Multiple fallback strategies for YouTube's anti-bot measures
      const strategies = [
        [ // Strategy 1: Authenticated request using browser cookies
          '--cookies-from-browser', 'chrome',
          '-x', '--audio-format', 'mp3', '--audio-quality', '0',
          '-f', 'bestaudio/best',
          '-o', path.join(outputPath, '%(title)s.%(ext)s'),
          url
        ],
        [ // Strategy 2: Anonymous request (fallback)
          '-x', '--audio-format', 'mp3', '--audio-quality', '0',
          '-f', 'bestaudio/best',
          '-o', path.join(outputPath, '%(title)s.%(ext)s'),
          url
        ]
      ];


      const tryDownload = (strategyIndex: number = 0): void => {
        if (strategyIndex >= strategies.length) {
          reject(new Error('YouTube download failed: This video may be restricted or have anti-bot protection. YouTube has been blocking many download attempts since 2024. Try using a different video, or consider using YouTube Premium for offline access.'));
          return;
        }

        const ytDlp = spawn('yt-dlp', strategies[strategyIndex]);

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
            console.log(`Strategy ${strategyIndex + 1} failed:`, error);
            // Try next strategy
            tryDownload(strategyIndex + 1);
            return;
          }

          // Extract the downloaded file path from output
          const match = output.match(/\[download\] (.+\.mp3)/) || output.match(/\[ExtractAudio\] Destination: (.+\.mp3)/);
          if (match) {
            resolve(match[1]);
          } else {
            // Try to find any .mp3 file that was created
            const files = fs.readdirSync(outputPath).filter((f: string) => f.endsWith('.mp3'));
            if (files.length > 0) {
              resolve(path.join(outputPath, files[0]));
            } else {
              reject(new Error('Could not determine downloaded file path'));
            }
          }
        });

        ytDlp.on('error', (err) => {
          console.log(`Strategy ${strategyIndex + 1} error:`, err.message);
          // Try next strategy
          tryDownload(strategyIndex + 1);
        });
      };

      // Start with the first strategy
      tryDownload(0);
    });
  }
}
