import {useEffect, useRef, type CSSProperties} from 'react';

type ColorMode = 'mono' | 'image';
type Fit = 'cover' | 'contain';
type RevealOptions = {size: number; softness: number};

interface AsciiImageProps {
  image: {src: string; alt?: string} | string;
  fit?: Fit;
  focusY?: number;
  columns?: number;
  ramp?: string;
  invert?: boolean;
  contrast?: number;
  colorMode?: ColorMode;
  inkColor?: string;
  reveal?: boolean;
  revealOptions?: RevealOptions;
  style?: CSSProperties;
}

const DEFAULTS = {
  fit: 'cover' as Fit,
  focusY: 19,
  columns: 200,
  ramp: ' .:-=+*#%@',
  invert: false,
  contrast: 100,
  colorMode: 'mono' as ColorMode,
  inkColor: '#ffffff',
  reveal: true,
  revealOptions: {size: 80, softness: 16},
};

const contrastAt = (value: number) => 0.5 + (value / 100) * 2;

function placeRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
  fit: Fit,
  focusY: number,
) {
  const scale =
    fit === 'contain'
      ? Math.min(boxWidth / imageWidth, boxHeight / imageHeight)
      : Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const focus =
    fit === 'cover' ? Math.min(100, Math.max(0, focusY)) / 100 : 0.5;
  return {
    dx: (boxWidth - width) / 2,
    dy: (boxHeight - height) * focus,
    dw: width,
    dh: height,
  };
}

