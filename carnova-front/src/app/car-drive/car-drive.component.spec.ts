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
  private ambient!: THREE.AmbientLight;
  private hemi!: THREE.HemisphereLight;
  private ground!: THREE.Mesh;

  private loader = new GLTFLoader();
  private carRoot = new THREE.Group();
  private carPivot = new THREE.Group();
  private carModel: THREE.Object3D | null = null;
  private placeholder!: THREE.Mesh;

  private velocity = 0;
  private yaw = 0;

  private keys: KeyMap = {};
  private disposed = false;

  private DEBUG = true;
  private colliders: THREE.Mesh[] = [];

  models: CarModel[] = [
    { label: 'Demo (3d.glb)', path: 'assets/3d.glb' },
  ];
  selectedModelIndex = 0;

  private readonly ACCEL = 18;
  private readonly BRAKE = 28;
  private readonly HBRAKE = 80;
  private readonly MAX_SPEED = 35;
  private readonly DRAG = 0.015;
  private readonly ROLL = 2.2;
  private readonly TURN_RATE = 1.8;
  private readonly CAM_SPRING = 5;

  ngAfterViewInit(): void {
    this.initThree();
    this.addLights();
    this.buildCity();   // 🔹 génère la ville

    this.carRoot.position.set(0, 0, -60); // spawn voiture
    this.scene.add(this.carRoot);
    this.carRoot.add(this.carPivot);

    this.addPlaceholder();
    this.loadModel(this.models[this.selectedModelIndex].path);

    this.onResize();
    this.resetPosition(true);
    this.animate();

    // Helper debug
    const axes = new THREE.AxesHelper(10);
    axes.position.set(0, 0.1, 0);
    this.scene.add(axes);
  }

  ngOnDestroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.renderer?.dispose();
  }

  private initThree(): void {
    const el = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1330);
    // this.scene.fog = new THREE.Fog(0x0b0714, 180, 700);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(this.renderer.domElement);

    this.renderer.setSize(el.clientWidth, el.clientHeight, false);
  }

  private addLights(): void {
    this.hemi = new THREE.HemisphereLight(0xbfc7ff, 0x2a1d3a, 0.9);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(this.ambient);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(120, 220, 140);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.dirLight);
  }

  private buildCity(): void {
    const city = new THREE.Group();

    // Sol général
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x201a33, roughness: 1, metalness: 0 });
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    city.add(ground);

    // Routes
    const streetMat = new THREE.MeshStandardMaterial({ color: 0x2a2738, roughness: 0.9, metalness: 0.05 });
    for (let i = -2; i <= 2; i++) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(1000, 10), streetMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = i * 50;
      city.add(road);

      const road2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 1000), streetMat);
      road2.rotation.x = -Math.PI / 2;
      road2.position.x = i * 50;
      city.add(road2);
    }

    // Bâtiments
    const buildingMats = [
      new THREE.MeshStandardMaterial({ color: 0x5b4b84 }),
      new THREE.MeshStandardMaterial({ color: 0x4a3a6e }),
      new THREE.MeshStandardMaterial({ color: 0x3a345a }),
    ];
    for (let i = 0; i < 30; i++) {
      const mat = buildingMats[Math.floor(Math.random() * buildingMats.length)];
      const geo = new THREE.BoxGeometry(20, Math.random() * 60 + 20, 20);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 800, geo.parameters.height / 2, (Math.random() - 0.5) * 800);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      city.add(mesh);
      this.colliders.push(mesh);
    }

    this.scene.add(city);
    console.log('[City] blocs ajoutés, colliders:', this.colliders.length);
  }

  private addPlaceholder(): void {
    this.placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed })
    );
    this.placeholder.castShadow = true;
    this.placeholder.position.y = 0.4;
    this.carModel = this.placeholder;
    this.carPivot.add(this.placeholder);
  }

  private loadModel(path: string): void {
    this.loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(2);
        model.position.set(0, 0, 0);
        this.carPivot.clear();
        this.carModel = model;
        this.carPivot.add(model);
      },
      undefined,
      (err) => console.warn('GLB load failed:', err)
    );
  }

  private animate = (): void => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    this.updatePhysics(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private updatePhysics(dt: number): void {
    const forward = (this.keys['w'] || this.keys['arrowup']) ? 1 : 0;
    const back = (this.keys['s'] || this.keys['arrowdown']) ? 1 : 0;
    const left = (this.keys['a'] || this.keys['arrowleft']) ? 1 : 0;
    const right = (this.keys['d'] || this.keys['arrowright']) ? 1 : 0;

    if (forward) this.velocity += this.ACCEL * dt;
    if (back) this.velocity -= this.BRAKE * dt;

    if (this.velocity > this.MAX_SPEED) this.velocity = this.MAX_SPEED;
    if (this.velocity < -this.MAX_SPEED / 2) this.velocity = -this.MAX_SPEED / 2;

    if (!forward && !back) this.velocity *= 0.98;

    if (left) this.yaw += this.TURN_RATE * dt;
    if (right) this.yaw -= this.TURN_RATE * dt;

    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    this.carRoot.position.addScaledVector(dir, this.velocity * dt);
    this.carRoot.rotation.y = this.yaw;
  }

  private updateCamera(dt: number): void {
    const target = this.carRoot.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    const localOffset = new THREE.Vector3(0, 4, 10);
    const worldOffset = localOffset.applyEuler(new THREE.Euler(0, this.yaw, 0));
    const desired = this.carRoot.position.clone().add(worldOffset);

    const alpha = 1 - Math.exp(-this.CAM_SPRING * dt);
    this.camera.position.lerp(desired, alpha);
    this.camera.lookAt(target);
  }

  resetPosition(teleportCam = false): void {
    this.velocity = 0;
    this.yaw = 0;
    this.carRoot.position.set(0, 0, -60);
    this.carRoot.rotation.set(0, 0, 0);

    if (teleportCam) {
      const localOffset = new THREE.Vector3(0, 4, 10);
      const desired = this.carRoot.position.clone().add(localOffset);
      this.camera.position.copy(desired);
      this.camera.lookAt(this.carRoot.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
  }

  onQuit(): void {
    this.close.emit();
  }

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
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    const k = e.key.toLowerCase();
    this.keys[k] = false;
  }
}
