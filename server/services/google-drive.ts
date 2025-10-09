import { google } from 'googleapis';
import fs from 'fs';
import { IDriveService, DriveFile } from './drive';
import { OAuth2Client } from 'google-auth-library';

export class GoogleDriveService implements IDriveService {
  private baseOAuth2Client: OAuth2Client;

  constructor() {
    this.baseOAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // La méthode accepte maintenant le 'state' pour la sécurité CSRF
  getAuthUrl(state: string): string {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    return this.baseOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Assure que l'on reçoit un refresh_token
      state: state, // Ajout du paramètre 'state'
    });
  }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.baseOAuth2Client.getToken(code);
    return tokens;
  }

  async uploadFile(filePath: string, fileName: string, tokens: any): Promise<DriveFile> {
    // CORRECTION : Créer un nouveau client authentifié pour cette opération spécifique
    // Cela évite tout problème d'état partagé et garantit que les jetons sont utilisés.
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth });

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

    if (!response.data) {
      throw new Error("L'envoi a échoué, aucune donnée renvoyée par l'API Google Drive.");
    }

    return response.data as DriveFile;
  }
}