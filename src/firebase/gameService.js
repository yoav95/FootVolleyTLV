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

// Check if user already has an active game
export const getUserActiveGame = async (organizerId) => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef,
      where('organizerId', '==', organizerId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const game = snapshot.docs[0];
      return {
        id: game.id,
        ...game.data()
      };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Create a new game
export const createGame = async (gameData, organizerId) => {
  try {
    // Check if user already has an active game
    const existingGame = await getUserActiveGame(organizerId);
    if (existingGame) {
      throw new Error('אתה כבר יצרת משחק. מחק אותו כדי ליצור משחק חדש.');
    }

    // Check if organizer has phone number
    const organizerDoc = await getDoc(doc(db, 'users', organizerId));
    if (!organizerDoc.exists() || !organizerDoc.data()?.phone) {
      throw new Error('עליך להוסיף מספר טלפון לפני יצירת משחק. עדכן את הפרופיל שלך.');
    }

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

// Get all pending join requests for organizer's games
export const getOrganizerPendingRequests = async (organizerId) => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef,
      where('organizerId', '==', organizerId)
    );
    const snapshot = await getDocs(q);
    
    const allRequests = [];
    snapshot.forEach(doc => {
      const gameData = doc.data();
      if (gameData.pendingRequests && gameData.pendingRequests.length > 0) {
        gameData.pendingRequests.forEach(userId => {
          allRequests.push({
            gameId: doc.id,
            userId: userId,
            gameName: `משחק ב-${gameData.date} ב-${gameData.time}`,
            date: gameData.date,
            time: gameData.time,
            coordinates: gameData.coordinates
          });
        });
      }
    });
    return allRequests;
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

// Request to join a game (adds to pending requests)
export const requestToJoinGame = async (gameId, userId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();
    const players = gameData.players || [];
    const pendingRequests = gameData.pendingRequests || [];

    // Check if user already joined
    if (players.includes(userId)) {
      throw new Error('You already joined this game');
    }

    // Check if already requested
    if (pendingRequests.includes(userId)) {
      throw new Error('You already requested to join');
    }

    // Check if game is full
    if (players.length >= gameData.playersNeeded) {
      throw new Error('Game is full');
    }

    // Add user to pending requests
    pendingRequests.push(userId);
    await updateDoc(gameRef, {
      pendingRequests: pendingRequests,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Approve a join request
export const approveJoinRequest = async (gameId, userId, organizerId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();

    // Only organizer can approve
    if (gameData.organizerId !== organizerId) {
      throw new Error('Only the organizer can approve requests');
    }

    const players = gameData.players || [];
    const pendingRequests = gameData.pendingRequests || [];

    // Check if game is full
    if (players.length >= gameData.playersNeeded) {
      throw new Error('Game is full');
    }

    // Remove from pending and add to players
    const updatedPending = pendingRequests.filter(id => id !== userId);
    if (!players.includes(userId)) {
      players.push(userId);
    }

    await updateDoc(gameRef, {
      players: players,
      pendingRequests: updatedPending,
      currentPlayers: players.length,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Reject a join request
export const rejectJoinRequest = async (gameId, userId, organizerId) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }

    const gameData = gameSnap.data();

    // Only organizer can reject
    if (gameData.organizerId !== organizerId) {
      throw new Error('Only the organizer can reject requests');
    }

    const pendingRequests = gameData.pendingRequests || [];
    const updatedPending = pendingRequests.filter(id => id !== userId);

    await updateDoc(gameRef, {
      pendingRequests: updatedPending,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};
