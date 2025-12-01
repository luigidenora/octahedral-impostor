import { get, preload } from '@three.ez/main';
import { Group, InstancedMesh, Object3D, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const terrainModelGLB = 'showcase2/terrain-with-points.glb';
preload(GLTFLoader, terrainModelGLB);

export class Terrain extends Group {
  /**
   * Get all gpu node form blender model and add treee in theth position
   */
  public async generateTrees(treeNumber: number = 300_000): Promise<Vector3[]> {
    const gltf = get<GLTF>(terrainModelGLB);

    console.assert(!!gltf, 'Terrain model not found in assets');
    console.assert(
      gltf.scene.children[0] instanceof Object3D,
      'Terrain model has no children'
    );

    const positions: Vector3[] = [];
    for (const instancedMesh of gltf.scene
      .querySelectorAll(`[name^=GN_Instance]`)
      .slice(0, treeNumber) as InstancedMesh[]) {
      const threeCoord = instancedMesh.getWorldPosition(new Vector3());
      instancedMesh.removeFromParent();
      positions.push(threeCoord);
    }

    this.add(...gltf.scene.children);

    return positions;
  }
}
