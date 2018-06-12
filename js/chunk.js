var BLOX = ( function( module ) {

    //
    var _id = 0;
    var _instances = [];

    /**
     * A chunk
     * @constructor
     * @property {number} id - The unique id for this chunk.
     * @property {object} position - The x, y, z position of this chunk in actual 3d space. This is the same as {worldPosition} * {size}, as such it is set automatically when the chunk is created.
     *  @property {number} position.x - X position.
     *  @property {number} position.y - Y position.
     *  @property {number} position.z - Z position.
     * @property {object} worldPosition - The x, y, z position of this chunk in the world. These will be the values provided when the chunk was created.
     *  @property {number} worldPosition.x - X position.
     *  @property {number} worldPosition.y - Y position.
     *  @property {number} worldPosition.z - Z position.
     *  @property {array} voxels - An array of all the voxels in this chunk.
     *  @property {object} geometry - THREE.BufferGeometry.
     *  @property {object} material - THREE.MeshPhongMaterial.
     */ 
	module.Chunk = function( args ) {

		var args = args || {},
			x = args.x || 0,
			y = args.y || 0,
			z = args.z || 0,
			material = args.material;
	
		this.id = _id++;
		_instances.push(this);
        
		this.position = new THREE.Vector3( x, y, z );
		this.position.x *= CHUNK_WIDTH;
		this.position.y *= CHUNK_HEIGHT;
		this.position.z *= CHUNK_DEPTH;
		this.worldPosition = new THREE.Vector3( x, y, z );
		
		this.visibleVoxels = [];
		this.stackHeightsMin = [];
		this.stackHeightsMax = [];
		this.voxelBuffer = new Uint8Array(VOXEL_BUFFER_SIZE).fill(NULL_VOXEL);

		this.geometry = new THREE.BufferGeometry();
		this.material = material;
		this.mesh = undefined;

    }


    
	module.Chunk.prototype = {
        
		/**
		 *
		 */
        fillFromHeightmap: function( heightmap ) {
			
			var cx, cz, mcx, mcz, length,
				width = heightmap.width,
				height = heightmap.height,
				x = this.worldPosition.x,
				y = this.worldPosition.y,
				z = this.worldPosition.z;

			for ( cx = 0; cx < CHUNK_WIDTH_B; cx++ )
			for ( cz = 0; cz < CHUNK_DEPTH_B; cz++ ) {
                
                mcx = Math.clamp( x*CHUNK_WIDTH+cx, 0, width-2 );
                mcz = Math.clamp( z*CHUNK_DEPTH+cz, 0, height-2 );
                
				length = ~~(heightmap.data[mcx+mcz*height] / HEIGHTMAP_SCALE);
                
                var clipLength = length - y * CHUNK_HEIGHT;
                clip = Math.min( clipLength, CHUNK_HEIGHT_B );
                
				if ( length > 0 ) {
					
					isSlope = heightmap.isSlope( mcx, mcz );
					isBeach = heightmap.isBeach( mcx, mcz );
                    
					if (isSlope || (clip+y*CHUNK_HEIGHT < length)) {
						this.fillColumn( cx, 0, cz, clip, 0 );
					}
					
					else if (isBeach) {
						this.fillColumn( cx, 0, cz, clip, 6 );
					}
					
					else {
                        this.fillColumn( cx, 0, cz, clip-2, 0 );
                        this.addVoxel( cx, Math.max(0, clip-2), cz, 3 );
                        this.addVoxel( cx, Math.max(0, clip-1), cz, 2 );
                    }
                    
                }
                
                var index = cx + cz * CHUNK_WIDTH_B;
                this.stackHeightsMin[index] = Math.max(0, clip);
                this.stackHeightsMax[index] = Math.max(0, clip);
				
				//this.fillColumnNoOverwrite( cx, 0, cz, 10, 7 );
                
            }

        },


        /**
         * Add a single new voxel to the chunk at the given x, y, z coords
         * @param {number} x - The X position in chunk to place the voxel.
         * @param {number} y - The Y position in chunk to place the voxel.
         * @param {number} z - The Z position in chunk to place the voxel.
         */ 
        addVoxel: function( x, y, z, t ) {
            
			var index = PointToLinearIndex(x, y, z) * DATA_OFFSET_MAX
				pos = x + z * CHUNK_WIDTH_B;
            
            this.voxelBuffer[index] = t;
			
			this.stackHeightsMin[pos] = Math.min(this.stackHeightsMin[pos], y);
            this.stackHeightsMax[pos] = Math.max(this.stackHeightsMax[pos], y+1);
            
        },

        /**
         * Return the value of the voxel at the given position.
         * @param {number} x - The X position in chunk to find the voxel.
         * @param {number} y - The Y position in chunk to find the voxel.
         * @param {number} z - The Z position in chunk to find the voxel.
         */ 
        getVoxel: function( x, y, z ) {
            
            var index = PointToLinearIndex( x, y, z ) * DATA_OFFSET_MAX;
            return this.voxelBuffer[ index ];
            
        },

        /**
         * Applies a model at the given position inside the chunk. TOD: Currently doesn't correctly handle edge wrapping into neighbouring chunks.
         * @param {number} x - The X position in chunk to place the model.
         * @param {number} y - The Y position in chunk to place the model.
         * @param {number} z - The Z position in chunk to place the model.
         * @param {Model} model - The Model to be placed.
         */ 
        applyModel: function( x, y, z, model ) {

            var chunk = this;
            
            x += this.position.x;
            y += this.position.y;
            z += this.position.z;
            
            model.model.model.forEach( function( voxel ) {
                
                chunk = Chunk.find(
                    Math.floor((x+voxel.x)/32),
                    0,
                    Math.floor((z+voxel.z)/32)
                );
                
                if ( chunk !== undefined ) {
                
                    chunk.addVoxel(
                        (x+voxel.x)-chunk.position.x,
                        (y+voxel.z)-chunk.position.y,
                        (z+voxel.y)-chunk.position.z,
                        voxel.type
                    );
                }
                
            });

        },

        /**
         * Fill a chunk from the bottom up to maxY
         * @param {number} maxY - The Y position to fill up to.
         */ 
        fillY: function( maxY, type ) {
            
			console.log( "filling" );
            this.fillBox( 0, 0, 0, CHUNK_WIDTH, maxY, CHUNK_DEPTH, type );
			
        },

        /**
         * Fill a column in a chunk at the given x, y, z.
         * @param {number} x - X position of column.
         * @param {number} y - Y position of column.
         * @param {number} z - Z position of column.
         * @param {number} length - The length of the column up from y.
         */ 
        fillColumn: function( x, y, z, length, type ) {
            
            var index = PointToLinearIndex( x, y, z ) * DATA_OFFSET_MAX;
			
            for ( var n = 0; n < length; n++ ) {
                this.voxelBuffer[ index++ ] = type;
            }
            
        },
		
		/**
		 *
		 */
		fillColumnNoOverwrite: function( x, y, z, length, type ) {
            
            var index = PointToLinearIndex( x, y, z ) * DATA_OFFSET_MAX;
			
            for ( var n = 0; n < length; n++ ) {
                if ( this.getVoxel( x, y+n, z ) === NULL_VOXEL ) {
				
					this.addVoxel( x, y+n, z, type );
				
				}
            }
            
        },

		/**
         * Fill a cubiod area in the chunk with voxels.
         * @param {number} x - The X position in chunk to start the cubiod.
         * @param {number} y - The Y position in chunk to start the cubiod.
         * @param {number} z - The Z position in chunk to start the cubiod.
         * @param {number} sx - The X-axis length of the cubiod (width).
         * @param {number} sy - The Y-axis length of the cubiod (height).
         * @param {number} sz - The Z-axis length of the cubiod (depth).
         */ 
		fillBox: function( x, y, z, sx, sy, sz, type ) {

			var ux, uy, uz;
			for (uy = y; uy < y+sy; uy++)
			for (uz = z; uz < z+sz; uz++)
			for (ux = x; ux < x+sx; ux++) {
				this.addVoxel( ux, uy, uz, type );
			}

		},


        /**
         *
         */
        updateCulling: function() {
			
			//
			this.visibleVoxels = [];
            
            // build message
            var message = {
				chunkID: this.id,
				worldPosition: this.worldPosition,
				voxelMap: this.voxelBuffer.buffer,
				stackHeightsMin: this.stackHeightsMin,
				stackHeightsMax: this.stackHeightsMax,
				timestamp: new Date().getTime() 
            }
            
            // transferring these items
            var transfer = [
              this.voxelBuffer.buffer
            ]
                
            // send message
            module.Chunk.cullingWorker.postMessage( message, transfer );

        },


        /**
         * Sends the chunk to the web worker that handles meshing. A message is created containing the chunk's id and the array of visible voxels. The id is used to determine what chunk should receive the data when the web worker sends a message back.
         */
        updateMesh: function() {
            
            //
            this.visibleVoxels = new Int8Array(this.visibleVoxels);
            
            // build message
            var message = {
                chunkID: this.id,
                voxels: this.visibleVoxels.buffer,
                visibleFaces: this.visibleFaces }
                
            //
            var transfer = [
                this.visibleVoxels.buffer ]
                
            // send message
            module.Chunk.meshWorker.postMessage( message, transfer );
            
        },


        /**
         * Set this chunk to display as a wireframe when passed true, or as a solid model when passed false.
         */
        wireframe: function( enable ) {
            
            this.mesh.material.wireframe = enable;
            
        }
        
    }


    /**
     *
     */
	module.Chunk.startWorkerManager = function() {
        
		// initialize workers
		console.log( "initializing workers..." );
		module.Chunk.cullingWorker = new Worker( "js/workers/updateCulling.js" );
		module.Chunk.meshWorker    = new Worker( "js/workers/updateMesh.js" );
        
		// culling worker return message
		module.Chunk.cullingWorker.onmessage = function(event) {
            
			event.data.forEach( function( data ) {

				var chunk = module.Chunk.get( data.chunkID );
				chunk.visibleVoxels = data.visibleVoxels;
				chunk.visibleFaces  = data.visibleFaces;
				chunk.voxelBuffer = new Uint8Array(data.voxelMap);
				chunk.updateMesh();

			} );

		}

        // mesh worker return message
        module.Chunk.meshWorker.onmessage = function( event ) {
            
            //
			var chunk, vertices, coords, normals, colors;
			
			event.data.forEach( function( data ) {

				// get chunk object from returned id and give it's stuff back
				chunk = module.Chunk.get( data.chunkID );

				// create typed views on the returned ArrayBuffers
				vertices = new Float32Array( data.vertices );
				coords   = new Float32Array( data.coords );
				normals  = new Float32Array( data.normals );
				
				// create new attributes from the buffers
				vertices = new THREE.BufferAttribute( vertices, 3 );
				coords   = new THREE.BufferAttribute( coords,   2 );
				normals  = new THREE.BufferAttribute( normals,  3 );
				
				// add those attributes to the geometry
				chunk.geometry.addAttribute( "position", vertices );
				chunk.geometry.addAttribute( "uv", coords );
				chunk.geometry.addAttribute( "normal", normals );
				
				if ( ENABLE_VAO ) {
				
					colors = new Float32Array( data.colors );
					colors = new THREE.BufferAttribute( colors, 3 );
					chunk.geometry.addAttribute( "color", colors );
				
				}
				
				// remove old mesh from scene
				if ( chunk.mesh !== undefined ) {
					engine.scene.remove( chunk.mesh );
				}

				// create a mesh from the geometry
				chunk.mesh = new THREE.Mesh(chunk.geometry, chunk.material);
				chunk.mesh.position.copy(chunk.position);
				chunk.mesh.castShadow = true;
				chunk.mesh.receiveShadow = true;

				// finally, add the mesh to the scene
				engine.scene.add(chunk.mesh);

                // helper
                //var helper = new THREE.BoxHelper(chunk.mesh);
                //scene.add(helper);
                
            });
            
        }
        
    }

    /**
     *
     */
	module.Chunk.updateWorkerManager = function( args ) {
        
		args.setup = true;
		module.Chunk.cullingWorker.postMessage( args );
        
    }
	
	/**
     *
     */
	module.Chunk.updateMeshWorker = function( args ) {
        
		args.setup = true;
		module.Chunk.meshWorker.postMessage( args );
        
    }
     
    /**
     * Find and return the chunk at the given x, y, z position in world coordinates.
     * @example
     * var cx = chunk.x;
     * var cy = chunk.y;
     * var cz = chunk.z;
     * var neighbor = Chunk.find( cx+1, cy, cz); 
     * @returns {Chunk} Returns a Chunk object or undefined.
     */
	module.Chunk.find = function( x, y, z ) {
		
		for ( let n = 0; n < _instances.length; ) {
		
			let chunk = _instances[n++];
			
			if (chunk.worldPosition.x === x
			&&  chunk.worldPosition.y === y
			&&  chunk.worldPosition.z === z) {
			
				return chunk;
			
			}
		
		}
		
		return undefined;
		
	}

	/**
	 * Returns the chunk with the given id.
	 * @returns {Chunk} Returns a Chunk object or undefined.
	 */
	module.Chunk.get = function( id ) {
        
		for ( let n = 0; n < _instances.length; ) {
        
            let chunk = _instances[n++];
			
			if ( chunk.id === id ) {
				
				return chunk;
				
			}
        
		}

	}

	/**
	 *
	 */
	module.Chunk.updateCulling = function() {
        
		console.group( "Chunk.updateCulling()" );
        
		let date = new Date();
        
		_instances.forEach( function( chunk ) {
			
			chunk.updateCulling();
			
		} );
        
		//
		console.log("Requested " + _instances.length + " chunks");
		console.log("Completed in: " + (new Date() - date) + "ms");
		console.groupEnd();
        
	}

	/**
	 * Sets whether to display chunks as solid models or wireframe. This applys to all chunks.
	 * @param {boolean} enable - Enable wireframe.
	 */
	module.Chunk.wireframe = function( enable ) {
        
		_instances.forEach( function( chunk ) {
			
			chunk.wireframe( enable );
			
		} );
        
    }

     return module;
}( BLOX || {} ) );