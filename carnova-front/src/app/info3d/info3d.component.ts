import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three-stdlib';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface Marker {
  id: number;
  label: string;
  desc: string;
  position: THREE.Vector3;
  show: boolean;
}

@Component({
  selector: 'app-info3d',
  templateUrl: './info3d.component.html',
  styleUrls: ['./info3d.component.css']
})
export class Info3dComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) elRef!: ElementRef<HTMLDivElement>;

  // three
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
  private renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  private controls!: OrbitControls;
  private raf = 0;

  // model
  private model?: THREE.Object3D;
  public center = new THREE.Vector3();
  public size = new THREE.Vector3();
  public maxDim = 0; // pour éviter Math dans le HTML

  // UI
  showMarkers = true;
  markers: Marker[] = [];

  ngAfterViewInit(): void {
    this.initRendererAndLights();
    this.loadModel('assets/models/Ford Raptor.glb');
    window.addEventListener('resize', this.onResize);
    this.onResize();
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  // ---------- setup HD ----------
  private initRendererAndLights() {
    const el = this.elRef.nativeElement;
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    el.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.1).texture;
    this.scene.background = new THREE.Color(0xf2f2f2);

    this.camera.position.set(3.2, 2.0, 6.0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4), key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  // ---------- load model ----------
  private loadModel(path: string) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        this.model = gltf.scene;
        this.model.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = mesh.receiveShadow = true;
            const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
            if (mat && 'metalness' in mat) {
              if (mat.color) mat.color.convertSRGBToLinear();
              mat.roughness = Math.min(mat.roughness ?? 0.6, 0.45);
              mat.metalness = Math.max(mat.metalness ?? 0.0, 0.2);
              (mat as any).envMapIntensity = 1.0;
            }
          }
        });
        this.scene.add(this.model);

        const box = new THREE.Box3().setFromObject(this.model);
        box.getCenter(this.center);
        box.getSize(this.size);
        this.maxDim = Math.max(this.size.x, this.size.y, this.size.z);

        const fov = this.camera.fov * (Math.PI / 180);
        const camDist = Math.abs(this.maxDim / (2 * Math.tan(fov / 2))) * 1.6;
        this.camera.position.set(this.center.x + camDist * 0.6, this.center.y + camDist * 0.35, this.center.z + camDist);
        this.camera.near = Math.max(0.01, this.maxDim / 100);
        this.camera.far  = Math.max(1000, this.maxDim * 100);
        this.camera.updateProjectionMatrix();
        this.controls.target.copy(this.center);
        this.controls.update();

        this.buildMarkers();
      },
      (p) => { if (p.total) console.log(`GLB ${Math.round(100 * p.loaded / p.total)}%`); },
      (e) => console.error('Erreur GLB:', e)
    );
  }

  // utilitaire position relative
  private r(ox: number, oy: number, oz: number) {
    return new THREE.Vector3(
      this.center.x + this.size.x * ox,
      this.center.y + this.size.y * oy,
      this.center.z + this.size.z * oz
    );
  }
// Sauvegarder une image PNG du rendu
public savePng() {
  const link = document.createElement('a');
  link.download = 'capture.png';
  link.href = this.renderer.domElement.toDataURL('image/png');
  link.click();
}

// Version alternative de screen() avec offset bulle
public screenFromMarker(m: Marker) {
  const pos = this.screen(m.position);
  return { x: pos.x, y: pos.y + (m as any).__bubbleOffsetY || 0 };
}

  // ---------- markers ----------
  private buildMarkers() {
    this.markers = [
      { id: 1, label: 'Moteur EcoBoost', desc: 'V6 3.5 L biturbo (couple élevé).',  position: this.r( 0.00, 0.28, +0.45), show: false },
      { id: 2, label: 'Tableau de bord', desc: 'Instrumentation + écran central.',    position: this.r( 0.00, 0.22, +0.12), show: false },
      { id: 3, label: 'Volant',          desc: 'Multifonctions, aides à la conduite.',position: this.r(-0.15, 0.22, +0.10), show: false },
      { id: 4, label: 'Sélecteur de boîte',desc:'Modes Normal/Sport/Terrain.',        position: this.r(+0.02, 0.15,  0.00), show: false },
      { id: 5, label: 'Porte AV droite', desc: 'Ouverture large, marchepied.',        position: this.r(+0.55, 0.20, +0.05), show: false },
      { id: 6, label: 'Rétroviseur',     desc: 'Extérieur, clignotant intégré.',      position: this.r(+0.55, 0.32, +0.12), show: false },
      { id: 7, label: 'Éclairage intérieur', desc:'Plafonnier LED.',                  position: this.r( 0.00, 0.50,  0.00), show: false },
      { id: 8, label: 'Capot',           desc: 'Sculpté avec extracteurs (selon fin.).', position: this.r(0.00, 0.32, +0.35), show: false },
      { id: 9, label: 'Phares LED',      desc: 'Signature avant, excellente visibilité.', position: this.r(+0.28, 0.12, +0.55), show: false },
      { id:10, label: 'Capot',   desc: 'Sculpté avec extracteurs (selon fin.)',  position: this.r( 0.00, 0.18, -0.55), show: false },
    ];
  }

  toggleBubble(m: Marker) {
    this.markers.forEach(x => { if (x !== m) x.show = false; });
    m.show = !m.show;
  }

  // projection 3D -> écran
  screen(world: THREE.Vector3) {
    const p = world.clone().project(this.camera);
    const el = this.elRef.nativeElement;
    return { x: (p.x * .5 + .5) * el.clientWidth, y: (-p.y * .5 + .5) * el.clientHeight };
  }

  // loop + resize
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const el = this.elRef.nativeElement;
    this.camera.aspect = el.clientWidth / el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(el.clientWidth, el.clientHeight);
  };

  // Zoom sur une partie (exemple : double-clic)
  public flyTo(target: THREE.Vector3, distance: number) {
    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const newPos = target.clone().add(dir.multiplyScalar(distance));
    this.camera.position.copy(newPos);
    this.controls.target.copy(target);
    this.controls.update();
  }
}
