
interface PhotoSheetSettings {
  photosPerRow: number;
  rows: number;
  applyBgColor: boolean;
  bgColor: string;
}

const PHOTO_WIDTH = 400;
const PHOTO_HEIGHT = 400;

export const createPhotoSheet = (
  base64Image: string,
  settings: PhotoSheetSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const singlePhotoCanvas = document.createElement('canvas');
    singlePhotoCanvas.width = PHOTO_WIDTH;
    singlePhotoCanvas.height = PHOTO_HEIGHT;
    const singleCtx = singlePhotoCanvas.getContext('2d');
    if (!singleCtx) return reject(new Error('Could not get canvas context'));

    const img = new Image();
    img.onload = () => {
      // Step 1: Create the single 400x400 photo
      if (settings.applyBgColor) {
        singleCtx.fillStyle = settings.bgColor;
        singleCtx.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
      }
      singleCtx.drawImage(img, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);

      // Step 2: Create the final sheet
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = PHOTO_WIDTH * settings.photosPerRow;
      sheetCanvas.height = PHOTO_HEIGHT * settings.rows;
      const sheetCtx = sheetCanvas.getContext('2d');
      if (!sheetCtx) return reject(new Error('Could not get sheet canvas context'));
      
      // Fill sheet with white background for printing
      sheetCtx.fillStyle = '#FFFFFF';
      sheetCtx.fillRect(0,0, sheetCanvas.width, sheetCanvas.height);

      // Step 3: Tile the single photo onto the sheet
      for (let row = 0; row < settings.rows; row++) {
        for (let col = 0; col < settings.photosPerRow; col++) {
          sheetCtx.drawImage(
            singlePhotoCanvas,
            col * PHOTO_WIDTH,
            row * PHOTO_HEIGHT
          );
        }
      }

      resolve(sheetCanvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => {
      reject(new Error('Failed to load processed image.'));
    };
    img.src = `data:image/png;base64,${base64Image}`;
  });
};