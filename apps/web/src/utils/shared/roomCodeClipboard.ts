/**
 * Room Code Clipboard Utilities
 * Handles copying and pasting room codes with clipboard API
 */

/**
 * Copy room code to clipboard
 * @param code - The room code to copy
 * @param onCopied - Callback when copy succeeds
 */
export function copyRoomCodeToClipboard(code: string, onCopied?: () => void) {
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(trimmedCode).then(() => {
      onCopied?.();
    });
  }
}

/**
 * Paste room code from clipboard
 * @param onPasted - Callback with pasted room code
 */
export function pasteRoomCodeFromClipboard(onPasted: (code: string) => void) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard
      .readText()
      .then((t) => onPasted(t.trim().toUpperCase()))
      .catch(() => {});
  }
}
