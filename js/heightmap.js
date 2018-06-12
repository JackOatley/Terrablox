var BLOX = (function(module) {
    
    /**
     * The Heightmap object.
     * @constructor
     * @param {imageURL} src - Relative URL to image source file to use as the base of this heightmap.
     * @author JackOatley
     */
	module.Heightmap = function(args) {

		this.src = [];
		this.img = [];
		this.width = 0;
		this.height = 0;
		this.scale = 2;
		this.canvas = undefined;
		this.data = undefined;
		this.onImgReady = undefined;
		this.onDataReady = undefined;
		this.imagesLoaded = false;
		this.isDataReady = false;
        
        this.onImgReady = function() {
            this.getData();
        }

    }

    
	module.Heightmap.prototype = {
        
        /**
         *
         */
		addSource: function(src) {
		  this.src.push( src );
		  this.imagesLoaded = false;
		},
        
        /**
         * Forces the Heightmap to load the images from the paths set in it's src property (an array). When the images are loaded, either instantly from cache or asynchronously, the Heightmap will call it's onImgReady() function.
         */
        load: function() {
            
            this.img.length = 0;

            this.src.forEach( function( src ) {
                
                var n = this.img.push( new Image() ) - 1;
                this.img[n].src = src;
                
                if ( this.img[n].complete ) {
                    this.getImagesReady();
                } else {
                    var heightmap = this;
                    this.img[n].onload = function() {
                        console.log( "ONLOAD" );
                        heightmap.getImagesReady();
                    }
                }
                
            }.bind( this ) );

        },
        
        /**
         *
         */
        getImagesReady: function() {
            
            if ( this.img.length < this.src.length ) {
                return;
            }
        
            if ( !this.imagesLoaded ) {
                
                this.imagesLoaded = true;
                
				for (var n = 0; n < this.src.length; n++ ) {
					if ( !this.img[n].complete ) {
						return;
					}
				}
                
				this.onImgReady();
                
            }
        
        },

        /**
         *
         */
        getData: function() {
            
            console.group( "Heightmap.getData();" );
            
            var context, n;
            
            this.width = this.img[0].width;
            this.height = this.img[0].height;
            
            this.canvas = document.createElement( "canvas" );
            var context = this.canvas.getContext( "2d" );
            this.canvas.width = this.img[0].width;
            this.canvas.height = this.img[0].height;
            
            context.globalCompositeOperation = "source-over";
            context.drawImage(this.img[0], 0, 0);
            
            for ( n = 1; n < this.img.length; n++ ) {
                
                console.log( "drawing image " + n );
                var image = this.img[n];
                
                context.globalCompositeOperation = "multiply";
                context.drawImage( image, 0, 0, image.width, image.height,
                                          0, 0, this.width, this.height );
                
            }
            
			var data = context.getImageData(0, 0, this.width, this.height).data;
			var index,
				size = this.width * this.height,
				n = 0;
				
			this.data = [];
			for (index = 0; index < size; n += 4) {
				this.data[index++] = data[n];
			}

			this.isDataReady = true;

			// execute onDataReady function if it's been set
			if (typeof this.onDataReady === "function") {
				this.onDataReady();
			} else {
				console.log("Heightmap.onDataReady() function undefined!");
			}

			console.groupEnd();
            
		},


		/**
		 * Returns wheter the given position is on a slope.
		 */
		isSlope: function(x, y) {
            
			var data = this.data,
				width = this.width,
				height = this.height,
				scale = this.scale;
			
			var l0 = data[y*height+x] / scale,
				l1 = data[y*height+(x+1)] / scale,
				l2 = data[(y+1)*height+x] / scale,
				l3 = data[y*height+Math.max(0,x-1)] / scale,
				l4 = data[Math.max(0,y-1)*height+x] / scale;
            
			var max = Math.max(l0, l1, l2, l3, l4),
				min = Math.min(l0, l1, l2, l3, l4);
				
            return max - min > 1.5;
            
        },
		
		/**
         * Returns whether the given position is a beach/shoreline.
         */
        isBeach: function(x, z) {
            
			var data = this.data,
				width = this.width,
				height = this.height,
				scale = this.scale;
			
			var l0 = data[x+z*height] / scale;
				l1 = data[Math.min(width-1,x+1)+z*height] / scale;
				l2 = data[x+Math.min(height-1+(z+1))*height] / scale;
				l3 = data[Math.max(0,x-1)+z*height] / scale;
				l4 = data[x+Math.max(0,z-1)*height] / scale;
            
            return l0 < 3
				|| l1 < 3
				|| l2 < 3
				|| l3 < 3
				|| l4 < 3;
            
        },
		
		/**
		 *
		 */
		renderDiffuse: function() {
			
			var canvas = document.createElement("canvas"),
				context = canvas.getContext("2d"),
				width = canvas.width = this.width,
				height = canvas.height = this.height;
			
			var imageData = context.createImageData(width, height);
			var size = width * height;
			for (index = 0; index < size;) {
				
				value = this.data[index];
				
				var x = index - Math.floor(index / width) * width;
				var y = Math.floor(index / width);
				
				var color = 0x000000;

				if (value <= this.scale) { color = 0x11539E; }
				else if (this.isBeach(x, y)) { color = 0xD6D29C; }
				else if (this.isSlope(x, y)) { color = 0xD3D3D3; }
				else if (value > 0) { color = 0x51BC51; }
				
				this.imageDataPutPixel(imageData, index, color);
				index++;
				
			}
			
			context.putImageData(imageData, 0, 0);
			
			return canvas;
			
		},
		
		/**
		 *
		 */
		renderShadow: function() {
			
			var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var width = canvas.width = this.width;
            var height = canvas.height = this.height;
			
			var imageData = context.createImageData(width, height);
			var size = width * height;
			for (index = 0; index < size;) {
				
				value = this.data[index];
				
				var x = index - Math.floor(index / width) * width;
				var y = Math.floor(index / width);
				
				var color = 0xFFFFFF;
				
				var startHeight = this.data[index];
				if (this.data[(x-3)+((y-3)*height)] > startHeight) {
					var color = 0x111111;
				}
				
				this.imageDataPutPixel(imageData, index, color);
				index++;
				
			}
			
			context.putImageData(imageData, 0, 0);
			
			return canvas;
			
		},
		
		/**
		 *
		 */
		imageDataPutPixel: function(imageData, index, color) {
		
			imageData.data[index*4+0] = (color >> 16) & 0xFF;
			imageData.data[index*4+1] = (color >> 8) & 0xFF;;
			imageData.data[index*4+2] = (color) & 0xFF;;
			imageData.data[index*4+3] = 255;
			
		}
        
    }
    
	return module;
}( BLOX || {} ));
 