var BLOX = (function( module ) {

	/**
	 *
	 */
	module.BlockIndex = function( path ) {
		
		this.ready = false;
		this.data = undefined;
		this.mapping = undefined;
		this.settings = undefined;
		this.path = path;
		
		this.load();
	
	}
	
	module.BlockIndex.prototype = {
	
		/**
		 *
		 */
		isReady: function() {
		
			return this.ready;
		
		},
		
		/**
		 *
		 */
		load: function() {
		
			var xobj = new XMLHttpRequest();
			//xobj.overrideMimeType( "application/json" );
			xobj.open( "GET", this.path, true );
			xobj.onreadystatechange = function() {
				
				if (xobj.readyState == 4 && xobj.status == "200") {
					
					var object = JSON.parse( xobj.responseText );
					this.data = object.data;
					this.mapping = object.mapping;
					this.settings = object.settings;
					this.ready = true;
					
					//console.log( this );
					
				}
				
			}.bind( this );
			xobj.send( null );
		
		},
		
		/**
		 *
		 */
		isTransparent: function( index ) {
		
			if ( index == NULL_VOXEL ) {
			
				return true;
			
			}
			
			if ( this.data[this.mapping[index]].transparent ) {
			
				return true;
			
			}
			
			return false;
		
		}
	
	}

	return module;
}( BLOX || {} ));