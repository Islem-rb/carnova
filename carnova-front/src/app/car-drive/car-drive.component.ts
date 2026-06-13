import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  EventEmitter, Output, HostListener
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface CarModel { label: string; path: string; }
type KeyMap = Record<string, boolean>;

@Component({
  selector: 'app-car-drive',
  templateUrl: './car-drive.component.html',
  styleUrls: ['./car-drive.component.css']
})
export class CarDriveComponent implements AfterViewInit, OnDestroy {

  @Output() close = new EventEmitter<void>();
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private animationId = 0;

  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambient!: THREE.AmbientLight;
  private ground!: THREE.Mesh;

  private loader = new GLTFLoader();
  private carRoot = new THREE.Group();
  private carModel: THREE.Object3D | null = null;

  models: CarModel[] = [
    { label: 'Demo (3d.glb)', path: 'assets/3d.glb' },
    // { label: 'Sedan', path: 'assets/cars/sedan.glb' },
    // { label: 'Sport', path: 'assets/cars/sport.glb' },
  ];
  selectedModelIndex = 0;

  private velocity = 0;
  private yaw = 0;
  private readonly ACCEL = 18;
  private readonly BRAKE = 28;
  private readonly HBRAKE = 80;
  private readonly MAX_SPEED = 35;
  private readonly DRAG = 0.015;
  private readonly ROLL = 2.2;
  private readonly TURN_RATE = 1.8;
  private readonly CAM_SPRING = 5;

  private keys: KeyMap = {};
  private disposed = false;

  ngAfterViewInit(): void {
    this.initThree();
    this.addWorld();
    this.addLights();
    this.resetPosition();
    this.loadModel(this.models[this.selectedModelIndex].path);
    this.onResize(); // taille initiale
    this.animate();
  }

  ngOnDestroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    try {
      this.disposeScene(this.scene);
      this.renderer?.dispose();
    } catch {}
  }

  // ---------- Setup ----------
  private initThree(): void {
    const el = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0714);
    this.scene.fog = new THREE.Fog(0x0b0714, 120, 300);

    const fov = 60;
    const aspect = Math.max(el.clientWidth, 1) / Math.max(el.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(this.renderer.domElement);

    // IMPORTANT : dimensionner tout de suite
    this.renderer.setSize(el.clientWidth, el.clientHeight, false);
  }

  private addWorld(): void {
    // Sol
    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const planeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#120a25'),
      metalness: 0.1, roughness: 0.9
    });
    this.ground = new THREE.Mesh(planeGeo, planeMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Aide visuelle : grille
    const grid = new THREE.GridHelper(500, 50, 0x332255, 0x221433);
    (grid.material as THREE.Material).opacity = 0.35;
    (grid.material as THREE.Material as any).transparent = true;
    this.scene.add(grid);

    // Groupe voiture
    this.carRoot.position.set(0, 0, 0);
    this.scene.add(this.carRoot);
  }

  private addLights(): void {
    this.hemiLight = new THREE.HemisphereLight(0x8a7cff, 0x2a1848, 0.6);
    this.scene.add(this.hemiLight);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambient);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.dirLight.position.set(15, 30, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 150;
    (this.dirLight.shadow.camera as THREE.OrthographicCamera).left = -60;
    (this.dirLight.shadow.camera as THREE.OrthographicCamera).right = 60;
    (this.dirLight.shadow.camera as THREE.OrthographicCamera).top = 60;
    (this.dirLight.shadow.camera as THREE.OrthographicCamera).bottom = -60;
    this.scene.add(this.dirLight);
  }

  // ---------- Chargement modèle ----------
  onModelChange(evt: Event): void {
    const idx = Number.parseInt((evt.target as HTMLSelectElement).value, 10);
    if (!Number.isNaN(idx)) {
      this.selectedModelIndex = idx;
      this.loadModel(this.models[idx].path, true);
    }
  }

  private loadModel(path: string, reset = false): void {
    if (this.carModel) {
      this.carRoot.remove(this.carModel);
      this.disposeObject(this.carModel);
      this.carModel = null;
    }

    this.loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;

        // Ombres
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if ((mesh as any).isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // ---- Mise à l'échelle robuste par dimension max
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const target = 4; // ~ longueur cible
        const s = maxDim > 0 ? target / maxDim : 1;
        model.scale.setScalar(s);

        // ---- Poser le modèle sur le sol
        const bbox2 = new THREE.Box3().setFromObject(model);
        const minY = bbox2.min.y;
        model.position.y -= minY;

        this.carModel = model;
        this.carRoot.add(model);

        if (reset) this.resetPosition();
      },
      undefined,
      (err) => {
        console.warn('Échec de chargement GLB, placeholder utilisé.', err);
        const placeholder = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.8, 4),
          new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.3, roughness: 0.6 })
        );
        placeholder.castShadow = true;
        placeholder.position.y = 0.4;
        this.carModel = placeholder;
        this.carRoot.add(placeholder);
        if (reset) this.resetPosition();
      }
    );
  }

  // ---------- Boucle ----------
  private animate = (): void => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    this.updatePhysics(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  // ---------- Physique ----------
  private updatePhysics(dt: number): void {
    const forward = (this.keys['w'] || this.keys['arrowup']) ? 1 : 0;
    const back    = (this.keys['s'] || this.keys['arrowdown']) ? 1 : 0;
    const left    = (this.keys['a'] || this.keys['arrowleft']) ? 1 : 0;
    const right   = (this.keys['d'] || this.keys['arrowright']) ? 1 : 0;
    const space   = !!this.keys[' '];

    if (forward) this.velocity += this.ACCEL * dt;
    if (back) {
      if (this.velocity > 0) this.velocity -= this.BRAKE * dt;
      else this.velocity -= this.ACCEL * dt;
    }

    if (space) {
      if (Math.abs(this.velocity) > 0.2) {
        const sign = Math.sign(this.velocity);
        this.velocity -= sign * this.HBRAKE * dt;
      } else {
        this.velocity = 0;
      }
    }

    const drag = this.DRAG * this.velocity * this.velocity * Math.sign(this.velocity);
    const roll = this.ROLL * Math.sign(this.velocity);

    if (!forward && !back) {
      const decel = Math.min(Math.abs(this.velocity), (Math.abs(drag) + Math.abs(roll)) * dt);
      this.velocity -= Math.sign(this.velocity) * decel;
    } else {
      this.velocity -= drag * dt;
    }

    this.velocity = THREE.MathUtils.clamp(this.velocity, -this.MAX_SPEED * 0.5, this.MAX_SPEED);

    let steer = 0;
    if (left) steer -= 1;
    if (right) steer += 1;

    if (Math.abs(this.velocity) > 0.05) {
      const steerFactor = THREE.MathUtils.clamp(Math.abs(this.velocity) / this.MAX_SPEED, 0, 1);
      this.yaw += steer * this.TURN_RATE * steerFactor * dt * Math.sign(this.velocity);
    }

    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0)).normalize();
    this.carRoot.position.addScaledVector(dir, this.velocity * dt);
    this.carRoot.rotation.set(0, this.yaw, 0);
    this.carRoot.position.y = 0;
  }

  // ---------- Caméra ----------
  private updateCamera(dt: number): void {
    const target = this.carRoot.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    const localOffset = new THREE.Vector3(0, 2.5, 6);
    const worldOffset = localOffset.applyEuler(new THREE.Euler(0, this.yaw, 0));
    const desired = this.carRoot.position.clone().add(worldOffset);

    const alpha = 1 - Math.exp(-this.CAM_SPRING * dt);
    this.camera.position.lerp(desired, alpha);
    this.camera.lookAt(target);
  }

  // ---------- UI ----------
  resetPosition(): void {
    this.velocity = 0;
    this.yaw = 0;
    this.carRoot.position.set(0, 0, 0);
    this.carRoot.rotation.set(0, 0, 0);

    const localOffset = new THREE.Vector3(0, 2.5, 6);
    const desired = this.carRoot.position.clone().add(localOffset);
    this.camera.position.copy(desired);
    this.camera.lookAt(this.carRoot.position.clone().add(new THREE.Vector3(0, 1, 0)));
  }

  onQuit(): void {
    this.close.emit();
  }

  // ---------- Cleanup ----------
  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((o: THREE.Object3D) => {
      const anyO = o as any;
      if ((anyO.geometry as THREE.BufferGeometry)?.dispose) anyO.geometry.dispose();
      const mat = anyO.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(m => m?.dispose && m.dispose());
      else mat?.dispose && mat.dispose();
      if ((anyO.texture as THREE.Texture)?.dispose) anyO.texture.dispose();
    });
  }

  private disposeScene(scene: THREE.Scene): void {
    scene.traverse((o: THREE.Object3D) => {
      const anyO = o as any;
      if ((anyO.geometry as THREE.BufferGeometry)?.dispose) anyO.geometry.dispose();
      const mat = anyO.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(m => m?.dispose && m.dispose());
      else mat?.dispose && mat.dispose();
      if ((anyO.texture as THREE.Texture)?.dispose) anyO.texture.dispose();
    });
  }

  // ---------- Listeners (WINDOW pour fiabilité) ----------
  @HostListener('window:resize')
  onResize(): void {
    if (!this.renderer || !this.camera) return;
    const el = this.containerRef.nativeElement;
    const w = Math.max(el.clientWidth, 1);
    const h = Math.max(el.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === 'escape') this.onQuit();
    if (k === 'r') this.resetPosition();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    const k = e.key.toLowerCase();
    this.keys[k] = false;
  }
}
