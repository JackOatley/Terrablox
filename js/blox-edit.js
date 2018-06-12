var BLOX = (function(module) {

	/**
	 * @constructor
	 */
	module.Edit = function() {
	}
	
	
	module.Edit.prototype = {
	
		/**
		 *
		 */
		update: function() {
			
			if (camera.isPointerLocked) {
			
				if (input.mouse.buttonpress[0]
				|| input.mouse.buttonpress[2]) {
					if (target.hasTarget) {
						
						var pos, type;
						if (input.mouse.buttondown[0]) {
							pos = target.openVoxel;
							type = target.placeType;
						} else {
							pos = target.targetVoxel;
							type = NULL_VOXEL;
						}
						
						world.setVoxel(pos.x, pos.y, pos.z, type);
						
						var chunk = BLOX.Chunk.find(
							~~(target.openVoxel.x/CHUNK_WIDTH),
							~~(target.openVoxel.y/CHUNK_HEIGHT),
							~~(target.openVoxel.z/CHUNK_DEPTH)
						);
						
						chunk.updateCulling();
					}
				}
				
			}
			
		}
			
	}
		
	return module;
}(BLOX || {}));