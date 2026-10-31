import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'car3d',
  templateUrl: './car3d.component.html',
  styleUrls: ['./car3d.component.css']
})
export class Car3dComponent implements AfterViewInit, OnDestroy {
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
  private doorL: THREE.Object3D | null = null;
  private doorR: THREE.Object3D | null = null;
  doorsOpen = false;
  forcePaint = false; // enlève la texture pour que la couleur ressorte

  ngAfterViewInit(): void {
    this.init3D();
    this.load(this.url);
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.id);
    this.controls?.dispose();
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onResize);
    this.disposeScene();
  }

  private init3D(): void {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // taille initiale
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
    this.controls.minDistance = 1.5;

    const grid = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1f2937);
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    (gridMat as any).opacity = 0.15;
    this.scene.add(grid);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.parentElement?.clientWidth || 960;
    const h = canvas.parentElement?.clientHeight || 540;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

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
        this.doorL = null;
        this.doorR = null;

        this.car.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            this.allMeshes.push(obj);

            const name = (obj.name || '').toLowerCase();
            if (name.includes('body') || name.includes('carpaint') || name.includes('chassis')) this.body.push(obj);
            if (name.includes('wheel') || name.includes('rim') || name.includes('tire') || name.includes('tyre')) this.wheels.push(obj);
          }
          // détecter portes si existantes
          const nm = (obj.name || '').toLowerCase();
          if (nm.includes('door_l') || nm.includes('door_left')) this.doorL = obj;
          if (nm.includes('door_r') || nm.includes('door_right')) this.doorR = obj;
        });

        this.ensureGroupsFallback();

        // center & scale
        const box = new THREE.Box3().setFromObject(this.car);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / (maxDim || 1);
        this.car.scale.setScalar(scale);
        box.setFromObject(this.car);
        const center = new THREE.Vector3(); box.getCenter(center);
        this.car.position.sub(center);

        this.scene.add(this.car);

        // debug
        console.log('[3D] Meshes:', this.allMeshes.map(m => m.name));
        console.log(`[3D] Counts -> all: ${this.allMeshes.length}, body: ${this.body.length}, wheels: ${this.wheels.length}`);
      },
      undefined,
      (err: unknown) => {
        console.error('Erreur chargement GLB:', err);
        alert('Impossible de charger le modèle 3D (voir la console).');
        this.close.emit();
      }
    );
  }

  private ensureGroupsFallback(): void {
    // Si on n'a pas détecté la carrosserie par le nom, on prend "tout sauf roues/vitres/lumières"
    if (this.body.length === 0) {
      const exclude = ['wheel','rim','tire','tyre','glass','window','light','headlight','taillight','interior','seat','brake','disc'];
      this.body = this.allMeshes.filter(m => {
        const n = (m.name || '').toLowerCase();
        return !exclude.some(x => n.includes(x));
      });

      // S'il ne reste vraiment rien, on prend tout (au moins pour démo couleur)
      if (this.body.length === 0) {
        this.body = [...this.allMeshes];
      }
    }

    // Si on n'a pas trouvé les roues, tente une heuristique par nom
    if (this.wheels.length === 0) {
      this.wheels = this.allMeshes.filter(m => {
        const n = (m.name || '').toLowerCase();
        return n.includes('wheel') || n.includes('rim') || n.includes('tire') || n.includes('tyre');
      });
    }
  }

  private loop = (): void => {
    this.id = requestAnimationFrame(this.loop);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private disposeScene(): void {
    this.scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const material = obj.material;
        if (Array.isArray(material)) {
          material.forEach((mat: THREE.Material) => mat.dispose());
        } else {
          (material as THREE.Material).dispose();
        }
      }
    });
  }

  // UI handlers
  onColorInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.color(val);
  }

  toggleForcePaint(): void {
    this.forcePaint = !this.forcePaint;
    // réapplique la dernière couleur pour voir l'effet tout de suite
    this.color('#ff0000');
  }

  color(hex: string): void {
    const c = new THREE.Color(hex);
    this.body.forEach((mesh: THREE.Mesh) => {
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      if (!mat) return;

      // si on force la peinture, on supprime la texture de base (sinon la couleur n'est qu’un tint)
      if (this.forcePaint && mat.map) {
        mat.map = null;
      }
      mat.color = c;
      mat.needsUpdate = true;
    });
  }

  rims(style: 'black' | 'silver'): void {
    const color = style === 'black' ? 0x222222 : 0xc0c0c0;
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.3 });
    this.wheels.forEach((mesh: THREE.Mesh) => {
      mesh.material = mat;
    });
  }

  doors(): void {
    this.doorsOpen = !this.doorsOpen;
    const a = this.doorsOpen ? Math.PI / 4 : 0;
    if (this.doorL) this.doorL.rotation.y = a;
    if (this.doorR) this.doorR.rotation.y = -a;
  }

  debugList(): void {
    console.table(this.allMeshes.map(m => ({ name: m.name })));
  }

  closeViewer(): void {
    this.close.emit();
  }
}
