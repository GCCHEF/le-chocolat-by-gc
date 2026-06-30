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

  export class WebGLRenderer {
    constructor(parameters?: {
      antialias?: boolean;
      powerPreference?: WebGLPowerPreference;
    });
    domElement: HTMLCanvasElement;
    dispose(): void;
    render(scene: Scene, camera: OrthographicCamera): void;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class ShaderMaterial {
    constructor(parameters: {
      uniforms: Record<string, {value: any}>;
      vertexShader: string;
      fragmentShader: string;
    });
    uniforms: Record<string, {value: any}>;
    dispose(): void;
  }

  export class PlaneGeometry {
    constructor(width: number, height: number);
    dispose(): void;
  }

  export class Mesh {
    constructor(geometry: PlaneGeometry, material: ShaderMaterial);
  }

  export const MathUtils: {
    lerp(start: number, end: number, alpha: number): number;
  };
}
