import { GoogleDriveService } from './google-drive';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
}

export interface IDriveService {
  // La signature est modifiée pour inclure le 'state'
  getAuthUrl(state: string): string;
  getTokens(code: string): Promise<any>;
  uploadFile(filePath: string, fileName: string, tokens: any): Promise<DriveFile>;
}

export class DriveServiceFactory {
  static getDriveService(provider: string): IDriveService {
    switch (provider) {
      case 'google':
        return new GoogleDriveService();
      // Ajouter d'autres fournisseurs ici à l'avenir
      // case 'onedrive':
      //   return new OneDriveService();
      default:
        throw new Error('Invalid drive provider');
    }
  }
}