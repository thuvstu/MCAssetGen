const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

export function isSupportedImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name);
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    image.src = url;
  });
}

export function downloadCanvas(canvas: HTMLCanvasElement, fileName: string, onError: () => void) {
  canvas.toBlob((blob) => {
    if (!blob) {
      onError();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }, "image/png");
}