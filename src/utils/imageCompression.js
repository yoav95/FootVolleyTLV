// Compress image and convert to base64
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with quality 0.7
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        // Check size
        const sizeInBytes = compressedBase64.length * 0.75;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 1) {
          reject(new Error(`התמונה עדיין גדולה מדי (${sizeInMB.toFixed(2)}MB). בחר תמונה קטנה יותר.`));
        } else {
          resolve(compressedBase64);
        }
      };
      
      img.onerror = () => {
        reject(new Error('שגיאה בטעינת התמונה'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('שגיאה בקריאת התמונה'));
    };
    
    reader.readAsDataURL(file);
  });
};
