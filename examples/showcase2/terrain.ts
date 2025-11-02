import { load } from "@three.ez/main";
import { Group, InstancedMesh, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// preload(GLTFLoader, "showcase2/300mthree.glb"); //?Preload no work anymore? 


export class Terrain extends Group {
  /**
   * Get all gpu node form blender model and add treee in theth position
   */
  public async generateTrees(treeNumber: number = 300_000): Promise<Vector3[]> {

   const gltf = await load(
      GLTFLoader, "showcase2/terrain-with-points.glb"
    );

    
    console.assert(!!gltf, "Terrain model not found in assets");
    console.assert(
      gltf.scene.children[0] instanceof Object3D,
      "Terrain model has no children"
    );
    
    const positions: Vector3[] = [];
    for (const instancedMesh of gltf.scene.querySelectorAll("[isInstancedMesh=true]").slice(0, treeNumber) as InstancedMesh[]) {
      const threeCoord = instancedMesh.getWorldPosition(new Vector3());
      instancedMesh.removeFromParent(); 
      positions.push(threeCoord);
    } 

    this.add(...gltf.scene.children);

    return positions;
  }
  
  //  public async generateTrees(count: number): Promise<Vector3[]> {
  //   const octaves = this.octaves;
  //   const chunkSize = this.chunkSize;
  //   const halfMaxChunksX = Math.trunc(this.maxChunksX / 2);
  //   const halfMaxChunksZ = Math.trunc(this.maxChunksZ / 2);

  //   const positions: Vector3[] = [];

  //   for (let i = 0; i < count; i++) {
  //     const x = this.randomRange(-halfMaxChunksX - 0.5, halfMaxChunksX - 0.5);
  //     const z = this.randomRange(-halfMaxChunksZ - 0.5, halfMaxChunksZ - 0.5);

  //     let amplitude = this.amplitude;
  //     let frequency = this.frequency;
  //     let noiseVal = 0;

  //     for (let o = 0; o < octaves; o++) {
  //       noiseVal += this.noiseCallback(x * chunkSize * frequency, z * chunkSize * frequency) * amplitude;
  //       amplitude *= this.gain;
  //       frequency *= this.lacunarity;
  //     }
  //     // if (noiseVal > -0.5 * this.amplitude && noiseVal < 0.5 * this.amplitude) {
  //     positions.push(new Vector3(x * chunkSize, noiseVal, z * chunkSize));
  //     // }
  //   }

  //   return positions;
  // } /*} */
}
