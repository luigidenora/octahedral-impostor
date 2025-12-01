import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import {
  get,
  loadPending,
  Main,
  PerspectiveCameraAuto,
  preload
} from '@three.ez/main';
import { simplifyGeometryByError } from '@three.ez/simplify-geometry';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  Scene,
  Vector3
} from 'three';
import { GLTF, GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import { OctahedralImpostor } from '../../src/core/octahedralImpostor.js';
import { Terrain } from './terrain.js';

const pineModelPath = 'showcase2/spruce_tree.glb';
const terrainModelPath = 'showcase2/terrain-with-points.glb';
preload(GLTFLoader, pineModelPath, terrainModelPath);

const fogColor = 0xaec1c7;
const camera = new PerspectiveCameraAuto(50, 0.1, 1200).translateY(5);
const scene = new Scene();
const main = new Main({
  showStats: true,
  rendererParameters: { antialias: false }
}); // init renderer and other stuff

main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.7;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(500, 0, 0);
controls.update();

main.renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio));

loadPending({
  onProgress: (ratio) => {
    setLoadingProgress(ratio * 100);
  }
}).then(async () => {
  const gltf = get<GLTF>(pineModelPath);
  const mesh = gltf.scene.children[0].children[0].children[0].children[0].children[0] as Mesh<
    BufferGeometry,
    MeshStandardMaterial
  >;

  // mesh.material.transparent = false;
  // mesh.material.depthWrite = true;

  scene.background = new Color(fogColor);

  const directionalLight = new DirectionalLight('white', 1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.left = -450;
  directionalLight.shadow.camera.right = 450;
  directionalLight.shadow.camera.top = 450;
  directionalLight.shadow.camera.bottom = -450;
  directionalLight.shadow.camera.far = 5000;
  directionalLight.shadow.camera.updateProjectionMatrix();

  scene.add(directionalLight, directionalLight.target);

  const sunOffset = new Vector3(1, 1, 0).normalize().multiplyScalar(1000);
  directionalLight.on('animate', (e) => {
    directionalLight.position.copy(camera.position).add(sunOffset);
    directionalLight.target.position.copy(camera.position).sub(sunOffset);
  });

  const ambientLight = new AmbientLight('white', 2);
  scene.add(ambientLight);

  scene.fog = new FogExp2(fogColor, 0.002);

  // TERRAIN
  const terrain = new Terrain();
  terrain.renderOrder = -1; // this can be based on camera rotation
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);

  // TREES AND IMPOSTORS

  const pos = await terrain.generateTrees();

  const iMesh = new InstancedMesh2(mesh.geometry, mesh.material, {
    renderer: main.renderer,
    capacity: pos.length
  });

  mesh.material.metalness = 0;
  mesh.material.roughness = 1;
  mesh.material.alphaTest = 0.55;

  iMesh.addInstances(pos.length, (obj, index) => {
    obj.position.copy(pos[index]);
    obj
      .rotateY(Math.random() * Math.PI * 2)
      .rotateX(Math.random() * 0.5 - 0.25);
    obj.scale.setScalar(Math.random() * 0.0001);
  });

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    alphaClamp: 0.5,
    spritesPerSide: 16,
    textureSize: 4096,
    baseType: MeshLambertMaterial
  });

  const LODGeo = await simplifyGeometryByError(mesh.geometry, 0.03);
  iMesh.addLOD(LODGeo, mesh.material, 5);
  iMesh.addLOD(impostor.geometry, impostor.material, 20);
  iMesh.addShadowLOD(new BoxGeometry(3, 10, 3));
  iMesh.computeBVH();

  scene.add(iMesh);

  main.createView({ scene, camera, enabled: false });
  document.getElementById('loading').remove();

  document.getElementById('info').style.display = 'block';
});

function setLoadingProgress(pct: number): void {
  const clamped = Math.max(0, Math.min(100, pct));
  const pb = document.getElementById('progress-bar') as HTMLDivElement | null;
  if (pb) pb.style.width = `${clamped}%`;
}
