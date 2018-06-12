var BLOX = (function( module ) {

	/**
	 * The Input object handles all input events.
	 * @constructor
	 */
	module.Input = function( args ) {
		
		var args = args || {},
			element = args.element || document;
		
		this.keyboard = {
			keypress: {},
			keydown: {},
			keyup: {}
		}
		
		this.mouse = {
			buttonpress: {},
			buttondown: {},
			buttonup: {},
			wheelUp: false,
			wheelDown: false
		}

		element.addEventListener("keypress", function(event) {
			this.keyboard.keypress[event.key] = true;
			this.keyboard.keydown[event.key] = true;
			event.preventDefault();
		}.bind(this));

		element.addEventListener("keyup", function(event) {
			this.keyboard.keypress[event.key] = false;
			this.keyboard.keyup[event.key] = true;
			this.keyboard.keydown[event.key] = false;
			event.preventDefault();
		}.bind(this));

		element.addEventListener("mousedown", function(event) {
			this.mouse.buttonpress[event.button] = true;
			this.mouse.buttondown[event.button] = true;
			event.preventDefault();
		}.bind(this));

		element.addEventListener("mouseup", function(event) {
			this.mouse.buttonpress[event.button] = false;
			this.mouse.buttonup[event.button] = true;
			this.mouse.buttondown[event.button] = false;
			event.preventDefault();
		}.bind(this));

		element.addEventListener("mousewheel", function(event) {
			var delta = Math.max(-1, Math.min(1, event.wheelDelta));
			this.mouse.wheelUp = delta > 0;
			this.mouse.wheelDown = delta < 0;
		}.bind(this));

		// disable context menu
		element.oncontextmenu = function(event) {
			event.preventDefault();
		};

	}

	
	module.Input.prototype = {
			
		/**
		 * Resets any states that can't be handled with the EventListeners. Such as key up. For example; the EventListener can set keyboard.keyup[key] to true, but this function is required to set it back to false. Should be run at the end of the game loop, or at least after everything you want to receive input has received it.
		 */
		reset: function() {

			Object.keys(this.keyboard.keyup).forEach(function(key) {
				this.keyboard.keypress[key] = false;
				this.keyboard.keyup[key] = false;
			}, this);

			Object.keys(this.mouse.buttondown).forEach(function(button) {
				this.mouse.buttonpress[button] = false;
				this.mouse.buttonup[button] = false;
			}, this);
			
			this.mouse.wheelUp = false;
			this.mouse.wheelDown = false;

		}
		
	}
	
     return module;
}( BLOX || {} ) );