/**
 * Tripo3D API Service
 * Handles 3D model generation via Tripo3D Text-to-3D API
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import type { AssetStyle, StyleConfig } from '../types/index.js';
import { STYLE_CONFIGS } from '../types/index.js';

const TRIPO_API_BASE = 'https://api.tripo3d.ai/v2/openapi';
const POLLING_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 60; // 5 minutes max wait

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatus {
  code: number;
  data: {
    task_id: string;
    type: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled' | 'unknown';
    input: Record<string, unknown>;
    output?: {
      model?: {
        url: string;
        type: string;
      };
      rendered_image?: {
        url: string;
        type: string;
      };
    };
    progress: number;
    create_time: number;
  };
}

export class TripoService {
  private apiKey: string;
  private assetsDir: string;

  constructor(apiKey?: string, assetsDir?: string) {
    this.apiKey = apiKey || process.env.TRIPO_API_KEY || '';
    this.assetsDir = assetsDir || process.env.ASSETS_DIR || './public/assets';

    if (!this.apiKey) {
      console.warn('[Tripo] WARNING: No API key provided. Set TRIPO_API_KEY environment variable.');
    } else {
      console.log('[Tripo] API key configured');
    }

    // Ensure assets directory exists
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }
  }

  /**
   * Build the prompt with style modifiers for Nano Banana aesthetic
   */
  private buildPrompt(keyword: string, style: AssetStyle): string {
    const config: StyleConfig = STYLE_CONFIGS[style];
    return `A cute stylized ${keyword}, ${config.promptModifier}, single object, centered, white background`;
  }

  /**
   * Create a Text-to-3D task on Tripo3D
   */
  async createTextTo3DTask(keyword: string, style: AssetStyle): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Tripo API key not configured');
    }

    const prompt = this.buildPrompt(keyword, style);

    console.log(`[Tripo] Creating task for "${keyword}" with style "${style}"`);
    console.log(`[Tripo] Prompt: ${prompt}`);

    const response = await fetch(`${TRIPO_API_BASE}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text_to_model',
        prompt: prompt,
        model_version: 'v2.0-20240919',
        face_limit: 10000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as TripoTaskResponse;
    
    if (data.code !== 0) {
      throw new Error(`Tripo API error: code ${data.code}`);
    }

    console.log(`[Tripo] Task created with ID: ${data.data.task_id}`);
    return data.data.task_id;
  }

  /**
   * Get task status from Tripo3D
   */
  async getTaskStatus(taskId: string): Promise<TripoTaskStatus> {
    if (!this.apiKey) {
      throw new Error('Tripo API key not configured');
    }

    const response = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tripo API error: ${response.status} - ${errorText}`);
    }

    return await response.json() as TripoTaskStatus;
  }

  /**
   * Poll task until completion
   */
  async waitForTaskCompletion(taskId: string): Promise<TripoTaskStatus> {
    console.log(`[Tripo] Waiting for task ${taskId} to complete...`);

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      const statusResponse = await this.getTaskStatus(taskId);
      const status = statusResponse.data.status;
      const progress = statusResponse.data.progress;

      console.log(`[Tripo] Task ${taskId}: ${status} (${progress}%)`);

      switch (status) {
        case 'success':
          console.log(`[Tripo] Task ${taskId} completed successfully!`);
          return statusResponse;

        case 'failed':
          throw new Error(`Task failed`);

        case 'cancelled':
          throw new Error('Task was cancelled');

        case 'queued':
        case 'running':
        case 'unknown':
          // Continue polling
          await this.sleep(POLLING_INTERVAL_MS);
          break;

        default:
          console.warn(`[Tripo] Unknown status: ${status}`);
          await this.sleep(POLLING_INTERVAL_MS);
      }
    }

    throw new Error('Task polling timeout - exceeded maximum wait time');
  }

  /**
   * Download GLB file from URL
   */
  async downloadGLB(url: string, keyword: string, style: AssetStyle): Promise<string> {
    console.log(`[Tripo] Downloading GLB for "${keyword}"...`);

    const filename = this.generateFilename(keyword, style);
    const filepath = path.join(this.assetsDir, filename);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download GLB: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Convert web ReadableStream to Node.js Readable
    const nodeReadable = Readable.fromWeb(response.body as import('stream/web').ReadableStream<Uint8Array>);
    const writeStream = fs.createWriteStream(filepath);
    
    await pipeline(nodeReadable, writeStream);

    console.log(`[Tripo] Downloaded to: ${filepath}`);
    return filename;
  }

  /**
   * Generate a consistent filename for an asset
   */
  private generateFilename(keyword: string, style: AssetStyle): string {
    const sanitized = keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${sanitized}_${style}.glb`;
  }

  /**
   * Full pipeline: Create task -> Wait -> Download
   */
  async generateAndDownload(
    keyword: string, 
    style: AssetStyle
  ): Promise<{ filename: string; taskId: string }> {
    // Step 1: Create task
    const taskId = await this.createTextTo3DTask(keyword, style);

    // Step 2: Wait for completion
    const statusResponse = await this.waitForTaskCompletion(taskId);

    // Step 3: Get the model URL
    const modelUrl = statusResponse.data.output?.model?.url;
    if (!modelUrl) {
      throw new Error('No model URL in completed task');
    }

    // Step 4: Download GLB
    const filename = await this.downloadGLB(modelUrl, keyword, style);

    return { filename, taskId };
  }

  /**
   * Check if Tripo API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available styles
   */
  getAvailableStyles(): AssetStyle[] {
    return Object.keys(STYLE_CONFIGS) as AssetStyle[];
  }
}

export default TripoService;
