import { readFile } from 'node:fs/promises';
import path from 'node:path';
import UPNG from 'upng-js';

import { isDecodedImageBlurry, varianceOfLaplacian } from './blurDetection';

// Helper function for the test
// Converts a Node.js Buffer into a standard ArrayBuffer.
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}
// Loads a PNG image from disk and converts it into raw RGBA pixel data in javascript friend format.
async function loadPng(fileName: string) {
  const filePath = path.resolve(__dirname, fileName);
  const fileBuffer = await readFile(filePath);

  const decoded = UPNG.decode(toArrayBuffer(fileBuffer));
  const rgba = UPNG.toRGBA8(decoded)[0];

  return {
    data: new Uint8Array(rgba),
    width: decoded.width,
    height: decoded.height,
  };
}

describe('blurDetection', () => {
  it('gives lower score for blured.png than for not_blured.png', async () => {
    const blurred = await loadPng('../assets/test-images/blured.png');
    const sharp = await loadPng('../assets/test-images/not_blured.png');

    const blurredScore = varianceOfLaplacian(
      blurred.data,
      blurred.width,
      blurred.height
    );

    const sharpScore = varianceOfLaplacian(
      sharp.data,
      sharp.width,
      sharp.height
    );

    expect(blurredScore).toBeLessThan(sharpScore);
  });

  it('clasifies blured.png as blurry with default threshold', async () => {
    const blurred = await loadPng('../assets/test-images/blured.png');

    expect(
      isDecodedImageBlurry(blurred.data, blurred.width, blurred.height)
    ).toBe(true);
  });

  it('clasifies not_blured.png as not blurry with default threshold', async () => {
    const sharp = await loadPng('../assets/test-images/not_blured.png');
    console.log('Trying to ge score for not blured:');
    expect(isDecodedImageBlurry(sharp.data, sharp.width, sharp.height)).toBe(
      false
    );
  });
});
