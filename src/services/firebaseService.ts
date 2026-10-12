import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';
import { WheelPreset, WinnerRecord, WheelSettings } from '../types/wheel';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

// Auth functions
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Create or update user profile document
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(
        userRef,
        {
          uid: result.user.uid,
          displayName: result.user.displayName || '',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          updatedAt: Date.now(),
          createdAt: Date.now(),
        },
        { merge: true }
      );
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-in error:', error);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Preset Sync
export async function syncPresetToFirestore(userId: string, preset: WheelPreset): Promise<void> {
  const path = `users/${userId}/presets/${preset.id}`;
  try {
    const presetRef = doc(db, 'users', userId, 'presets', preset.id);
    await setDoc(presetRef, {
      id: preset.id,
      name: preset.name,
      description: preset.description || '',
      items: preset.items,
      createdAt: preset.createdAt,
      isDefault: preset.isDefault || false,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePresetFromFirestore(userId: string, presetId: string): Promise<void> {
  const path = `users/${userId}/presets/${presetId}`;
  try {
    const presetRef = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(presetRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchUserPresets(userId: string): Promise<WheelPreset[]> {
  const path = `users/${userId}/presets`;
  try {
    const presetsCol = collection(db, 'users', userId, 'presets');
    const snapshot = await getDocs(presetsCol);
    const results: WheelPreset[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: data.id,
        name: data.name,
        description: data.description,
        items: data.items,
        createdAt: data.createdAt,
        isDefault: data.isDefault,
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// History Sync
export async function saveWinnerToFirestore(userId: string, record: WinnerRecord): Promise<void> {
  const path = `users/${userId}/history/${record.id}`;
  try {
    const historyRef = doc(db, 'users', userId, 'history', record.id);
    await setDoc(historyRef, {
      id: record.id,
      round: record.round,
      timestamp: record.timestamp,
      item: record.item,
      presetName: record.presetName,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserHistory(userId: string): Promise<WinnerRecord[]> {
  const path = `users/${userId}/history`;
  try {
    const historyCol = collection(db, 'users', userId, 'history');
    const snapshot = await getDocs(historyCol);
    const results: WinnerRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: data.id,
        round: data.round,
        timestamp: data.timestamp,
        item: data.item,
        presetName: data.presetName,
      });
    });
    // Sort descending by timestamp
    return results.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function clearUserHistoryInFirestore(userId: string): Promise<void> {
  const path = `users/${userId}/history`;
  try {
    const historyCol = collection(db, 'users', userId, 'history');
    const snapshot = await getDocs(historyCol);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Settings Sync
export async function saveSettingsToFirestore(userId: string, settings: WheelSettings): Promise<void> {
  const path = `users/${userId}/settings/current`;
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'current');
    await setDoc(
      settingsRef,
      {
        spinDuration: settings.spinDuration,
        autoRemoveWinner: settings.autoRemoveWinner,
        soundEnabled: settings.soundEnabled,
        soundVolume: settings.soundVolume,
        confettiEnabled: settings.confettiEnabled,
        showWinnerModal: settings.showWinnerModal,
        wheelTheme: settings.wheelTheme,
        vibrationEnabled: settings.vibrationEnabled ?? true,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserSettings(userId: string): Promise<WheelSettings | null> {
  const path = `users/${userId}/settings/current`;
  try {
    const settingsCol = collection(db, 'users', userId, 'settings');
    const snapshot = await getDocs(settingsCol);
    let result: WheelSettings | null = null;
    snapshot.forEach((docSnap) => {
      if (docSnap.id === 'current') {
        const d = docSnap.data();
        result = {
          spinDuration: d.spinDuration,
          autoRemoveWinner: d.autoRemoveWinner,
          soundEnabled: d.soundEnabled,
          soundVolume: d.soundVolume,
          confettiEnabled: d.confettiEnabled,
          showWinnerModal: d.showWinnerModal,
          wheelTheme: d.wheelTheme,
          vibrationEnabled: d.vibrationEnabled,
        };
      }
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
