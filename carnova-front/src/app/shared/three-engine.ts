import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export interface SceneHandle {
  dispose(): void;
  reset(): void;
  rotate(value: boolean): void;
  color(value: string): void;
  key(value: string, down: boolean): void;
}
export async function createScene(
  host: HTMLElement,
  url: string,
  drive: boolean,
  onProgress: (n: number) => void,
  onSpeed: (n: number) => void,
  abort: AbortSignal,
): Promise<SceneHandle> {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'default',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    drive
      ? 'Conduite 3D. Utilisez les flèches ou ZQSD après avoir sélectionné la scène.'
      : 'Modèle 3D interactif. Glissez pour tourner, utilisez la molette pour zoomer ou les flèches pour déplacer la vue.',
  );
  host.appendChild(canvas);
  const scene = new T.Scene();
  scene.background = new T.Color('#222923');
  scene.fog = new T.Fog('#222923', drive ? 45 : 18, drive ? 180 : 50);
  const camera = new T.PerspectiveCamera(38, 1, 0.1, drive ? 500 : 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3.3;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2.02;
  controls.target.set(0, 0.8, 0);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.6;
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight('#efffe2', '#2b3427', 2));
  const light = new T.DirectionalLight('#ffffff', 4);
  light.position.set(5, 8, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -6;
  light.shadow.camera.right = 6;
  light.shadow.camera.top = 6;
  light.shadow.camera.bottom = -6;
  light.shadow.normalBias = 0.03;
  scene.add(light);
  const floor = new T.Mesh(
    new T.PlaneGeometry(drive ? 1500 : 100, drive ? 1500 : 100),
    new T.MeshStandardMaterial({ color: '#2a332a', roughness: 0.78, metalness: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.025;
  floor.receiveShadow = true;
  scene.add(floor);
  if (drive) {
    const grid = new T.GridHelper(1400, 280, '#84966a', '#3a4838');
    grid.position.y = -0.01;
    scene.add(grid);
    for (let i = 0; i < 28; i++) {
      const geometry = new T.BoxGeometry(
        3 + Math.random() * 5,
        4 + Math.random() * 12,
        4 + Math.random() * 4,
      );
      const mesh = new T.Mesh(
        geometry,
        new T.MeshStandardMaterial({ color: '#354431', roughness: 0.8 }),
      );
      const angle = (i / 28) * Math.PI * 2;
      const radius = 18 + (i % 3) * 18;
      mesh.position.set(
        Math.cos(angle) * radius,
        geometry.parameters.height / 2,
        Math.sin(angle) * radius,
      );
      mesh.castShadow = true;
      scene.add(mesh);
    }
  }
  let disposed = false;
  let frame = 0;
  let car: T.Group | undefined;
  let speed = 0;
  let yaw = 0;
  let lastTime = performance.now();
  let needsRender = true;
  const keys = new Set<string>();
  const paintMaterials: T.MeshStandardMaterial[] = [];
  function reset() {
    if (car) {
      car.position.set(0, 0, 0);
      car.rotation.y = 0;
    }
    speed = 0;
    yaw = 0;
    camera.position.set(5, 2.4, 6);
    controls.target.set(0, 0.8, 0);
    controls.update();
    needsRender = true;
    onSpeed(0);
  }
  reset();
  const observer = new ResizeObserver(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w > 0 && h > 0) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      needsRender = true;
    }
  });
  observer.observe(host);
  function disposeObject(object: T.Object3D) {
    object.traverse((node) => {
      if (node instanceof T.Mesh) {
        node.geometry.dispose();
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          for (const value of Object.values(material))
            if (value instanceof T.Texture) value.dispose();
          material.dispose();
        }
      }
    });
  }
  const contextLost = (e: Event) => {
    e.preventDefault();
    host.dispatchEvent(new CustomEvent('viewer-error'));
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  const keyDown = (e: KeyboardEvent) => {
    if (drive && (document.activeElement === canvas || host.contains(document.activeElement))) {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          ' ',
          'w',
          'a',
          's',
          'd',
          'z',
          'q',
        ].includes(e.key)
      ) {
        e.preventDefault();
        keys.add(e.key);
      }
    }
  };
  const keyUp = (e: KeyboardEvent) => keys.delete(e.key);
  const blur = () => keys.clear();
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);
  canvas.addEventListener('blur', blur);
  const handle: SceneHandle = {
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.removeEventListener('abort', cancel);
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('blur', blur);
      canvas.removeEventListener('webglcontextlost', contextLost);
      disposeObject(scene);
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
    reset,
    rotate(v) {
      controls.autoRotate = v;
      needsRender = true;
    },
    color(value) {
      for (const material of paintMaterials) material.color.set(value);
      needsRender = true;
    },
    key(value, down) {
      if (down) keys.add(value);
      else keys.delete(value);
    },
  };
  const cancel = () => handle.dispose();
  abort.addEventListener('abort', cancel, { once: true });
  function loop(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    let changed = false;
    if (drive && car) {
      changed = true;
      const forward = keys.has('ArrowUp') || keys.has('w') || keys.has('z');
      const back = keys.has('ArrowDown') || keys.has('s');
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('q');
      const right = keys.has('ArrowRight') || keys.has('d');
      speed += (forward ? 11 : back ? -13 : 0) * dt;
      speed *= Math.exp(-(keys.has(' ') ? 5 : forward || back ? 0.25 : 1.8) * dt);
      speed = T.MathUtils.clamp(speed, -6, 23);
      if (Math.abs(speed) > 0.1)
        yaw += ((left ? 1 : 0) - (right ? 1 : 0)) * dt * 1.7 * Math.sign(speed);
      car.rotation.y = yaw;
      car.position.x -= Math.sin(yaw) * speed * dt;
      car.position.z -= Math.cos(yaw) * speed * dt;
      if (car.position.length() > 500) reset();
      const target = new T.Vector3(
        car.position.x + Math.sin(yaw) * 8,
        car.position.y + 3.5,
        car.position.z + Math.cos(yaw) * 8,
      );
      camera.position.lerp(target, 1 - Math.exp(-4 * dt));
      camera.lookAt(car.position.clone().add(new T.Vector3(0, 0.7, 0)));
      light.position.set(car.position.x + 5, 8, car.position.z + 4);
      onSpeed(Math.round(Math.abs(speed) * 3.6));
    } else changed = controls.update();
    // OrbitControls reports camera changes, including damping and auto-rotation.
    // Static scenes and paint-only changes do not need continuous GPU work or shader recompilation.
    if (changed || needsRender) {
      needsRender = false;
      renderer.render(scene, camera);
    }
  }
  frame = requestAnimationFrame(loop);
  try {
    abort.throwIfAborted();
    const response = await fetch(url, {
      signal: AbortSignal.any([abort, AbortSignal.timeout(45000)]),
    });
    if (!response.ok) throw new Error('Model unavailable');
    const total = Number(response.headers.get('Content-Length')) || 0;
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Model unavailable');
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > 100 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('Model exceeds limit');
      }
      chunks.push(value);
      if (total) onProgress(Math.min(99, Math.round((received / total) * 100)));
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    abort.throwIfAborted();
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer,
      url.slice(0, url.lastIndexOf('/') + 1),
    );
    if (disposed) {
      disposeObject(gltf.scene);
      return handle;
    }
    car = gltf.scene;
    const box = new T.Box3().setFromObject(car);
    const size = box.getSize(new T.Vector3());
    const scale = 4.2 / Math.max(size.x, size.y, size.z);
    car.scale.setScalar(scale);
    const scaled = new T.Box3().setFromObject(car);
    const center = scaled.getCenter(new T.Vector3());
    const content = new T.Group();
    car.position.set(-center.x, -scaled.min.y, -center.z);
    content.add(car);
    car = content;
    scene.add(car);
    car.traverse((node) => {
      if (node instanceof T.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        for (const m of Array.isArray(node.material) ? node.material : [node.material]) {
          if (
            m instanceof T.MeshStandardMaterial &&
            (/paint|body|chassis/i.test(m.name) || /body|paint/i.test(node.name)) &&
            !/glass|wheel|tire|tyre|interior/i.test(m.name)
          )
            paintMaterials.push(m);
        }
      }
    });
    controls.enabled = !drive;
    reset();
    onProgress(100);
    return handle;
  } catch (e) {
    handle.dispose();
    throw e;
  }
}
