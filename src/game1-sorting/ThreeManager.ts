import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ThreeManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private loader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private colorTexture: THREE.Texture | null = null;
  private models: Map<string, THREE.Group> = new Map();

  constructor(containerId: string, width: number, height: number) {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 10);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = document.getElementById(containerId);
    if (container) {
      this.renderer.domElement.style.position = "absolute";
      this.renderer.domElement.style.pointerEvents = "none";
      this.renderer.domElement.style.zIndex = "1";
      container.appendChild(this.renderer.domElement);
    }

    this.loader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.setupLights();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);
  }

  public initTexture(): Promise<void> {
    return new Promise((resolve) => {
      this.textureLoader.load(
        "assets/models/textures/colormap.png",
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = false;
          this.colorTexture = texture;
          resolve();
        },
        undefined,
        () => resolve()
      );
    });
  }

  public syncCanvasPosition(phaserCanvas: HTMLCanvasElement) {
    const rect = phaserCanvas.getBoundingClientRect();
    const dom = this.renderer.domElement;
    dom.style.left = `${phaserCanvas.offsetLeft}px`;
    dom.style.top = `${phaserCanvas.offsetTop}px`;
    dom.style.width = `${rect.width}px`;
    dom.style.height = `${rect.height}px`;
  }

  public loadModel(key: string, path: string, customColor?: number): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              
              if (customColor !== undefined) {
                // Para a tigela vermelha ficar com a cor viva em destaque
                mesh.material = new THREE.MeshStandardMaterial({
                  color: customColor,
                  roughness: 0.3,
                  metalness: 0.1,
                });
              } else if (this.colorTexture) {
                mesh.material = new THREE.MeshStandardMaterial({
                  map: this.colorTexture,
                  roughness: 0.4,
                  metalness: 0.1,
                });
              }
            }
          });

          this.models.set(key, model);
          resolve(model);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  public createModelInstance(key: string): THREE.Group | null {
    const original = this.models.get(key);
    if (!original) return null;
    const clone = original.clone(true);
    this.scene.add(clone);
    return clone;
  }

  public removeModel(model: THREE.Group) {
    this.scene.remove(model);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
