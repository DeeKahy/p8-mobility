  /**
   * Builds a data URI string from raw image data.
   * Why:
   * - Allows images to be used directly in React Native <Image /> without relying
   *   on a file path.
   */
export function toImageDataUri(
  base64: string,
  fileExtension: string
): string {
  const normalizedExtension = fileExtension.toLowerCase();
  const mimeType =
    normalizedExtension === "jpg" || normalizedExtension === "jpeg"
      ? "image/jpeg"
      : normalizedExtension === "svg"
        ? "image/svg+xml"
        : `image/${normalizedExtension}`;

  return `data:${mimeType};base64,${base64}`;
}
