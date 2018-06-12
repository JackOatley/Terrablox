var BLOX = ( function( module ) {
	
	/**
	 * @constructor
	 */
	module.Target = function() {
		
		this.position = new THREE.Vector3(0, 0, 0);
		this.vector = new THREE.Vector3(0, 0, 0);
		this.distance = 1000;
		this.includes = [];
		this.length = 0;
		this.openVoxel = new THREE.Vector3(-1, -1, -1);
		this.targetVoxel = new THREE.Vector3(-1, -1, -1);
		this.hasTarget = false;
		
		var cube = new THREE.CubeGeometry(1.01, 1.01, 1.01);
		var mat = new THREE.MeshBasicMaterial();
		mat.depthTest = true;
		mat.polygonOffset = true;
		mat.polygonOffsetFactor = -1;
		mat.polygonOffsetUnits = 1;
		mat.wireframe = true;
		mat.color.setRGB( 0, 0, 0 );
		this.mesh = new THREE.Mesh(cube, mat);
		engine.scene.add(this.mesh);
		
	}
	
	module.Target.prototype = {
	
		/**
		 *
		 */
		update: function(position, vector) {
			
			this.position = position = position || this.position;
			this.vector = vector = vector || this.vector;
			
			var base = position.clone().floor();
			var step = vector.clone();
			step.x = Math.sign(step.x);
			step.y = Math.sign(step.y);
			step.z = Math.sign(step.z);
			
			let tMaxX, tMaxY, tMaxZ, tDeltaX, tDeltaY, tDeltaZ;

			if ( vector.x !== 0 ) {
				tMaxX = ((base.x + (step.x>0)) - position.x) / vector.x;
				tDeltaX = step.x / vector.x;
			} else {
				tMaxX = -1;
				tDeltaX = 1;
			}
				
			if ( vector.y !== 0 ) {
				tMaxY = ((base.y + (step.y > 0)) - position.y) / vector.y;
				tDeltaY = step.y / vector.y;
			} else {
				tMaxY = -1;
				tDeltaY = 1;
			}
				
			if ( vector.z !== 0 ) {
				tMaxZ = ((base.z + (step.z > 0)) - position.z) / vector.z;
				tDeltaZ = step.z / vector.z;
			} else {
				tMaxZ = -1;
				tDeltaZ = 1;
			}
			
			// Iteration
			this.openVoxel.set( base.x, base.y, base.z );
			this.hasTarget = false;
			this.length = 0;
			while (this.length++ < this.distance) {
				
				// Get the current voxel
				voxel = world.getVoxel( base.x, base.y, base.z );
				
				if ( voxel !== NULL_VOXEL && voxel !== undefined ) {
					
					this.targetVoxel.set( base.x, base.y, base.z );
					this.hasTarget = true;
					
					break;
					
				} else {
					this.openVoxel.set(base.x, base.y, base.z);
				}
					
				if (tMaxX < tMaxY) {
					if (tMaxX < tMaxZ) {
						base.x += step.x;
						tMaxX += tDeltaX;
					} else {
						base.z += step.z;
						tMaxZ += tDeltaZ;
					}
				} else {
					if (tMaxY < tMaxZ) {
						base.y += step.y;
						tMaxY += tDeltaY;
					} else {
						base.z += step.z;
						tMaxZ += tDeltaZ;
					}
				}
			}
			
			// move the selection mesh
			if (this.hasTarget) {
				this.mesh.visible = true;
				this.mesh.position.set(base.x+0.5, base.y+0.5, base.z+0.5);
			} else {
				this.mesh.visible = false;
			}
		
		}
	
	}

	return module;
}(BLOX || {}));