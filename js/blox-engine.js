var BLOX = ( function( module ) {

	/**
	 * @constructor
	 */
	module.Engine = function() {
	
		this.renderer = new THREE.WebGLRenderer( {
			antialias: true
		} );
		
		this.renderer.preserveDrawingBuffer = true;
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.autoClear = false;
		document.body.appendChild( this.renderer.domElement );
		
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;
		
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xBCECFF);
		this.scene.fog = new THREE.Fog( 0xBCECFF, 50, 1024 );
		
		//
		window.addEventListener( 'resize', function () {
			
			this.renderer.setSize( window.innerWidth, window.innerHeight );
			
		}.bind( this ) );
		
		//
		this.updateList = [];
		this.renderList = [];
		this.loop();
	
	}
	
	
	module.Engine.prototype = {
		
		/**
		 *
		 */
		loop: function() {
    
			let fps = 0,
				dt = 0,
				last = 0,
				timestep = 1000 / 60;

			var main = function( timestamp ) {
				
				requestAnimationFrame( main );
				
				fps = 1000 / (timestamp - last);
				dt = (timestamp - last) / timestep;
				last = timestamp;
				
				this.update( dt );
				this.render();
				
				input.reset();
				
				this.renderer.clear();
				this.renderer.render(this.scene, camera.sceneCamera);
				this.renderer.render(gui.scene, gui.camera);
				
			}.bind( this );
			
			requestAnimationFrame( main );
			
		},
		
		/**
		 *
		 */
		update: function(dt) {
			this.updateList.forEach( function(func) {
				func(dt);
			});
		},
		
		/**
		 *
		 */
		render: function() {
			this.renderList.forEach(function(func) {
				func();
			});
		},
		
		/**
		 *
		 */
		addToUpdateList: function(func) {
			this.updateList.push(func);
		},
		
		/**
		 *
		 */
		addToRenderList: function(func) {
			this.renderList.push(func);
		},
	
		/**
		 *
		 */
		setAmbientLight: function(color) {
			var light = new THREE.AmbientLight(color);
			this.scene.add(light);
		},
		
		/**
		 *
		 */
		setDirectionalLight: function( color ) {
		
			var dirLight = new THREE.DirectionalLight( color, 1 );
			dirLight.position.set( 0, 400, 0 );
			dirLight.target.position.set( 128, 0, 128 );
			dirLight.castShadow = true;
			dirLight.shadow.mapSize.width = 4096;
			dirLight.shadow.mapSize.height = 4096;
			
			dirLight.shadow.bias = -0.0005;
			dirLight.shadow.camera.far = 768;
			dirLight.shadow.camera.top = -128;
			dirLight.shadow.camera.bottom = 128;
			dirLight.shadow.camera.left = -180;
			dirLight.shadow.camera.right = 180;
			
			//var helper = new THREE.CameraHelper( dirLight.shadow.camera );
			//scene.add( helper );
			
			this.scene.add( dirLight );
			this.scene.add( dirLight.target );
			
			return dirLight;
		
		}
	
	}

	return module;
}(BLOX || {}));