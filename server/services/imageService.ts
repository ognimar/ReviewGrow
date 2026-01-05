import sharp from 'sharp';
import { getStorage } from '../firebase';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

export async function uploadToFirebaseStorage(
  imageBuffer: Buffer,
  userId: string,
  fileName: string
): Promise<string> {
  const storage = getStorage();
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  const bucket = storage.bucket();
  const uniqueFileName = `${userId}/${uuidv4()}-${fileName}`;
  const file = bucket.file(uniqueFileName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
    public: true,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
  return publicUrl;
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
      const imageUrl = await uploadToFirebaseStorage(
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
