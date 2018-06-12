var BLOX = (function( module ) {
	
    /**
     *
     */
    module.Texture = function() {
		
		var border = this.border = 64;
		
		this.tileSize = 128;
		this.rawWidth = this.tileSize * 4 + border * 8;
		this.rawHeight = this.tileSize * 4 + border * 8;
		this.width = this.rawWidth;
		this.height = this.rawHeight;
		console.log( this.width, this.height );
		if ( !Math.isPowerOf2( this.width ) ) {
			this.width = Math.nearestUpperPowerOf2( this.width );
			this.height = this.width;
		}
		
		console.log( this.width, this.height );
		this.ready = 0;
		
		this.onReady = undefined;
		
		this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
		this.context.imageSmoothingEnabled = false;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
		
		var path = this.path = "img/textures/";
		var tileOffset = this.tileSize + border * 2;
		
		this.paths = {
			stone:     this.path + "stone/diffuse.png",
			dirt:      this.path + "dirt/diffuse.png",
			grassTop:  this.path + "grass-top/diffuse.png",
			grassSide: this.path + "grass-side/diffuse.png",
			woodSide:  this.path + "wood-side/diffuse.png",
			leaves:    this.path + "leaves/diffuse.png",
			sand:      this.path + "sand/diffuse.png",
			woodTop:   this.path + "wood-top/diffuse.png",
			water:     this.path + "water/diffuse.png",
		}
		
		this.images = Object.keys( this.paths ).length;
		this.diffuseTiles = {}
		
		var index = 0;
		var keys = Object.keys(this.paths);
		for ( index = 0; index < 16; index += 1 ) {
			
			var position = this.indexToTilePosition( index );
			var key = keys[index];
			
			if ( key !== undefined ) {
				
				this.addTile(
					this.paths[key],
					border+tileOffset*position.x,
					border+tileOffset*position.y+(this.width-this.rawWidth)
				);
				
			} else {
			
				this.addColor(
					0x444,
					border+tileOffset*position.x,
					border+tileOffset*position.y+(this.width-this.rawWidth)
				);
			
			}
			
		};
		
		
		this.diffuse = new THREE.Texture( this.canvas );
		this.diffuse.anisotropy = engine.renderer.capabilities.getMaxAnisotropy();
		this.diffuse.generateMipmaps = false;
		this.diffuse.magFilter = THREE.LinearFilter;
		if ( ENABLE_MIPMAPPING ) {
			this.diffuse.minFilter = THREE.LinearMipMapLinearFilter;
		} else {
			this.diffuse.minFilter = THREE.LinearFilter;
		}
        
    }
	
	module.Texture.prototype = {
	
		/**
		 *
		 */
		addTile: function( src, x, y ) {
		
			var image = new Image();
			
			image.onload = function() {
				
				var context = this.context,
					imageSize = image.width,
					border = this.border,
					tileSize = this.tileSize;
				
				if ( this.border > 0 ) {
					
					context.drawImage( image, 0, 0, 1, 1, x-border, y-border, tileSize, tileSize );
					context.drawImage( image, imageSize-1, 0, 1, 1, x+border, y-border, tileSize, tileSize );
					context.drawImage( image, 0, imageSize-1, 1, 1, x-border, y+border, tileSize, tileSize );
					
					context.drawImage( image, imageSize-1, imageSize-1, 1, 1, x+border, y+border, tileSize, tileSize );
					
					context.drawImage( image, 0, 0, 1, imageSize, x-border, y, tileSize, tileSize );
					context.drawImage( image, imageSize-1, 0, 1, imageSize, x+border, y, tileSize, tileSize );
					context.drawImage( image, 0, 0, imageSize, 1, x, 	    y-border, tileSize, tileSize );
					context.drawImage( image, 0, imageSize-1, imageSize, 1, x, 	    y+border, tileSize, tileSize );
				}
				
				context.clearRect( x, y, tileSize, tileSize );
				context.drawImage(
					image, 0, 0, imageSize, imageSize,
					x, y, tileSize, tileSize
				);
				
				this.ready += 1;
				if ( this.ready === this.images ) {
					
					if ( ENABLE_MIPMAPPING ) {
						
						this.generateMipmaps();
						
					}
					
					//
					module.Chunk.updateMeshWorker( {
						textureTileSize: this.tileSize,
						textureWidth: this.rawWidth,
						textureHeight: this.rawHeight,
						textureBorder: this.border,
						texturePadding: this.width
					} );
					
					//window.open(this.canvas.toDataURL("image/png"), "_blank" );
					
					this.diffuse.needsUpdate = true;
					
					if (this.onReady !== undefined) {
						this.onReady();
					}
				}
			}.bind(this);
			
			image.src = src;
			
			return image;
		
		},
		
		/**
		 *
		 */
		addColor: function( color, x, y ) {
			
			var context = this.context,
				border = this.border,
				tileSize = this.tileSize;
			
			context.fillStyle = "#444";
			context.fillRect(
				x-border, y-border,
				tileSize+border*2, tileSize+border*2
			);
		
		},
		
		/**
		 *
		 */
		generateMipmaps: function() {
		
			var size = Math.min( this.width, this.height );
			for ( var n = 0; size >= 1; size = size >> 1 ) {
				this.diffuse.mipmaps[ n++ ] = this.mipmap( size );
			}
		
		},
		
		/**
		 *
		 */
		mipmap: function( size ) {
		
			let imageCanvas = document.createElement( "canvas" ),
				context = imageCanvas.getContext( "2d" ),
				scale = size / this.height,
				offset = 1 - scale;;

			imageCanvas.width = imageCanvas.height = size;

			context.fillStyle = "#444";
			if ( size <= 4 ) {
				
				// size too small to repreent tiles accurately, use full rect
				context.fillRect( 0, 0, size, size );
				
			} else {
				
				// draw rects in the unused space, so it's not transparent
				const w = this.width,
					  h = this.height,
					  rw = this.rawWidth,
					  rh = this.rawHeight;
				
				context.fillRect( 0, 0, size, (h-rh)*scale );
				context.fillRect( size-(w-rw)*scale, 0, (w-rw)*scale, size );
				
			}
			
			// draw canvas at offsets to fix alpha bleeding
			if ( offset ) {
				context.drawImage( this.canvas, -offset, -offset, size, size );
				context.drawImage( this.canvas, offset, -offset, size, size );
				context.drawImage( this.canvas, offset, offset, size, size );
				context.drawImage( this.canvas, -offset, offset, size, size );
			}
			
			// draw canvas in it's actual place
			context.drawImage( this.canvas, 0, 0, size, size );
			
			//window.open(imageCanvas.toDataURL("image/png"), "_blank" );
			
			return imageCanvas;
		
		},
		
		/**
		 *
		 */
		indexToTilePosition: function( index ) {
		
			var y = Math.floor( index / TEXTURE_X_TILES ); 
			var x = index - ( y * TEXTURE_X_TILES );
			return { x: x, y: 3-y };
		
		}
		
	}

    return module;
}( BLOX || {} ));