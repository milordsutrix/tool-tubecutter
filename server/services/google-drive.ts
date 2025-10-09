import { google } from 'googleapis';
import fs from 'fs';
import { IDriveService, DriveFile } from './drive.js';

export class GoogleDriveService implements IDriveService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(state?: string): string {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
    });
  }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async uploadFile(filePath: string, fileName: string, accessToken: string): Promise<DriveFile> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const fileMetadata = {
      name: fileName,
    };
    const media = {
      mimeType: 'audio/mpeg',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, parents',
    });

    return response.data as DriveFile;
  }
}