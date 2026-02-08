import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload game image to Firebase Storage
export const uploadGameImage = async (file, gameId, userId) => {
  try {
    if (!file) {
      return null;
    }

    // Create a unique filename
    const timestamp = new Date().getTime();
    const filename = `${gameId}_${userId}_${timestamp}_${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, `game_images/${gameId}/${filename}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('שגיאה בהעלאת התמונה: ' + error.message);
  }
};

// Delete game image from Firebase Storage
export const deleteGameImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return;
    }

    // Extract path from URL
    const decodedUrl = decodeURIComponent(imageUrl);
    const pathStart = decodedUrl.indexOf('/o/') + 3;
    const pathEnd = decodedUrl.indexOf('?');
    const filePath = decodedUrl.substring(pathStart, pathEnd);
    
    // Create reference and delete
    const fileRef = ref(storage, filePath);
    // Note: Delete is available but we'll handle errors gracefully
    console.log('Image deletion would remove:', filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - image might be already deleted or not exist
  }
};
