import { STORAGE_KEYS, isSkinId, type SkinId } from '@/types/skin';
import { DEFAULT_SKIN_ID } from '@/constants/skins';

export function getStoredSkin(): SkinId {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEYS.SKIN);
    if (isSkinId(stored)) return stored;
  } catch (error) {
    console.error('Error loading skin:', error);
  }
  return DEFAULT_SKIN_ID;
}

export function saveSkin(id: SkinId): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEYS.SKIN, id);
  } catch (error) {
    console.error('Error saving skin:', error);
  }
}
