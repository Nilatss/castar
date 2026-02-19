/**
 * Castar — Offline Speech Recognition (VOSK)
 *
 * Uses react-native-vosk for on-device speech recognition.
 * Models must be bundled or downloaded at runtime.
 *
 * Supported models:
 *   - vosk-model-small-uz (Uzbek)
 *   - vosk-model-small-ru (Russian)
 *   - vosk-model-small-en-us (English)
 *
 * Models are ~50MB each and loaded on first use per language.
 */

import * as Vosk from 'react-native-vosk';
import type { SupportedSttLanguage } from './cloudRecognition';

interface OfflineRecognitionResult {
  text: string;
  confidence: number;
  language: SupportedSttLanguage;
}

/**
 * VOSK model URLs (small models, ~40-50MB each).
 * These are official VOSK models hosted on alphacephei.com.
 */
const MODEL_URLS: Record<SupportedSttLanguage, string> = {
  'uz-UZ': 'https://alphacephei.com/vosk/models/vosk-model-small-uz-0.22.zip',
  'ru-RU': 'https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip',
  'en-US': 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
};

let currentModelLanguage: SupportedSttLanguage | null = null;
let isModelLoaded = false;
let subscriptions: import('react-native').EventSubscription[] = [];

/**
 * Load a VOSK model for the specified language.
 * Downloads the model on first use, then caches locally.
 *
 * @param language - BCP-47 language code (uz-UZ, ru-RU, en-US)
 * @returns true if model loaded successfully
 */
export async function loadModel(language: SupportedSttLanguage): Promise<boolean> {
  if (isModelLoaded && currentModelLanguage === language) {
    return true;
  }

  const modelUrl = MODEL_URLS[language];
  if (!modelUrl) return false;

  try {
    await Vosk.loadModel(modelUrl);
    currentModelLanguage = language;
    isModelLoaded = true;
    return true;
  } catch (error) {
    console.error(`[VOSK] Failed to load model for ${language}:`, error);
    isModelLoaded = false;
    currentModelLanguage = null;
    return false;
  }
}

/**
 * Start offline speech recognition.
 * The model must be loaded first via loadModel().
 *
 * @param language - BCP-47 language code
 * @param onResult - callback with partial/final recognition results
 * @param onError - callback for errors
 */
export async function startRecognition(
  language: SupportedSttLanguage,
  onResult: (result: OfflineRecognitionResult) => void,
  onError?: (error: Error) => void,
): Promise<void> {
  const loaded = await loadModel(language);
  if (!loaded) {
    onError?.(new Error(`Failed to load VOSK model for ${language}`));
    return;
  }

  try {
    // Clean up previous subscriptions
    removeSubscriptions();

    subscriptions.push(
      Vosk.onResult((res: string) => {
        try {
          const parsed = JSON.parse(res) as { text?: string };
          const text = parsed.text?.trim() ?? '';
          if (text) {
            onResult({
              text,
              confidence: 0.7, // VOSK small models — approximate confidence
              language,
            });
          }
        } catch {
          // Partial result or malformed JSON — ignore
        }
      }),
    );

    subscriptions.push(
      Vosk.onFinalResult((res: string) => {
        try {
          const parsed = JSON.parse(res) as { text?: string };
          const text = parsed.text?.trim() ?? '';
          if (text) {
            onResult({
              text,
              confidence: 0.8,
              language,
            });
          }
        } catch {
          // ignore
        }
      }),
    );

    subscriptions.push(
      Vosk.onError((error: any) => {
        const message = typeof error === 'string' ? error : String(error);
        onError?.(new Error(`VOSK error: ${message}`));
      }),
    );

    await Vosk.start();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

function removeSubscriptions(): void {
  for (const sub of subscriptions) {
    sub.remove();
  }
  subscriptions = [];
}

/**
 * Stop offline speech recognition.
 */
export function stopRecognition(): void {
  try {
    Vosk.stop();
  } catch {
    // Already stopped or not started
  }
  removeSubscriptions();
}

/**
 * Clean up VOSK resources.
 */
export function cleanup(): void {
  stopRecognition();
  try {
    Vosk.unload();
  } catch {
    // ignore
  }
  isModelLoaded = false;
  currentModelLanguage = null;
}

/**
 * Check if a model is currently loaded.
 */
export function isLoaded(): boolean {
  return isModelLoaded;
}

/**
 * Get the currently loaded model language.
 */
export function getLoadedLanguage(): SupportedSttLanguage | null {
  return currentModelLanguage;
}
