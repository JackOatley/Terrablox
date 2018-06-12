var BLOX = (function( module ) {

	var _modelList = [];

	/**
	 * @constructor
	 */
	module.Model = function( src ) {

		this.src = src;
		this.model = this.modelLoad();
		this.isLoaded = false;
		
		_modelList.push( this );

	}
    
	module.Model.prototype = {
		
		/**
		 *
		 */
		modelLoad: function() {
		
			var jsonString = "",
				xobj = new XMLHttpRequest();
				
			xobj.overrideMimeType( "application/json" );
			xobj.open( "GET", this.src, true );
			xobj.onreadystatechange = function() {
				
				if (xobj.readyState == 4 && xobj.status == "200") {
					
					jsonString = xobj.responseText;
					this.model = JSON.parse( jsonString );
					this.isLoaded = true;
					
				}
			}.bind( this );
			
			xobj.send( null );
		
		}
    
	}
	
	
	/**
	 *
	 */
	module.Model.isLoaded = function( model ) {
	
		if ( model === "all" ) {
		
			for ( var i = 0; i < _modelList.length; i += 1 ) {
			
				if ( !_modelList[i].isLoaded ) {
				
					return false;
				
				}
			
			}
			
			return true;
		
		}
	
	}
    
    
	return module;
}( BLOX || {} ));
