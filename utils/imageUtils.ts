// Compress and resize image to base64 for storage
export function compressImage(file: File, maxWidth = 800, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compare two base64 images and return a similarity score (0-100)
export function compareImages(img1Src: string, img2Src: string): Promise<number> {
  return new Promise((resolve) => {
    const size = 32; // Compare at 32x32 resolution
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    canvas1.width = canvas2.width = size;
    canvas1.height = canvas2.height = size;
    const ctx1 = canvas1.getContext('2d')!;
    const ctx2 = canvas2.getContext('2d')!;

    let loaded = 0;
    const img1 = new Image();
    const img2 = new Image();

    const checkDone = () => {
      loaded++;
      if (loaded < 2) return;

      ctx1.drawImage(img1, 0, 0, size, size);
      ctx2.drawImage(img2, 0, 0, size, size);

      const data1 = ctx1.getImageData(0, 0, size, size).data;
      const data2 = ctx2.getImageData(0, 0, size, size).data;

      let totalDiff = 0;
      const pixels = size * size;

      for (let i = 0; i < data1.length; i += 4) {
        const r = Math.abs(data1[i] - data2[i]);
        const g = Math.abs(data1[i + 1] - data2[i + 1]);
        const b = Math.abs(data1[i + 2] - data2[i + 2]);
        totalDiff += (r + g + b) / (3 * 255);
      }

      const similarity = Math.round((1 - totalDiff / pixels) * 100);
      resolve(Math.max(0, Math.min(100, similarity)));
    };

    img1.onload = checkDone;
    img2.onload = checkDone;
    img1.onerror = () => resolve(0);
    img2.onerror = () => resolve(0);
    img1.src = img1Src;
    img2.src = img2Src;
  });
}
