import sharp from 'sharp';
import { getStorage, getFirestore } from '../firebase';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as https from 'https';
import * as http from 'http';

export interface StorageFileRecord {
  storagePath: string;
  url: string;
  ownerId: string;
  type: 'campaign' | 'followup' | 'email_followup' | 'template';
  relatedEntityId?: string;
  fileName: string;
  size: number;
  createdAt: string;
}

export async function trackStorageFile(
  storagePath: string,
  url: string,
  ownerId: string,
  type: StorageFileRecord['type'],
  fileName: string,
  size: number,
  relatedEntityId?: string
): Promise<string> {
  const db = getFirestore();
  const record: StorageFileRecord = {
    storagePath,
    url,
    ownerId,
    type,
    fileName,
    size,
    createdAt: new Date().toISOString(),
    ...(relatedEntityId && { relatedEntityId }),
  };
  
  const docRef = await db.collection('storageFiles').add(record);
  return docRef.id;
}

export async function deleteStorageFilesByOwner(ownerId: string): Promise<number> {
  const db = getFirestore();
  const storage = getStorage();
  if (!storage) return 0;

  const snapshot = await db.collection('storageFiles')
    .where('ownerId', '==', ownerId)
    .get();

  let deleted = 0;
  const bucket = storage.bucket();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      await bucket.file(data.storagePath).delete();
      await doc.ref.delete();
      deleted++;
    } catch (error: any) {
      if (error.code === 404) {
        await doc.ref.delete();
        deleted++;
      } else {
        console.error(`Failed to delete ${data.storagePath}:`, error);
      }
    }
  }

  return deleted;
}

export async function deleteStorageFilesByEntity(
  ownerId: string,
  type: StorageFileRecord['type'],
  relatedEntityId: string
): Promise<number> {
  const db = getFirestore();
  const storage = getStorage();
  if (!storage) return 0;

  const snapshot = await db!.collection('storageFiles')
    .where('ownerId', '==', ownerId)
    .where('type', '==', type)
    .where('relatedEntityId', '==', relatedEntityId)
    .get();

  let deleted = 0;
  const bucket = storage.bucket();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      await bucket.file(data.storagePath).delete();
      await doc.ref.delete();
      deleted++;
    } catch (error: any) {
      if (error.code === 404) {
        await doc.ref.delete();
        deleted++;
      } else {
        console.error(`Failed to delete ${data.storagePath}:`, error);
      }
    }
  }

  return deleted;
}

export async function getStorageFilesByOwner(ownerId: string): Promise<(StorageFileRecord & { id: string })[]> {
  const db = getFirestore();
  if (!db) return [];
  
  try {
    // Try with ordering first (requires composite index: ownerId + createdAt)
    const snapshot = await db.collection('storageFiles')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as StorageFileRecord,
    }));
  } catch (error: any) {
    // Fallback without ordering if index doesn't exist
    if (error.code === 9 || error.message?.includes('index')) {
      console.warn('Firestore index not available for storageFiles, falling back to unordered query');
      const snapshot = await db.collection('storageFiles')
        .where('ownerId', '==', ownerId)
        .get();

      const files = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as StorageFileRecord,
      }));
      
      // Sort in memory
      return files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    throw error;
  }
}

