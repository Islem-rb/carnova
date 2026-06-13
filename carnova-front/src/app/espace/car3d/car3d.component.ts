import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnChanges, OnDestroy, Output, SimpleChanges, ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

type Scope = 'body' | 'selected' | 'all';

@Component({
  selector: 'car3d',
  templateUrl: './car3d.component.html',
  styleUrls: ['./car3d.component.css']
})
export class Car3dComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() url!: string;
  @Output() close = new EventEmitter<void>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private id = 0;

  car: THREE.Object3D | null = null;
  allMeshes: THREE.Mesh[] = [];
  body: THREE.Mesh[] = [];
  wheels: THREE.Mesh[] = [];
  windows: THREE.Mesh[] = [];
  lights: THREE.Mesh[] = [];

  private doorL: THREE.Object3D | null = null;
  private doorR: THREE.Object3D | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  selectedMesh: THREE.Mesh | null = null;
  private selectionBox: THREE.BoxHelper | null = null;

  // États UI (sans ngModel)
  doorsOpen = false;
  applyScope: Scope = 'body';
  metalness = 0.4;
  roughness = 0.4;
  windowsColor = '#4da3ff';
  windowsOpacity = 0.3;

  private originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  ngAfterViewInit(): void {
    this.init3D();
    if (this.url) this.load(this.url);
    this.loop();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url'] && !changes['url'].firstChange) this.reloadModel();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.id);
    this.controls?.dispose();
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onResize);
    this.canvasRef?.nativeElement.removeEventListener('pointerdown', this.onPointerDown);
    this.disposeScene();
  }

  private init3D(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const w = canvas.parentElement?.clientWidth || 960;
    const h = canvas.parentElement?.clientHeight || 540;
    this.renderer.setSize(w, h);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1020);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.set(3, 2, 5);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 20, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    this.scene.add(dir);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxDistance = 9;
    this.controls.minDistance = 1.2;

    const grid = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1f2937);
    const gridMat = grid.material as THREE.Material;
    (gridMat as any).transparent = true;
    (gridMat as any).opacity = 0.15;
    this.scene.add(grid);

    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.parentElement?.clientWidth || 960;
    const h = canvas.parentElement?.clientHeight || 540;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private reloadModel(): void {
    if (this.car) {
      this.scene.remove(this.car);
      this.disposeScene();
      this.allMeshes = this.body = this.wheels = this.windows = this.lights = [];
      this.originalMaterials.clear();
      this.selectedMesh = null;
      if (this.selectionBox) { this.scene.remove(this.selectionBox); this.selectionBox = null; }
    }
    if (this.url) this.load(this.url);
  }

  private load(url: string): void {
    const loader = new GLTFLoader().setCrossOrigin('anonymous');
    loader.load(
      url,
      (gltf: GLTF) => {
        this.car = gltf.scene;

        // reset
        this.allMeshes = [];
        this.body = [];
        this.wheels = [];
        this.windows = [];
        this.lights = [];
        this.doorL = null;
        this.doorR = null;
        this.originalMaterials.clear();

        this.car.traverse((obj: THREE.Object3D) => {
          const name = (obj.name || '').toLowerCase();

          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true; obj.receiveShadow = true;
            this.allMeshes.push(obj);
            this.originalMaterials.set(
              obj,
              Array.isArray(obj.material) ? obj.material.map(m => m.clone()) : (obj.material as THREE.Material).clone()
            );

            if (name.includes('body') || name.includes('carpaint') || name.includes('chassis')) this.body.push(obj);
            if (name.includes('wheel') || name.includes('rim') || name.includes('tire') || name.includes('tyre')) this.wheels.push(obj);
            if (name.includes('glass') || name.includes('window') || name.includes('windshield')) this.windows.push(obj);
            if (name.includes('light') || name.includes('headlight') || name.includes('taillight')) this.lights.push(obj);
          }
          if (name.includes('door_l') || name.includes('door_left')) this.doorL = obj;
          if (name.includes('door_r') || name.includes('door_right')) this.doorR = obj;
        });

        if (this.body.length === 0) {
          const exclude = ['wheel','rim','tire','tyre','glass','window','light','headlight','taillight','interior','seat','brake','disc'];
          this.body = this.allMeshes.filter(m => !exclude.some(x => (m.name||'').toLowerCase().includes(x)));
          if (this.body.length === 0) this.body = [...this.allMeshes];
        }
        if (this.wheels.length === 0) {
          this.wheels = this.allMeshes.filter(m => {
            const n = (m.name || '').toLowerCase();
            return n.includes('wheel') || n.includes('rim') || n.includes('tire') || n.includes('tyre');
          });
        }

        const box = new THREE.Box3().setFromObject(this.car);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / (maxDim || 1);
        this.car.scale.setScalar(scale);
        box.setFromObject(this.car);
        const center = new THREE.Vector3(); box.getCenter(center);
        this.car.position.sub(center);

        this.scene.add(this.car);
        console.log('[3D] Pièces:', this.allMeshes.map(m => m.name));
      },
      undefined,
      (err: unknown) => {
        console.error('Erreur chargement GLB:', err);
        alert('Impossible de charger le modèle 3D (voir la console).');
        this.close.emit();
      }
    );
  }

  private loop = (): void => {
    this.id = requestAnimationFrame(this.loop);
    this.controls.update();
    if (this.selectionBox && this.selectedMesh) this.selectionBox.update(this.selectedMesh);
    this.renderer.render(this.scene, this.camera);
  };

  private disposeScene(): void {
    this.scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const material = obj.material;
        if (Array.isArray(material)) material.forEach((m: THREE.Material) => m.dispose());
        else (material as THREE.Material).dispose();
      }
    });
  }

  // Sélection au clic
  private onPointerDown = (event: PointerEvent): void => {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y);

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.allMeshes, false);
    const hit = intersects[0]?.object as THREE.Mesh | undefined;
    if (hit) this.setSelected(hit);
  };

  private setSelected(mesh: THREE.Mesh | null): void {
    if (this.selectionBox) { this.scene.remove(this.selectionBox); this.selectionBox = null; }
    this.selectedMesh = mesh;
    if (mesh) {
      this.selectionBox = new THREE.BoxHelper(mesh, 0xffff00);
      this.scene.add(this.selectionBox);
    }
  }

  // UI (sans ngModel)
  onScopeChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as Scope;
    this.applyScope = val;
  }

  onColorInput(e: Event): void {
    const hex = (e.target as HTMLInputElement).value;
    const targets = this.getTargets();
    const c = new THREE.Color(hex);
    targets.forEach((mesh: THREE.Mesh) => {
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      if (!mat) return;
      mat.color = c;
      mat.needsUpdate = true;
    });
  }

  onMetalness(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    this.metalness = isNaN(v) ? this.metalness : v;
    this.applyMaterialProps();
  }

  onRoughness(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    this.roughness = isNaN(v) ? this.roughness : v;
    this.applyMaterialProps();
  }

  onWindowsColor(e: Event): void {
    this.windowsColor = (e.target as HTMLInputElement).value;
    this.tintWindows();
  }

  onWindowsOpacity(e: Event): void {
    const v = parseFloat((e.target as HTMLInputElement).value);
    this.windowsOpacity = isNaN(v) ? this.windowsOpacity : v;
    this.tintWindows();
  }

  rims(style: 'black' | 'silver'): void {
    const color = style === 'black' ? 0x222222 : 0xc0c0c0;
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.3 });
    this.wheels.forEach((mesh: THREE.Mesh) => { mesh.material = mat; });
  }

  doors(): void {
    this.doorsOpen = !this.doorsOpen;
    const a = this.doorsOpen ? Math.PI / 4 : 0;
    if (this.doorL) this.doorL.rotation.y = a;
    if (this.doorR) this.doorR.rotation.y = -a;
  }

  applyMaterialProps(): void {
    const targets = this.getTargets();
    targets.forEach((mesh: THREE.Mesh) => {
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      if (!mat) return;
      mat.metalness = this.metalness;
      mat.roughness = this.roughness;
      mat.needsUpdate = true;
    });
  }

  tintWindows(): void {
    const color = new THREE.Color(this.windowsColor);
    this.windows.forEach((mesh: THREE.Mesh) => {
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      if (!mat) return;
      mat.color = color;
      mat.transparent = true;
      mat.opacity = this.windowsOpacity;
      mat.depthWrite = this.windowsOpacity >= 0.99;
      mat.needsUpdate = true;
    });
  }

  toggleSelectedVisible(): void {
    if (this.selectedMesh) this.selectedMesh.visible = !this.selectedMesh.visible;
  }

  resetAll(): void {
    this.originalMaterials.forEach((orig, mesh) => {
      mesh.material = Array.isArray(orig) ? orig.map(m => m.clone()) : (orig as THREE.Material).clone();
      mesh.visible = true;
    });
    this.metalness = 0.4;
    this.roughness = 0.4;
    this.windowsColor = '#4da3ff';
    this.windowsOpacity = 0.3;
    this.setSelected(null);
  }

  exportGLB(): void {
    const exporter = new GLTFExporter();
    const input = (this.car || this.scene) as THREE.Object3D;
    const options: any = { binary: true, onlyVisible: true };
    const anyExporter = exporter as any;

    if (typeof anyExporter.parseAsync === 'function') {
      anyExporter.parseAsync(input, options)
        .then((res: ArrayBuffer | object) => this.downloadGLTF(res))
        .catch((err: any) => console.error('GLTF export error:', err));
    } else {
      anyExporter.parse(
        input,
        (res: ArrayBuffer | object) => this.downloadGLTF(res),
        (err: any) => console.error('GLTF export error:', err),
        options
      );
    }
  }

  private downloadGLTF(res: ArrayBuffer | object): void {
    let blob: Blob;
    if (res instanceof ArrayBuffer) {
      blob = new Blob([res], { type: 'model/gltf-binary' });
    } else {
      blob = new Blob([JSON.stringify(res)], { type: 'application/json' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-custom.glb';
    a.click();
    URL.revokeObjectURL(url);
  }

  debugList(): void {
    console.table(this.allMeshes.map(m => ({ name: m.name })));
  }

  closeViewer(): void { this.close.emit(); }

  private getTargets(): THREE.Mesh[] {
    if (this.applyScope === 'selected' && this.selectedMesh) return [this.selectedMesh];
    if (this.applyScope === 'all') return this.allMeshes;
    return this.body.length ? this.body : this.allMeshes;
  }
}
