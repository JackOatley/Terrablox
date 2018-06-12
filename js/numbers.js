
/**
 *
 */
var PointToLinearIndex = function(x, y, z) {
    
	return (z * CHUNK_HEIGHT_B)
		 + (x * CHUNK_WIDTH_B * CHUNK_HEIGHT_B)
		 + (y);
	
}

/**
 *
 */
var GetTileUV = function(index) {

	var texY = Math.floor( index / TEXTURE_X_TILES ); 
	var texX = index - ( texY * TEXTURE_X_TILES );
	
	return [
		texX / TEXTURE_Y_TILES,
		texY / TEXTURE_X_TILES
	];

}