export default function AsciiImage({
  image,
  fit = DEFAULTS.fit,
  focusY = DEFAULTS.focusY,
  columns = DEFAULTS.columns,
  ramp = DEFAULTS.ramp,
  invert = DEFAULTS.invert,
  contrast = DEFAULTS.contrast,
  colorMode = DEFAULTS.colorMode,
  inkColor = DEFAULTS.inkColor,
  reveal = DEFAULTS.reveal,
  revealOptions = DEFAULTS.revealOptions,
  style,
}: AsciiImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const asciiRef = useRef<HTMLCanvasElement | null>(null);
  const samplerRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const blobsRef = useRef<Array<{x: number; y: number}>>([]);
  const seededRef = useRef(false);
  const pointerRef = useRef({x: -9999, y: -9999, inside: false});
  const source = typeof image === 'string' ? image : image.src;
  const revealSize = revealOptions.size;
  const revealSoftness = revealOptions.softness;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const characters = ramp || DEFAULTS.ramp;
    const punch = contrastAt(contrast);
    let animationFrame = 0;
    let isAlive = true;
    let imageRect = {dx: 0, dy: 0, dw: 0, dh: 0};
    blobsRef.current = Array.from({length: 5}, () => ({x: 0, y: 0}));

    const getSize = () => ({
      width: canvas.clientWidth || 600,
      height: canvas.clientHeight || 600,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    });

    const buildAscii = () => {
      const loadedImage = imageRef.current;
      if (!loadedImage) return;
      const {width, height, pixelRatio} = getSize();
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      const columnCount = Math.max(8, Math.round(columns));
      const cellWidth = canvas.width / columnCount;
      const fontSize = cellWidth * 1.7;
      const rowCount = Math.max(1, Math.floor(canvas.height / fontSize));
      const sampler = samplerRef.current ?? document.createElement('canvas');
      samplerRef.current = sampler;
      sampler.width = columnCount;
      sampler.height = rowCount;
      const samplerContext = sampler.getContext('2d', {
        willReadFrequently: true,
      });
      if (!samplerContext) return;

      imageRect = placeRect(
        loadedImage.width,
        loadedImage.height,
        canvas.width,
        canvas.height,
        fit,
        focusY,
      );
      samplerContext.clearRect(0, 0, columnCount, rowCount);
      samplerContext.drawImage(
        loadedImage,
        imageRect.dx / cellWidth,
        imageRect.dy / fontSize,
        imageRect.dw / cellWidth,
        imageRect.dh / fontSize,
      );
      const pixels = samplerContext.getImageData(
        0,
        0,
        columnCount,
        rowCount,
      ).data;
      const ascii = asciiRef.current ?? document.createElement('canvas');
      asciiRef.current = ascii;
      ascii.width = canvas.width;
      ascii.height = canvas.height;
      const asciiContext = ascii.getContext('2d');
      if (!asciiContext) return;
      asciiContext.clearRect(0, 0, ascii.width, ascii.height);
      asciiContext.font = `${fontSize.toFixed(2)}px ui-monospace, monospace`;
      asciiContext.textBaseline = 'top';

      for (let row = 0; row < rowCount; row += 1) {
        for (let column = 0; column < columnCount; column += 1) {
          const index = (row * columnCount + column) * 4;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          luminance = Math.max(
            0,
            Math.min(1, (luminance - 0.5) * punch + 0.5),
          );
          if (invert) luminance = 1 - luminance;
          const character =
            characters[Math.round(luminance * (characters.length - 1))];
          if (character === ' ') continue;
          asciiContext.fillStyle =
            colorMode === 'image'
              ? `rgb(${Math.min(255, red + 30)}, ${Math.min(
                  255,
                  green + 30,
                )}, ${Math.min(255, blue + 30)})`
              : inkColor;
          asciiContext.fillText(
            character,
            column * cellWidth,
            row * fontSize,
          );
        }
      }
    };

    const ensureLayer = (reference: {current: HTMLCanvasElement | null}) => {
      const layer = reference.current ?? document.createElement('canvas');
      reference.current = layer;
      if (layer.width !== canvas.width || layer.height !== canvas.height) {
        layer.width = canvas.width;
        layer.height = canvas.height;
      }
      return layer;
    };

    const updateBlobs = () => {
      const {pixelRatio} = getSize();
      const targetX = pointerRef.current.x * pixelRatio;
      const targetY = pointerRef.current.y * pixelRatio;
      if (!seededRef.current) {
        blobsRef.current.forEach((blob) => {
          blob.x = targetX;
          blob.y = targetY;
        });
        seededRef.current = true;
        return;
      }
      blobsRef.current[0].x +=
        (targetX - blobsRef.current[0].x) * 0.35;
      blobsRef.current[0].y +=
        (targetY - blobsRef.current[0].y) * 0.35;
      for (let index = 1; index < blobsRef.current.length; index += 1) {
        blobsRef.current[index].x +=
          (blobsRef.current[index - 1].x - blobsRef.current[index].x) * 0.35;
        blobsRef.current[index].y +=
          (blobsRef.current[index - 1].y - blobsRef.current[index].y) * 0.35;
      }
    };

    const paint = () => {
      const ascii = asciiRef.current;
      if (!ascii) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(ascii, 0, 0);
      const loadedImage = imageRef.current;
      if (!reveal || !pointerRef.current.inside || !loadedImage) return;
      const {pixelRatio} = getSize();
      const photo = ensureLayer(photoRef);
      const photoContext = photo.getContext('2d');
      const mask = ensureLayer(maskRef);
      const maskContext = mask.getContext('2d');
      if (!photoContext || !maskContext) return;
      photoContext.globalCompositeOperation = 'source-over';
      photoContext.clearRect(0, 0, photo.width, photo.height);
      photoContext.drawImage(
        loadedImage,
        imageRect.dx,
        imageRect.dy,
        imageRect.dw,
        imageRect.dh,
      );
      maskContext.clearRect(0, 0, mask.width, mask.height);
      maskContext.save();
      maskContext.filter = `blur(${(revealSoftness * pixelRatio).toFixed(1)}px)`;
      maskContext.fillStyle = '#ffffff';
      blobsRef.current.forEach((blob, index, blobs) => {
        const progress = index / Math.max(1, blobs.length - 1);
        const radius = revealSize * pixelRatio * (1 - progress * 0.5);
        maskContext.beginPath();
        maskContext.arc(blob.x, blob.y, radius, 0, Math.PI * 2);
        maskContext.fill();
      });
      maskContext.restore();
      photoContext.globalCompositeOperation = 'destination-in';
      photoContext.drawImage(mask, 0, 0);
      photoContext.globalCompositeOperation = 'source-over';
      context.drawImage(photo, 0, 0);
    };

    const loop = () => {
      if (!isAlive) return;
      updateBlobs();
      paint();
      animationFrame = window.requestAnimationFrame(loop);
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointerRef.current = {
        x,
        y,
        inside: x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.inside = false;
      seededRef.current = false;
    };

    const loadedImage = new Image();
    loadedImage.onload = () => {
      if (!isAlive) return;
      imageRef.current = loadedImage;
      buildAscii();
      paint();
      if (reveal) animationFrame = window.requestAnimationFrame(loop);
    };
    loadedImage.src = source;
    const resizeObserver = new ResizeObserver(() => {
      buildAscii();
      paint();
    });
    resizeObserver.observe(canvas);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      isAlive = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [
    colorMode,
    columns,
    contrast,
    fit,
    focusY,
    inkColor,
    invert,
    ramp,
    reveal,
    revealSize,
    revealSoftness,
    source,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={typeof image === 'string' ? 'ASCII art' : image.alt}
      className="ascii-image"
      style={style}
    />
  );
}
