import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
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
import { WheelPreset, WinnerRecord, WheelSettings, RoomState, WheelItem } from '../types/wheel';
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

// =========================================================================
// Real-Time Room State Sync across All Screens (sala1, sala2, sala3)
// =========================================================================

/**
 * Subscribe in real-time to a room document in Firestore.
 * Automatically triggers callback whenever any screen updates items, settings, spin state, etc.
 */
export function subscribeToRoom(
  roomId: string,
  onUpdate: (state: RoomState | null) => void,
  onError?: (error: unknown) => void
) {
  const path = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as RoomState;
        onUpdate(data);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error(`Error subscribing to room ${roomId}:`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Initialize room document if it doesn't already exist.
 */
export async function ensureRoomInitialized(
  roomId: string,
  defaultRoomData: RoomState
): Promise<RoomState> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      return snap.data() as RoomState;
    }

    // Create room with default state
    await setDoc(roomRef, {
      ...defaultRoomData,
      updatedAt: Date.now(),
    });
    return defaultRoomData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Broadcast full or partial room state update to all screens.
 */
export async function updateRoomState(
  roomId: string,
  partialState: Partial<RoomState>
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(
      roomRef,
      {
        ...partialState,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Broadcast spin initiation to all connected screens in real-time.
 */
export async function broadcastRoomSpin(
  roomId: string,
  targetWinnerId: string,
  updatedBy: string
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(
      roomRef,
      {
        isSpinning: true,
        spinTrigger: Date.now(),
        targetWinnerId,
        updatedAt: Date.now(),
        updatedBy,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Broadcast winner announcement and update items/history to all connected screens.
 */
export async function broadcastRoomWinner(
  roomId: string,
  winner: WinnerRecord,
  remainingItems: WheelItem[],
  newHistory: WinnerRecord[],
  updatedBy: string
): Promise<void> {
  const path = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(
      roomRef,
      {
        isSpinning: false,
        currentWinner: winner,
        items: remainingItems,
        history: newHistory,
        updatedAt: Date.now(),
        updatedBy,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

