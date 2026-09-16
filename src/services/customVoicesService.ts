import { VoiceOption, VIETNAMESE_VOICES } from '../types/video';

const STORAGE_KEY = 'remotion_custom_piper_voices';

export function getSavedCustomVoices(): VoiceOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load custom voices from localStorage:', err);
    return [];
  }
}

export function saveCustomVoice(voice: VoiceOption): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedCustomVoices().filter(v => v.id !== voice.id);
    existing.unshift(voice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save custom voice to localStorage:', err);
  }
}

export function deleteCustomVoice(voiceId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedCustomVoices().filter(v => v.id !== voiceId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to delete custom voice:', err);
  }
}

export function getAllMergedVoices(): VoiceOption[] {
  const custom = getSavedCustomVoices();
  return [...custom, ...VIETNAMESE_VOICES];
}
