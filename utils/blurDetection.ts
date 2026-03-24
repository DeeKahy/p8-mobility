import { Buffer } from 'buffer';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import UPNG from 'upng-js';

/**
 * Checks whether an image is blurry.
 *
 * This function loads the image from a URI, calculates a blur score
 * using the variance of the Laplacian algorithm, and compares it
 * to a threshold.
 *
 * @param uri - Local image URI (for example from Expo ImagePicker or Camera) (The path to where you have saved the picture)
 * @returns Promise resolving to `true` if the image is considered blurry
 *
 * @example
 * const blurry = await isImageBlurry(imageUri);
 *
 * if (blurry) {
 *   console.log("Image is blurry");
 * } else {
 *   console.log("Image is sharp");
 * }
 */
// I chose this number based on testing on a few images. The higer the value the less blury the picture is.
// The blurry picture i took was 16, and the "sharp" was 116. I dont have a good camera, so i think this value fits. (ish)
const IMAGE_BLUR_THRESHOLD = 100;

// All of the following is async, as the image manipulating tools we use are async.
/**
 * @param uri
 * @returns True if is blurry else false
 */
export async function isImageBlurry(uri: string): Promise<boolean> {
  const score = await getBlurScore(uri);
  return score < IMAGE_BLUR_THRESHOLD;
}

export async function getBlurScore(uri: string): Promise<number> {
  const { data, width, height } = await decodeImageToRgba(uri);
  return varianceOfLaplacian(data, width, height);
}

/**
 * The blur detection algorithm works directly on pixel values.
 * However, images we get from Expo (camera, image picker, file system)
 * are encoded files such as JPEG or PNG.
 *
 * Encoded formats cannot be processed pixel-by-pixel until they are
 * decoded into raw image data.
 *
 * This function converts the image file into an RGBA pixel buffer
 * that the blur detection algorithm can analyze.
 * @returns RGBA pixel buffer and image dimensions
 */
async function decodeImageToRgba(
  uri: string
): Promise<{ data: Uint8Array; width: number; height: number }> {
  const context = ImageManipulator.manipulate(uri);
  const imageRef = await context.renderAsync();

  const result = await imageRef.saveAsync({
    format: SaveFormat.PNG,
    base64: true,
    compress: 1,
  });

  if (!result.base64) {
    throw new Error(`Could not decode image: ${uri}`);
  }

  const pngBytes = Buffer.from(result.base64, 'base64');

  const arrayBuffer = pngBytes.buffer.slice(
    pngBytes.byteOffset,
    pngBytes.byteOffset + pngBytes.byteLength
  ) as ArrayBuffer;

  const decoded = UPNG.decode(arrayBuffer);
  const rgba = UPNG.toRGBA8(decoded)[0];

  return {
    data: new Uint8Array(rgba),
    width: decoded.width,
    height: decoded.height,
  };
}

/**
 * Checks whether already-decoded image data is blurry.
 *
 * Use this if you already have RGBA pixel data and want to avoid
 * decoding the image again.
 *
 * @param data - RGBA pixel buffer
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param threshold - Blur threshold (default: 100)
 *
 * @returns `true` if the image is considered blurry
 *
 * @example
 * const blurry = isDecodedImageBlurry(data, width, height, 120);
 */
export function isDecodedImageBlurry(
  data: Uint8Array,
  width: number,
  height: number,
  threshold = 100
): boolean {
  return varianceOfLaplacian(data, width, height) < threshold;
}

/**
 * Calculates the variance of the Laplacian for an image.
 *
 * This is a common blur detection algorithm used in computer vision.
 * Sharp images contain many strong edges (sudden brightness changes).
 * Blurry images contain mostly smooth transitions (small brightness changes).
 *
 * @param data - RGBA pixel buffer
 * @param width - Image width
 * @param height - Image height
 *
 * @returns Numeric sharpness score
 *
 * @example
 * const score = varianceOfLaplacian(data, width, height);
 */
export function varianceOfLaplacian(
  data: Uint8Array,
  width: number,
  height: number
): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      // For each pixel we compare it to its four neighbours:
      // The data is an flat array of all pixels. And one pixel has 4 values: red green blue and opacity hence why we do +4
      const center = luminanceAt(data, i);
      const left = luminanceAt(data, i - 4);
      const right = luminanceAt(data, i + 4);
      const up = luminanceAt(data, i - width * 4);
      const down = luminanceAt(data, i + width * 4);

      // If the center pixel is very different from its neighbors the result becomes large.
      const lap = 4 * center - left - right - up - down;
      // Values to calculate variance
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  return variance;
}

/**
 * Calculates the luminance (perceived brightness) of a pixel.
 * We need this calculated value as pesived brightness change in pixel can be seen as blurry
 *
 * Uses the standard Rec. 601 luma formula:
 * https://www.imatest.com/docs/luminance/
 *
 * Y = 0.299R + 0.587G + 0.114B
 *
 * @param data - RGBA pixel buffer
 * @param index - Index of the pixel's red channel
 *
 * @returns Luminance value
 */
function luminanceAt(data: Uint8Array, index: number): number {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];

  return 0.299 * r + 0.587 * g + 0.114 * b;
}
