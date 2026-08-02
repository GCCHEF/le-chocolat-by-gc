declare module 'three' {
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): this;
    lerp(vector: Vector2, alpha: number): this;
  }

  export class Scene {
    add(object: unknown): this;
  }

  export class OrthographicCamera {
    constructor(
      left: number,
      right: number,
      top: number,
      bottom: number,
      near: number,
      far: number,
    );
  }

  export class PerspectiveCamera {
    constructor(fov: number, aspect: number, near: number, far: number);
    aspect: number;
    position: {x: number; y: number; z: number; set(x: number, y: number, z: number): void};
    lookAt(x: number, y: number, z: number): void;
    updateProjectionMatrix(): void;
  }

  export class WebGLRenderer {
    constructor(parameters?: {
      alpha?: boolean;
      antialias?: boolean;
      powerPreference?: WebGLPowerPreference;
    });
    domElement: HTMLCanvasElement;
    dispose(): void;
    render(scene: Scene, camera: OrthographicCamera | PerspectiveCamera): void;
    setClearColor(color: number, alpha?: number): void;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class ShaderMaterial {
    constructor(parameters: {
      blending?: number;
      depthWrite?: boolean;
      side?: number;
      transparent?: boolean;
      uniforms: Record<string, {value: any}>;
      vertexShader: string;
      fragmentShader: string;
    });
    uniforms: Record<string, {value: any}>;
    dispose(): void;
  }

  export class PlaneGeometry {
    constructor(
      width: number,
      height: number,
      widthSegments?: number,
      heightSegments?: number,
    );
    attributes: {position: BufferAttribute};
    computeVertexNormals(): void;
    dispose(): void;
    rotateX(angle: number): this;
    setAttribute(name: string, attribute: BufferAttribute): this;
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
    count: number;
    needsUpdate: boolean;
    getX(index: number): number;
    getZ(index: number): number;
    setY(index: number, value: number): this;
  }

  export class Mesh {
    constructor(geometry: PlaneGeometry, material: ShaderMaterial);
    position: {x: number; y: number; z: number};
    rotation: {x: number; y: number; z: number};
  }

  export class Clock {
    getElapsedTime(): number;
  }

  export class Texture {
    dispose(): void;
  }

  export class TextureLoader {
    load(url: string): Texture;
  }

  export const AdditiveBlending: number;
  export const DoubleSide: number;

  export const MathUtils: {
    lerp(start: number, end: number, alpha: number): number;
  };
}
