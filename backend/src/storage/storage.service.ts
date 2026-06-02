import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || this.configService.get<string>('SUPABASE_ANON_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!supabaseUrl) {
      throw new Error('StorageService requires SUPABASE_URL env var');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { data, error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return data;
  }

  async listFiles(bucket: string, prefix: string) {
    const { data, error } = await this.supabase.storage.from(bucket).list(prefix);
    if (error) throw error;
    return data;
  }
}
