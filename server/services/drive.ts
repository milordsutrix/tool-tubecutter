import { GoogleDriveService } from './google-drive';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
}

export interface IDriveService {
  getAuthUrl(state?: string): string;
  getTokens(code: string): Promise<any>;
  uploadFile(filePath: string, fileName: string, accessToken: string): Promise<DriveFile>;
}

export class DriveServiceFactory {
  static getDriveService(provider: string): IDriveService {
    switch (provider) {
      case 'google':
        return new GoogleDriveService();
      // Add other providers here in the future
      // case 'onedrive':
      //   return new OneDriveService();
      default:
        throw new Error('Invalid drive provider');
    }
  }
}