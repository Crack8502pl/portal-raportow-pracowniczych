import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/app';

class FileService {
  async processUploadedFile(file: Express.Multer.File): Promise<{
    filename: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
  }> {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let processedFile = file;

    // Optimize images
    if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      processedFile = await this.optimizeImage(file);
    }

    return {
      filename: processedFile.filename,
      originalName: file.originalname,
      fileType: fileExtension.slice(1),
      fileSize: processedFile.size,
      filePath: processedFile.path
    };
  }

  private async optimizeImage(file: Express.Multer.File): Promise<Express.Multer.File> {
    try {
      const optimizedPath = file.path.replace(path.extname(file.path), '_optimized' + path.extname(file.path));
      
      await sharp(file.path)
        .resize(1920, 1080, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .png({ compressionLevel: 9 })
        .toFile(optimizedPath);

      // Replace original with optimized version
      const stats = fs.statSync(optimizedPath);
      fs.unlinkSync(file.path);
      fs.renameSync(optimizedPath, file.path);

      file.size = stats.size;
      
      return file;
    } catch (error) {
      console.error('Image optimization failed:', error);
      // Return original file if optimization fails
      return file;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath);
      }
      return null;
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }

  isAllowedFileType(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase().slice(1);
    return config.upload.allowedExtensions.includes(extension);
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw new Error('Directory creation failed');
    }
  }

  async cleanupOldFiles(directory: string, maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    let deletedCount = 0;
    
    try {
      if (!fs.existsSync(directory)) {
        return 0;
      }

      const files = fs.readdirSync(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAgeMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }

    return deletedCount;
  }

  getFileUrl(filename: string): string {
    return `/api/files/${filename}`;
  }

  getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export default new FileService();