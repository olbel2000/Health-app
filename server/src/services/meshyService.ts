/**
 * Meshy.ai API Service
 * Handles 3D model generation via Meshy.ai Text-to-3D API
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import type {
  AssetStyle,
  MeshyTaskResponse,
  MeshyTaskStatus,
  StyleConfig,
} from '../types/index.js';
import { STYLE_CONFIGS as styleConfigs } from '../types/index.js';

const MESHY_API_BASE = 'https://api.meshy.ai/v2';
const POLLING_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 120; // 10 minutes max wait

export class MeshyService {
  private apiKey: string;
  private assetsDir: string;

  constructor(apiKey?: string, assetsDir?: string) {
    this.apiKey = apiKey || process.env.MESHY_API_KEY || '';
    this.assetsDir = assetsDir || process.env.ASSETS_DIR || './public/assets';

    if (!this.apiKey) {
      console.warn('[Meshy] WARNING: No API key provided. Set MESHY_API_KEY environment variable.');
    }

    // Ensure assets directory exists
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }
  }

  /**
   * Build the full prompt with style modifiers
   */
  private buildPrompt(keyword: string, style: AssetStyle): string {
    const config: StyleConfig = styleConfigs[style];
    return `A ${keyword}, ${config.promptModifier}, isolated on transparent background, centered composition`;
  }

  /**
   * Create a Text-to-3D task on Meshy.ai
   */
  async createTextTo3DTask(keyword: string, style: AssetStyle): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Meshy API key not configured');
    }

    const config: StyleConfig = styleConfigs[style];
    const prompt = this.buildPrompt(keyword, style);

    console.log(`[Meshy] Creating task for "${keyword}" with style "${style}"`);
    console.log(`[Meshy] Prompt: ${prompt}`);

    const response = await fetch(`${MESHY_API_BASE}/text-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'preview',
        prompt: prompt,
        art_style: config.artStyle,
        negative_prompt: config.negativePrompt,
        ai_model: 'meshy-4',
        topology: 'triangle',
        target_polycount: 30000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as MeshyTaskResponse;
    console.log(`[Meshy] Task created with ID: ${data.result}`);
    
    return data.result;
  }

  /**
   * Get task status from Meshy.ai
   */
  async getTaskStatus(taskId: string): Promise<MeshyTaskStatus> {
    if (!this.apiKey) {
      throw new Error('Meshy API key not configured');
    }

    const response = await fetch(`${MESHY_API_BASE}/text-to-3d/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${errorText}`);
    }

    return await response.json() as MeshyTaskStatus;
  }

  /**
   * Poll task until completion
   */
  async waitForTaskCompletion(taskId: string): Promise<MeshyTaskStatus> {
    console.log(`[Meshy] Waiting for task ${taskId} to complete...`);

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      const status = await this.getTaskStatus(taskId);

      console.log(`[Meshy] Task ${taskId}: ${status.status} (${status.progress}%)`);

      switch (status.status) {
        case 'SUCCEEDED':
          console.log(`[Meshy] Task ${taskId} completed successfully!`);
          return status;

        case 'FAILED':
          throw new Error(`Task failed: ${status.task_error?.message || 'Unknown error'}`);

        case 'EXPIRED':
          throw new Error('Task expired before completion');

        case 'PENDING':
        case 'IN_PROGRESS':
          // Continue polling
          await this.sleep(POLLING_INTERVAL_MS);
          break;

        default:
          console.warn(`[Meshy] Unknown status: ${status.status}`);
          await this.sleep(POLLING_INTERVAL_MS);
      }
    }

    throw new Error('Task polling timeout - exceeded maximum wait time');
  }

  /**
   * Download GLB file from URL
   */
  async downloadGLB(url: string, keyword: string, style: AssetStyle): Promise<string> {
    console.log(`[Meshy] Downloading GLB for "${keyword}"...`);

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

    console.log(`[Meshy] Downloaded to: ${filepath}`);
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
    const status = await this.waitForTaskCompletion(taskId);

    // Step 3: Download GLB
    if (!status.model_urls?.glb) {
      throw new Error('No GLB URL in completed task');
    }

    const filename = await this.downloadGLB(status.model_urls.glb, keyword, style);

    return { filename, taskId };
  }

  /**
   * Check if Meshy API is configured
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
    return Object.keys(styleConfigs) as AssetStyle[];
  }
}

export default MeshyService;
