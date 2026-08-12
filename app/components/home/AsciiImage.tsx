import {useEffect, useRef, type CSSProperties} from 'react';
import {useAndroidDevice} from '~/lib/use-android-device';

type ColorMode = 'mono' | 'image';
type Fit = 'cover' | 'contain';
type RevealOptions = {size: number; softness: number};

interface AsciiImageProps {
  annotationOverlay?: boolean;
  image: {src: string; androidSrc?: string; alt?: string} | string;
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
  annotationOverlay = false,
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
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const samplerRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const blobsRef = useRef<Array<{x: number; y: number}>>([]);
  const seededRef = useRef(false);
  const pointerRef = useRef({x: -9999, y: -9999, inside: false});
  const isAndroid = useAndroidDevice();
  const source =
    typeof image === 'string'
      ? image
      : isAndroid && image.androidSrc
        ? image.androidSrc
        : image.src;
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
    let isPointerPressed = false;
    let activePointerId: number | null = null;
    let holdTimer = 0;
    let pressOrigin = {x: 0, y: 0};
    const requiresPress = window.matchMedia('(pointer: coarse)').matches;
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
      const source = sourceRef.current ?? document.createElement('canvas');
      sourceRef.current = source;
      source.width = canvas.width;
      source.height = canvas.height;
      const sourceContext = source.getContext('2d');
      if (!sourceContext) return;
      sourceContext.clearRect(0, 0, source.width, source.height);
      sourceContext.drawImage(
        loadedImage,
        imageRect.dx,
        imageRect.dy,
        imageRect.dw,
        imageRect.dh,
      );
      if (annotationOverlay) {
        const description = document.querySelector<HTMLElement>(
          '.featured-work-detail__description',
        );
        const typography = description
          ? window.getComputedStyle(description)
          : window.getComputedStyle(canvas);
        const renderedFontSize =
          (Number.parseFloat(typography.fontSize) || 16) * pixelRatio;
        const sourceScale = imageRect.dw / loadedImage.width;
        const point = (x: number, y: number) => ({
          x: imageRect.dx + x * sourceScale,
          y: imageRect.dy + y * sourceScale,
        });
        const line = (fromX: number, fromY: number, toX: number, toY: number) => {
          const from = point(fromX, fromY);
          const to = point(toX, toY);
          sourceContext.beginPath();
          sourceContext.moveTo(from.x, from.y);
          sourceContext.lineTo(to.x, to.y);
          sourceContext.stroke();
        };
        const label = (text: string, x: number, y: number) => {
          const position = point(x, y);
          sourceContext.fillText(text, position.x, position.y);
        };
        const compoundLabel = (
          prefix: string,
          suffix: string,
          x: number,
          y: number,
        ) => {
          const position = point(x, y);
          sourceContext.font = `700 ${renderedFontSize}px ${typography.fontFamily}`;
          sourceContext.fillText(prefix, position.x, position.y);
          const prefixWidth = sourceContext.measureText(prefix).width;
          sourceContext.font = `${typography.fontWeight} ${renderedFontSize}px ${typography.fontFamily}`;
          sourceContext.fillText(
            suffix,
            position.x + prefixWidth,
            position.y,
          );
        };

        sourceContext.save();
        sourceContext.fillStyle = '#ffffff';
        sourceContext.font = `${typography.fontWeight} ${renderedFontSize}px ${typography.fontFamily}`;
        sourceContext.globalAlpha = Number.parseFloat(typography.opacity) || 0.74;
        sourceContext.textBaseline = 'top';
        label('Guanaja 70%', 400, 195);
        compoundLabel('CU', '(bes)', 158, 470);
        label('Cassis and', 905, 416);
        label('Poivre de Cassis', 860, 448);
        compoundLabel('PRA', '(liné)', 875, 960);
        label('Parmesan', 875, 993);
        sourceContext.globalAlpha = 1;
        sourceContext.lineCap = 'round';
        sourceContext.lineWidth = Math.max(1, sourceScale * 2);
        sourceContext.strokeStyle = '#ffffff';
        line(470, 260, 490, 430);
        line(255, 520, 370, 665);
        line(910, 498, 600, 723);
        line(830, 990, 745, 990);
        sourceContext.restore();
      }
      let asciiSource = source;
      if (annotationOverlay) {
        const samplingSource = document.createElement('canvas');
        samplingSource.width = source.width;
        samplingSource.height = source.height;
        const samplingContext = samplingSource.getContext('2d');
        if (samplingContext) {
          samplingContext.drawImage(source, 0, 0);
          const sourceScale = imageRect.dw / loadedImage.width;
          samplingContext.beginPath();
          samplingContext.moveTo(
            imageRect.dx + 830 * sourceScale,
            imageRect.dy + 990 * sourceScale,
          );
          samplingContext.lineTo(
            imageRect.dx + 745 * sourceScale,
            imageRect.dy + 990 * sourceScale,
          );
          samplingContext.lineCap = 'round';
          samplingContext.lineWidth = Math.max(6, sourceScale * 8);
          samplingContext.strokeStyle = '#ffffff';
          samplingContext.stroke();
          asciiSource = samplingSource;
        }
      }
      samplerContext.clearRect(0, 0, columnCount, rowCount);
      samplerContext.drawImage(
        asciiSource,
        0,
        0,
        source.width,
        source.height,
        0,
        0,
        columnCount,
        rowCount,
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
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.42) continue;
          let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          luminance = Math.max(
            0,
            Math.min(1, (luminance - 0.5) * punch + 0.5),
          );
          if (invert) luminance = 1 - luminance;
          const character =
            characters[Math.round(luminance * (characters.length - 1))];
          if (character === ' ') continue;
          asciiContext.globalAlpha = alpha;
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
      asciiContext.globalAlpha = 1;
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
      const source = sourceRef.current;
      if (!reveal || !pointerRef.current.inside || !loadedImage || !source) return;
      const {pixelRatio} = getSize();
      const photo = ensureLayer(photoRef);
      const photoContext = photo.getContext('2d');
      const mask = ensureLayer(maskRef);
      const maskContext = mask.getContext('2d');
      if (!photoContext || !maskContext) return;
      photoContext.globalCompositeOperation = 'source-over';
      photoContext.clearRect(0, 0, photo.width, photo.height);
      photoContext.drawImage(source, 0, 0);
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
      context.save();
      context.globalCompositeOperation = 'destination-out';
      context.drawImage(mask, 0, 0);
      context.restore();
      context.drawImage(photo, 0, 0);
    };

    const loop = () => {
      if (!isAlive) return;
      updateBlobs();
      paint();
      animationFrame = window.requestAnimationFrame(loop);
    };
    const updatePointer = (event: globalThis.PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      pointerRef.current = {
        x,
        y,
        inside: x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height,
      };
    };
    const onPointerDown = (event: globalThis.PointerEvent) => {
      activePointerId = event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
      pressOrigin = {x: event.clientX, y: event.clientY};
      if (!requiresPress) {
        isPointerPressed = true;
        updatePointer(event);
        return;
      }
      canvas.dataset.revealPending = 'true';
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        isPointerPressed = true;
        delete canvas.dataset.revealPending;
        canvas.dataset.revealActive = 'true';
        updatePointer(event);
      }, 140);
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      if (requiresPress && !isPointerPressed) {
        if (
          Math.hypot(
            event.clientX - pressOrigin.x,
            event.clientY - pressOrigin.y,
          ) > 14
        ) {
          window.clearTimeout(holdTimer);
          delete canvas.dataset.revealPending;
        }
        pointerRef.current.inside = false;
        return;
      }
      updatePointer(event);
    };
    const endPointerPress = () => {
      window.clearTimeout(holdTimer);
      isPointerPressed = false;
      delete canvas.dataset.revealPending;
      delete canvas.dataset.revealActive;
      if (
        activePointerId !== null &&
        canvas.hasPointerCapture?.(activePointerId)
      ) {
        canvas.releasePointerCapture(activePointerId);
      }
      activePointerId = null;
      if (!requiresPress) return;
      pointerRef.current.inside = false;
      seededRef.current = false;
    };
    const onPointerLeave = () => {
      pointerRef.current.inside = false;
      seededRef.current = false;
    };
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
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
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointerup', endPointerPress);
    window.addEventListener('pointercancel', endPointerPress);

    return () => {
      isAlive = false;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(holdTimer);
      delete canvas.dataset.revealPending;
      delete canvas.dataset.revealActive;
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointerup', endPointerPress);
      window.removeEventListener('pointercancel', endPointerPress);
    };
  }, [
    colorMode,
    columns,
    contrast,
    annotationOverlay,
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
