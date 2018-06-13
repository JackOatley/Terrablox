var BLOX = ( function( module ) {
    
    /**
     * A world is a container for chunks. A world can be constructed from a heightmap, in that case it's width and height are the dimensions of the heightmap divided by the size of chunks as set in the constants.js file.
     * @constructor
     */ 
	module.World = function() {
        
		this.finite = true;
		this.bitmap = undefined;
		this.width  = 0;
		this.depth  = 0;
		this.height = 0;
		this.vWidth = this.width * CHUNK_WIDTH;
		this.vHeight = this.height * CHUNK_HEIGHT;
		this.vDepth = this.depth * CHUNK_DEPTH;
		this.chunks = [];
		
		this.material = new THREE.MeshPhongMaterial( {
			transparent: false,
			alphaTest: 0.9,
			vertexColors: ENABLE_VAO ? THREE.VertexColors : THREE.NoColors,
			map: texture.diffuse,
			//specularMap: texture.specular,
			//bumpMap: testBump,
			//bumpScale: 0.005,
			//normalMap: testNormal,
			//normalScale: new THREE.Vector2( 1, 1 ),
			color: 0xffffff,
			specular: 0xffffff,
			shininess: 5
		});
		
		console.log(this.material);

    }
    
	module.World.prototype = {
    
        /**
         * Pass an image source directly into the world, the world will do all the work of creating the heightmap, and generating chunk from it, for you.
         * @param {imageSource} image - The heightmap image to build the world from.
         */
		generateFromHeightmapImage: function( image ) {
        
			var heightmap = new module.Heightmap({
			  src: image
			});
            
			heightmap.onDataReady = function() {
              this.generateFromHeightmap( heightmap );
			}.bind( this );
            
			heightmap.load();
        
		},

        /**
         * Create chunks and populate them with voxels based on an already created heightmap Heightmap.
         * @param {Heightmap} heightmap - The heightmap to build the world from.
         */
        generateFromHeightmap: function( heightmap ) {
            
            var generate = function() {
                
				console.log( "heightmap ready! loading..." );

				this.heightmap = heightmap;
				this.width     = Math.floor( heightmap.width  / CHUNK_WIDTH );
				this.depth     = Math.floor( heightmap.height / CHUNK_DEPTH );
				this.height    = WORLD_HEIGHT / CHUNK_HEIGHT;
				this.vWidth = this.width * CHUNK_WIDTH;
				this.vHeight = this.height * CHUNK_HEIGHT;
				this.vDepth = this.depth * CHUNK_DEPTH;
				
				//
				this.addWaterPlane();
				
				//
				module.Chunk.updateWorkerManager( {
					worldWidth: this.width * CHUNK_WIDTH,
					worldDepth: this.depth * CHUNK_DEPTH
				} );
				
				//
				console.log( "creating chunks..." );
				var date = new Date();
				var chunk, x, z, y;
				for ( x = 0; x < this.width; x++ )
				for ( z = 0; z < this.depth; z++ )
				for ( y = 0; y < this.height; y++ ) {
					
					chunk = this.addChunk( x, y, z );
					chunk.fillFromHeightmap( heightmap );
					
				}
				console.log( "Completed in: " + (new Date() - date) + "ms" );
				
				//
				this.generateTrees(
				  Math.floor((this.width * CHUNK_WIDTH)
				  * (this.depth * CHUNK_DEPTH) / 50)
				);
				
				//
				BLOX.Chunk.updateCulling();
				
				console.log( "done!" );
				
			}.bind( this );
			
			
			var startIfReady = function() {
				
				if ( heightmap.isDataReady && BLOX.Model.isLoaded( "all" ) ) {
					
					console.log( "generating..." );
					generate();
					
				} else {
					
					console.log( "wating..." );
					setTimeout( startIfReady, 1 );
					
				}
				
			}.bind( this );
			
			startIfReady();
			heightmap.load();
			
			console.groupEnd();

		},

		/**
		 * Add a new chunk to the world.
		 * @param {number} x - The X position of the chunk in world coords.
		 * @param {number} y - The Y position of the chunk in world coords.
		 * @param {number} z - The Z position of the chunk in world coords.
		 */ 
		addChunk: function( x, y, z ) {
            
			var chunk = new BLOX.Chunk( {
				x: x,
				y: y,
				z: z,
				material: this.material
			} );
			
			this.chunks.push( chunk );
			
			return chunk;
			
		},

		/**
		 * Get a voxel in world space. This is not the fastest way to get a voxel, but it is probably the easiest. The reason it's not the fastest is because, internally, this method has to find the chunk for the given position and then set the voxel inside that chunk. This is more an ease of use method. This method returns 255 (null voxel type) if the provided position is not valid.
		 * @param {number} x - The X position in the world.
		 * @param {number} y - The Y position in the world.
		 * @param {number} z - The Z position in the world.
		 */
		getVoxel: function( x, y, z ) {

            // find chunk
			var chunk = BLOX.Chunk.find(
				~~(x / CHUNK_WIDTH),
				~~(y / CHUNK_HEIGHT),
				~~(z / CHUNK_DEPTH)
			);
            
			// if the chunk exists, get the voxel in it
			// else return default 255
			if ( chunk !== undefined ) {
                
				var voxel = chunk.getVoxel(
					x - chunk.position.x + 1,
					y - chunk.position.y + 1,
					z - chunk.position.z + 1
				);
				
				return voxel;
                
			} else {

				return NULL_VOXEL;

			}

		},

		/**
		 * Set a voxel in world space. This is not the fastest way to set a voxel, but it is probably the easiest. The reason it's not the fastest is because, internally, this method has to find the chunk for the given position and then set the voxel inside that chunk. This is more an ease of use method.
		 * @param {number} x - The X position in the world.
		 * @param {number} y - The Y position in the world.
		 * @param {number} z - The Z position in the world.
		 * @param {type} type - The type of voxel to create.
		 */
		setVoxel: function( x, y, z, type ) {

            // find chunk
            var chunk = BLOX.Chunk.find(
				~~(x / CHUNK_WIDTH),
				~~(y / CHUNK_HEIGHT),
				~~(z / CHUNK_DEPTH)
            );
            
            // if the chunk exists, set the voxel in it
            if ( chunk !== undefined ) {
                
                chunk.addVoxel(
				  x - chunk.position.x + 1,
				  y - chunk.position.y + 1,
				  z - chunk.position.z + 1,
				  type
                );
                
            } else {
			
				console.warn(
					"tried to set voxel in non-existant chunk!",
					x, y, z, type
				);
			
			}

		},

        /**
         * Apply a model at the given world position.
         * @param {number} x - The X position in the world.
         * @param {number} y - The Y position in the world.
         * @param {number} z - The Z position in the world.
         * @param {object} model - The model to apply.
         */ 
        applyModel: function( x, y, z, model ) {
			
			model.model.model.forEach( function( voxel ) {

				let wx = x + voxel.x,
					wy = y + voxel.z,
					wz = z + voxel.y;
				
				if ( wx >= 0
				&&   wy >= 0
				&&   wz >= 0
				&&   wx < this.vWidth
				&&   wy < this.vHeight
				&&   wz < this.vDepth ) {
					
					this.setVoxel( wx, wy, wz, voxel.type );
					
				}

            }.bind(this));

        },

		/**
		 * Fill the world with chunks from, 0, 0, 0 to sx, sy, sz.
		 * This is generally used once at the start if the world is of a finite size.
		 * @param {number} sx - The X-axis length of the world in chunks.
		 * @param {number} sy - The Y-axis length of the world in chunks.
		 * @param {number} sz - The Z-axis length of the world in chunks.
		 */ 
		fill: function( sx, sy, sz ) {

			let x, y, z;
			for ( y = 0; y < sy; y++ )
			for ( z = 0; z < sz; z++ )
			for ( x = 0; x < sx; x++ ) {

				this.addChunk( x, y, z );

            }

        },
        
        /**
         *
         */
        generateTrees: function( number ) {
            
			console.log( "spawning trees..." );
            
			let date = new Date(),
				n, x, y, i, height, index;
            
			for ( n=0; n<number; n++ ) {
                
				x = Math.floor( Math.random() * this.width * CHUNK_WIDTH ),
				z = Math.floor( Math.random() * this.depth * CHUNK_DEPTH );
                
				index = x + z * this.heightmap.height;
                height = ~~(this.heightmap.data[index] / HEIGHTMAP_SCALE);
                
                if ( height > 0 && height < 20
                && this.getVoxel( x+1, height-2, z+1 ) === 2 ) {
					i = Math.round(Math.random()*(treeModel.length-1));
                    this.applyModel( x, height-1, z, treeModel[i] );
				}
                
			}
            
            console.log( new Date() - date + "ms" );
            
        },
		
		/**
		 *
		 */
		addWaterPlane: function() {
			
			var width = this.width * CHUNK_WIDTH,
				depth = this.depth * CHUNK_DEPTH;
		
			var geometry = new THREE.PlaneGeometry( width, depth );
    
			var loader = new THREE.TextureLoader();
			
			var path = "img/textures/water/diffuse.png";
			var texture = loader.load( path, function( texture ) {
				
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.offset.set( 0, 0 );
				texture.repeat.set( width, depth );
				
			} );
	
			var material = new THREE.MeshPhongMaterial( {
				map: texture,
				color: 0xffffff,
				specular: 0xffffff,
				shininess: 10,
				transparent: false,
				opacity: 1.0
			} );
			
			var plane = new THREE.Mesh( geometry, material );
			plane.receiveShadow = true;
			plane.position.x = width / 2;
			plane.position.y = 0;
			plane.position.z = depth / 2;
			plane.rotateX( -90 * Math.PI / 180 );
			
			engine.scene.add(plane);
		}
        
	}

	return module;
}( BLOX || {} ));