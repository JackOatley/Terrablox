var BLOX = (function( module ) {

	/**
	 * PointerLock code derived from {@link https://www.html5rocks.com/en/tutorials/pointerlock/intro/ html5rocks}.
	 * @constructor
	 * @param {domElement} element - The camera has to be attached to an element on the web page for some of it's functionality. For convenience we generally use the THREE.renderer.domElement as that should have been created by time time you create a camera.
	 * @param {THREE.PerspectiveCamera} camera - Attach existing THREE.PerspectiveCamera to this camera object.
	 */
	module.Camera = function(args) {
		
		var args = args || {};
		
		this.requestElement  = args.domElement;
		this.isPointerLocked = false;
		this.yaw             = args.yaw || 180;
		this.pitch           = args.pitch || 100;
		this.movementSpeed   = 2;
		this.position        = args.position || new THREE.Vector3( 0, 0, 0 );
		this.lookAtVector    = new THREE.Vector3( 0, 0, 0 );
		this.tempVector      = new THREE.Vector3( 0, 0, 0 );
		this.fov             = args.fov || 70;
		this.aspect          = args.aspect || this.getAspect();
		this.near            = args.near || 0.1;
		this.far             = args.far || 1000;
		
		this.sceneCamera = new THREE.PerspectiveCamera(
			this.fov,
			this.aspect,
			this.near,
			this.far
		);
		
		this.pointerLockMove(0);

		//
		this.mouseMove = this.pointerLockMove.bind( this );
		
		var havePointerLock =
			"pointerLockElement" in document ||
			"mozPointerLockElement" in document ||
			"webkitPointerLockElement" in document;
			
		if ( !havePointerLock ) {
			console.warn( "browser does not support pointer lock!" );
		}
			
		this.requestElement.requestPointerLock =
			this.requestElement.requestPointerLock ||
			this.requestElement.mozRequestPointerLock ||
			this.requestElement.webkitRequestPointerLock;
			
		document.exitPointerLock =
			document.exitPointerLock ||
			document.mozExitPointerLock;
			
		// pointer lock change events
		// addEventListener is attached to document so we use .bind( this )
		// to make sure the callback is for this camera object.
		var callback = this.pointerLockChange.bind(this);
		document.addEventListener("pointerlockchange", callback);
		document.addEventListener("mozpointerlockchange", callback);
		document.addEventListener("webkitpointerlockchange", callback);
			
		// requestPointerLock() will only work when triggered via user input.
		this.requestElement.onclick = function() {
			
			this.requestElement.requestPointerLock();
			
		}.bind(this);
		
		// fix the aspect ratio when the window is resized
		window.addEventListener('resize', function() {
			
			this.aspect = this.getAspect();
			this.updateSceneCamera();
			this.sceneCamera.updateProjectionMatrix();
			
		}.bind(this));

	}

	
	module.Camera.prototype = {
		
		/**
		 * Updates the camera object. This primarily handles input.
		 */
		update: function(dt) {

			//if  ( this.isPointerLocked ) {
				
				if (input.keyboard.keydown["w"]) { this.moveForward( dt ); }
				if (input.keyboard.keydown["a"]) { this.strafeLeft( dt ); }
				if (input.keyboard.keydown["s"]) { this.moveBackward( dt ); }
				if (input.keyboard.keydown["d"]) { this.strafeRight( dt ); }
				
			//}

		},

		/**
		 * EventListerner callback function triggered when the state of the PointerLock changes; being locked, or being unlocked.
		 */
		pointerLockChange: function() {
			
			var success = 
				document.pointerLockElement === this.requestElement ||
				document.mozPointerLockElement === this.requestElement ||
				document.webkitPointerLockElement === this.requestElement;

			if ( success ) {
				
				if ( !this.isPointerLocked ) {
					
					this.isPointerLocked = true;
					document.addEventListener( "mousemove", this.mouseMove );
					
				}
				
			} else {
				
				this.isPointerLocked = false;
				document.removeEventListener( "mousemove", this.mouseMove );
				document.exitPointerLock();
				
			}

		},

		/**
		 * EventListerner callback function triggered when the the mouse has moved while the PointerLock is locked.
		 */
		pointerLockMove: function(e) {
			
			var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0,
				movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
			
			this.yaw -= movementX * 0.1;
			this.pitch -= movementY * 0.2;
			
			if ( this.yaw < 0 ) { this.yaw += 360; }
			if ( this.yaw >= 360 ) { this.yaw -= 360; }
			if ( this.pitch < 41 ) { this.pitch = 41; }
			if ( this.pitch > 249 ) { this.pitch = 249; }
			
			var vector = new THREE.Vector3(1, -1, 1);
			var axisXZ =  new THREE.Vector3(1, 0, -1);
			var axisY =  new THREE.Vector3(0, 1, 0);
			
			vector.applyAxisAngle( axisXZ, this.pitch * (Math.PI / 180) );
			vector.applyAxisAngle( axisY, this.yaw * (Math.PI / 180) );
			
			this.lookAtVector = vector.normalize();
			this.updateSceneCamera();
			
		},

		//
		moveForward: function(dt) {

			this.tempVector.copy( this.lookAtVector );
			this.tempVector.multiplyScalar( dt );
			this.position.add( this.tempVector );
			this.updateSceneCamera();
			
		},

		//
		moveBackward: function(dt) {

			this.tempVector.copy( this.lookAtVector );
			this.tempVector.multiplyScalar( dt );
			this.position.sub( this.tempVector );
			this.updateSceneCamera();
			
		},

		//
		strafeLeft: function(dt) {

			this.tempVector.setY( 0 );
			this.tempVector.setX( this.lookAtVector.x );
			this.tempVector.setZ( this.lookAtVector.z );
			this.tempVector.applyAxisAngle ( new THREE.Vector3( 0, 1, 0 ), 90 * (Math.PI/180) );
			this.tempVector.normalize();
			this.tempVector.multiplyScalar( dt );
			this.position.add( this.tempVector );
			this.updateSceneCamera();
			
		},

		//
		strafeRight: function(dt) {

			this.tempVector.setY( 0 );
			this.tempVector.setX( this.lookAtVector.x );
			this.tempVector.setZ( this.lookAtVector.z );
			this.tempVector.applyAxisAngle ( new THREE.Vector3( 0, 1, 0 ), 90 * (Math.PI/180) );
			this.tempVector.normalize();
			this.tempVector.multiplyScalar( dt );
			this.position.sub( this.tempVector );
			this.updateSceneCamera();
			
		},

		//
		setPosition: function(x, y, z) {
			this.position.set(x, y, z);
			this.updateSceneCamera();
		},

		//
		setLookAtVector: function(vector) {
			this.lookAtVector.copy(vector);
			this.updateSceneCamera();
		},

		//
		updateSceneCamera: function() {
			
			this.sceneCamera.aspect = this.aspect;
			this.sceneCamera.position.copy(this.position);
			this.sceneCamera.lookAt({
			  x: this.position.x + this.lookAtVector.x,
			  y: this.position.y + this.lookAtVector.y,
			  z: this.position.z + this.lookAtVector.z
			});
			
		},

		/**
		 * This function calculates the aspect ratio for the camera. It is run when no aspect is provided when the camera is created. By default it uses the window.innerWidth and window.innerHeight properties. To use a different default sizing, you should create a new function to overide this one.
		 */
		getAspect: function() {
			return window.innerWidth / window.innerHeight;
		}
		
	}
	
	return module;
}( BLOX || {} ));
