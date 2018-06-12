var BLOX = (function(module) {

	module.GUI = function() {
    
		//
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas = document.createElement( "canvas" );
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.context = this.canvas.getContext( "2d" );
		this.scene = new THREE.Scene();
		
		// HUD camera
		this.camera = new THREE.OrthographicCamera(
			-this.width/2, this.width/2, this.height/2, -this.height/2, 0, 30
		);
		
		// HUD texture
		this.texture = new THREE.Texture( this.canvas );
		var material = new THREE.MeshBasicMaterial( { map: this.texture } );
		this.texture.needsUpdate = true;
		this.texture.minFilter = THREE.NearestFilter;
		material.transparent = true;
		material.opacity = 1.0;
		
		//
		sprCrosshair = new Image(95, 95);
		sprCrosshair.src = "img/crosshair.png";
		sprCrosshair.onload = function() {
			this.draw();
		}.bind(this);
		
		// HUD geometry
		var planeGeometry = new THREE.PlaneGeometry( this.width, this.height );
		var plane = new THREE.Mesh( planeGeometry, material );
		this.scene.add( plane );
		
		//
		window.addEventListener( 'resize', function () {
			
			this.width = window.innerWidth;
			this.height = window.innerHeight;
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.draw();
			this.texture.needsUpdate = true;
			
		}.bind( this ) );
		
	}

	module.GUI.prototype = {

		/**
		 *
		 */
		draw: function() {
			var width = this.width;
			var height = this.height;
			this.context.clearRect(0, 0, width, height);
			this.context.drawImage(sprCrosshair, width/2-95/2, height/2-95/2);
			this.texture.needsUpdate = true;
		}
		
	}

	return module;
}(BLOX || {}));