export async function deleteStorageFileById(fileId: string, ownerId: string): Promise<boolean> {
  const db = getFirestore();
  const storage = getStorage();
  if (!storage) return false;

  const doc = await db.collection('storageFiles').doc(fileId).get();
  if (!doc.exists) return false;

  const data = doc.data() as StorageFileRecord;
  if (data.ownerId !== ownerId) return false;

  try {
    const bucket = storage.bucket();
    await bucket.file(data.storagePath).delete();
  } catch (error: any) {
    if (error.code !== 404) {
      console.error(`Failed to delete storage file:`, error);
    }
  }

  await doc.ref.delete();
  return true;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          fetchImageBuffer(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

export interface ImagePersonalizationOptions {
  baseImagePath: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  outputPath?: string;
}

export async function personalizeImage(options: ImagePersonalizationOptions): Promise<string> {
  const { baseImagePath, text, x, y, fontSize, fontColor } = options;

  const svgText = `
    <svg width="1200" height="200">
      <text x="${x}" y="${y}" font-family="Arial" font-size="${fontSize}" fill="${fontColor}" font-weight="bold">
        ${text}
      </text>
    </svg>
  `;

  const textBuffer = Buffer.from(svgText);
  
  const image = await sharp(baseImagePath)
    .composite([
      {
        input: textBuffer,
        top: 0,
        left: 0,
      }
    ])
    .jpeg({ quality: 85 })
    .toBuffer();

  return image.toString('base64');
}

export async function personalizeImageFromUrl(
  imageUrl: string,
  text: string,
  settings: { x: number; y: number; fontSize: number; fontColor: string },
  forMMS: boolean = false
): Promise<Buffer> {
  const { x, y, fontSize, fontColor } = settings;
  
  // Fetch the image from URL using https/http modules for Node compatibility
  const imageBuffer = await fetchImageBuffer(imageUrl);
  
  // Get image metadata to properly position text
  const metadata = await sharp(imageBuffer).metadata();
  let width = metadata.width || 800;
  let height = metadata.height || 600;
  
  // For MMS, resize to max 480x360 to keep file size under 100KB
  let resizedBuffer = imageBuffer;
  let scale = 1;
  if (forMMS) {
    const maxWidth = 480;
    const maxHeight = 360;
    if (width > maxWidth || height > maxHeight) {
      scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      resizedBuffer = await sharp(imageBuffer)
        .resize(width, height)
        .toBuffer();
    }
  }
  
  // Scale font size proportionally for MMS
  const scaledFontSize = forMMS ? Math.round(fontSize * scale) : fontSize;
  
  // Create SVG with text overlay - x and y are percentages
  const textX = Math.round((x / 100) * width);
  const textY = Math.round((y / 100) * height);
  
  const svgText = `
    <svg width="${width}" height="${height}">
      <text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="${scaledFontSize}" fill="${fontColor}" font-weight="bold">
        ${escapeXml(text)}
      </text>
    </svg>
  `;

  const textBuffer = Buffer.from(svgText);
  
  // For MMS use lower quality to meet file size limits (<100KB)
  const quality = forMMS ? 50 : 85;
  
  const result = await sharp(resizedBuffer)
    .composite([
      {
        input: textBuffer,
        top: 0,
        left: 0,
      }
    ])
    .jpeg({ quality, progressive: true })
    .toBuffer();

  return result;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function personalizeImageFromBuffer(
  imageBuffer: Buffer,
  text: string,
  settings: { x: number; y: number; fontSize: number; fontColor: string },
  forMMS: boolean = false
): Promise<Buffer> {
  const { x, y, fontSize, fontColor } = settings;
  
  // Get image metadata to properly position text
  const metadata = await sharp(imageBuffer).metadata();
  let width = metadata.width || 800;
  let height = metadata.height || 600;
  
  // For MMS, resize to max 480x360 to keep file size under 100KB
  let resizedBuffer = imageBuffer;
  let scale = 1;
  if (forMMS) {
    const maxWidth = 480;
    const maxHeight = 360;
    if (width > maxWidth || height > maxHeight) {
      scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      resizedBuffer = await sharp(imageBuffer)
        .resize(width, height)
        .toBuffer();
    }
  }
  
  // Scale font size proportionally for MMS
  const scaledFontSize = forMMS ? Math.round(fontSize * scale) : fontSize;
  
  // Create SVG with text overlay - x and y are percentages
  const textX = Math.round((x / 100) * width);
  const textY = Math.round((y / 100) * height);
  
  const svgText = `
    <svg width="${width}" height="${height}">
      <text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="${scaledFontSize}" fill="${fontColor}" font-weight="bold">
        ${escapeXml(text)}
      </text>
    </svg>
  `;

  const textBuffer = Buffer.from(svgText);
  
  // For MMS use lower quality to meet file size limits (<100KB)
  const quality = forMMS ? 50 : 85;
  
  const result = await sharp(resizedBuffer)
    .composite([
      {
        input: textBuffer,
        top: 0,
        left: 0,
      }
    ])
    .jpeg({ quality, progressive: true })
    .toBuffer();

  return result;
}

export async function uploadToFirebaseStorage(
  buffer: Buffer,
  userId: string,
  fileName: string
): Promise<{ url: string; storagePath: string; size: number }> {
  const storage = getStorage();
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  // Detect content type from file extension
  let contentType = 'application/octet-stream';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (fileName.endsWith('.png')) {
    contentType = 'image/png';
  } else if (fileName.endsWith('.txt')) {
    contentType = 'text/plain; charset=utf-8';
  }

  const bucket = storage.bucket();
  const storagePath = `${userId}/${uuidv4()}-${fileName}`;
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
    public: true,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  return { url: publicUrl, storagePath, size: buffer.length };
}

export async function deleteFromFirebaseStorage(storagePath: string): Promise<void> {
  const storage = getStorage();
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    await file.delete();
    console.log(`Deleted storage file: ${storagePath}`);
  } catch (error: any) {
    if (error.code === 404) {
      console.log(`File not found, skipping: ${storagePath}`);
    } else {
      console.error(`Failed to delete storage file: ${storagePath}`, error);
      throw error;
    }
  }
}

export function extractStoragePathFromUrl(url: string): string | null {
  try {
    const match = url.match(/storage\.googleapis\.com\/[^\/]+\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function generatePersonalizedImages(
  baseImagePath: string,
  clients: Array<{ name: string; id: string }>,
  userId: string,
  settings: { x: number; y: number; fontSize: number; fontColor: string }
): Promise<Array<{ clientId: string; imageUrl: string }>> {
  const results = [];

  for (const client of clients) {
    try {
      const imageBase64 = await personalizeImage({
        baseImagePath,
        text: client.name,
        ...settings,
      });

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const { url: imageUrl } = await uploadToFirebaseStorage(
        imageBuffer,
        userId,
        `${client.name.replace(/\s+/g, '_')}.jpg`
      );

      results.push({
        clientId: client.id,
        imageUrl,
      });
    } catch (error) {
      console.error(`Failed to generate image for client ${client.id}:`, error);
      results.push({
        clientId: client.id,
        imageUrl: '',
      });
    }
  }

  return results;
}
