import { db } from '../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// Create a new game
export const createGame = async (gameData, organizerId) => {
  try {
    const gamesRef = collection(db, 'games');
    const docRef = await addDoc(gamesRef, {
      ...gameData,
      organizerId: organizerId,
      players: [organizerId],
      currentPlayers: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...gameData };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all games
export const getAllGames = async () => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    const games = [];
    snapshot.forEach(doc => {
      games.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return games;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get game by ID
export const getGameById = async (gameId) => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    if (gameDoc.exists()) {
      return {
        id: gameDoc.id,
        ...gameDoc.data()
      };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Join a game
export const joinGame = async (gameId, userId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();
    const players = gameData.players || [];

    // Check if user already joined
    if (players.includes(userId)) {
      throw new Error('You already joined this game');
    }

    // Check if game is full
    if (players.length >= gameData.playersNeeded) {
      throw new Error('Game is full');
    }

    // Add user to players list
    players.push(userId);
    await updateDoc(gameRef, {
      players: players,
      currentPlayers: players.length,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Leave a game
export const leaveGame = async (gameId, userId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();
    const players = gameData.players || [];
    const updatedPlayers = players.filter(id => id !== userId);

    await updateDoc(gameRef, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update game
export const updateGame = async (gameId, gameData, organizerId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    // Only organizer can update
    if (gameSnap.data().organizerId !== organizerId) {
      throw new Error('Only the organizer can update the game');
    }

    await updateDoc(gameRef, {
      ...gameData,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete game
export const deleteGame = async (gameId, organizerId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    // Only organizer can delete
    if (gameSnap.data().organizerId !== organizerId) {
      throw new Error('Only the organizer can delete the game');
    }

    await deleteDoc(gameRef);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};
