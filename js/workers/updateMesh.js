
//
importScripts( "../constants.js" );
importScripts( "../utils.js" );
importScripts( "../numbers.js" );
importScripts( "../lib/three-r87.min.js" );
importScripts( "../legacy/generateCubePrefab.js" );
importScripts( "../blox-block-index.js" );
var box = BLOX.box;

//
var blockIndex = new BLOX.BlockIndex( "../../js/blocks.json" );

//
var template = {
    prefabs: []
}

//*
Object.keys( box.prefabs ).forEach( function( prefab ) {
	
	var thisPrefab = {
		vertices: [],
		coords: [],
		normals: [],
		colors: []
	};
	
    template.prefabs[prefab] = thisPrefab;
    
	//console.log( box.prefabs[prefab] );
	box.prefabs[prefab].forEach( function( n ) {
        
		for ( var i = 0; i < 2; i++ ) {
            
			// get face (specifically for vertices)
			// normals just use n as they are the same on both polys
			var face = box.faces[ n*2+i ];

			// push vertices into prefab
			thisPrefab.vertices.push(
				box.vertices[face[0]][0],
				box.vertices[face[0]][1],
				box.vertices[face[0]][2],
				box.vertices[face[1]][0],
				box.vertices[face[1]][1],
				box.vertices[face[1]][2],
				box.vertices[face[2]][0],
				box.vertices[face[2]][1],
				box.vertices[face[2]][2]);

			// push coords into prefab
			thisPrefab.coords.push(
				box.coords[i*3+0][0],
				box.coords[i*3+0][1],
				box.coords[i*3+1][0],
				box.coords[i*3+1][1],
				box.coords[i*3+2][0],
				box.coords[i*3+2][1]);

			// push normals into prefab
			thisPrefab.normals.push(
				box.normals[n][0],
				box.normals[n][1],
				box.normals[n][2],
				box.normals[n][0],
				box.normals[n][1],
				box.normals[n][2],
				box.normals[n][0],
				box.normals[n][1],
				box.normals[n][2]);
				
			// push shading into prefab
			thisPrefab.colors.push(
				box.colors[i*3+0][0],
				box.colors[i*3+0][1],
				box.colors[i*3+0][2],
				box.colors[i*3+1][0],
				box.colors[i*3+1][1],
				box.colors[i*3+1][2],
				box.colors[i*3+2][0],
				box.colors[i*3+2][1],
				box.colors[i*3+2][2]);

		}
        
	});
    
});

var isWorking = false,
	waitingQueue = [],
	message = [],
	transfer = [],
	messages = 0,
	border = 0,
	unborderedSize = 0,
	borderedSize = 0,
	scale = 0,
	totalTime = 0,
	recursions = 0;

// received a message from the main thread
addEventListener( "message", function( event ) {
    
	if ( event.data.setup !== undefined ) {
		
		console.log( "updating updateMesh worker with texture info" );
    
		textureTileSize = event.data.textureTileSize;
		textureWidth = event.data.textureWidth;
		textureHeight = event.data.textureHeight;
		textureBorder = event.data.textureBorder;
		texturePadding = event.data.texturePadding;
		
		border = textureBorder,
		unborderedSize = textureTileSize * 4,
		borderedSize = unborderedSize + border * 8,
		scale = unborderedSize / borderedSize * (textureWidth / texturePadding);
    
	} else {
		
		if ( isWorking ) {
			
			waitingQueue.push( event );
			
		} else {
			
			isWorking = true;
			WorkerUpdateMesh( event );
			
		}
		
	}
    
} );

/**
 *
 */
var WorkerUpdateMesh = function(event) {
	
	// don't execute if the block index has not yet been loaded.
	if ( !blockIndex.isReady() ) {
		
		//console.warn( "block index is not ready!" );
		setTimeout( WorkerUpdateMesh.bind( null, event ), 1 );
		return;
		
	}
	
	// a bunch of variables!
	var date 		 = new Date(),
		data 		 = event.data,
		chunkID 	 = data.chunkID,
		voxels 		 = new Uint8Array( data.voxels ),
		visibleFaces = data.visibleFaces,
		size 		 = visibleFaces;
		
	var vertices 	 = new Float32Array( size * 6 * 3 ),
		coords 		 = new Float32Array( size * 6 * 2 ),
		normals 	 = new Float32Array( size * 6 * 3 ),
		colors 	 	 = new Float32Array( size * 6 * 3 );
		
	var vertexIndex  = 0,
		normalIndex  = 0,
		uvIndex 	 = 0,
		colorIndex 	 = 0;
		
	
	// create index array (for ao checking)
	var indexArray = [];
	
	for ( v = 0; v < voxels.length; ) {
		
		indexArray[PointToLinearIndex(
			voxels[v++],
			voxels[v++],
			voxels[v++]
		)] = true;
		
		v += 2;
		
	}
	
	//
	var voxel = {},
		uv = [],
		ti, t;
    
    for ( v = 0; v < voxels.length; ) {
        
        //
        voxel.x = voxels[v++],
		voxel.y = voxels[v++],
		voxel.z = voxels[v++],
		voxel.texture = voxels[v++],
		voxel.cullingMask = voxels[v++];
        
        // get prefab for this voxel's culling bit mask
        prefab = template.prefabs[voxel.cullingMask];
        
        // copy and translate prefab position to voxel position
        for ( i = 0; i < prefab.vertices.length; i += 3 ) {
			
            vertices[vertexIndex++] = prefab.vertices[i+0] + voxel.x;
            vertices[vertexIndex++] = prefab.vertices[i+1] + voxel.y;
            vertices[vertexIndex++] = prefab.vertices[i+2] + voxel.z;
			
        }
        
        // copy texture coords from prefab
		t = 0;
		var faces = CountSetBits(voxel.cullingMask);
		for (var p = 0; p < faces; p += 1) {
			
			var bi = blockIndex,
				id = voxel.texture,
				pCoords = prefab.coords,
				block = bi.data[bi.mapping[id]];
			
			if (bi.data[bi.mapping[id]] === undefined) {
				console.log(id);
			}
			
			var index = IndexOfSetBit(voxel.cullingMask, p);
			switch ( index ) {
				
				case ( 0b100000 ): ti = block.east;   break;
				case ( 0b010000 ): ti = block.west;   break;
				case ( 0b001000 ): ti = block.top;    break;
				case ( 0b000100 ): ti = block.bottom; break;
				case ( 0b000010 ): ti = block.south;  break;
				case ( 0b000001 ): ti = block.north;  break;
				
			}
			
			uv = GetTileUV( ti );
			for (i = 0; i < 12; i++) {
				coords[uvIndex++] = (pCoords[t] * scale / 4) + uv[t++ % 2];
			}
		}
        
        // copy normals from prefab
		prefab.normals.forEach( function( value ) {
			
            normals[normalIndex++] = value;
			
        } );
		
		// COLOR (AO)
		if ( ENABLE_VAO ) {
			
			var faces = CountSetBits(voxel.cullingMask);
			var n = new THREE.Vector3( 0, 0, 0 );
			for (var p = 0; p < faces; p += 1) {
				
				var col0 = 1,
					col1 = 1,
					col2 = 1,
					col3 = 1;
				
				var index = IndexOfSetBit(voxel.cullingMask, p);
				switch ( index ) {
					
					case ( 0b100000 ): n.set( 1,   0,   0 ); break;
					case ( 0b010000 ): n.set( -1,  0,   0 ); break;
					case ( 0b001000 ): n.set( 0,   1,   0 ); break;
					case ( 0b000100 ): n.set( 0,   -1,  0 ); break;
					case ( 0b000010 ): n.set( 0,   0,   1 ); break;
					case ( 0b000001 ): n.set( 0,   0,  -1 ); break;
					
				}
				
				var ia = indexArray;
				var ptl = PointToLinearIndex;
				var V = voxel;
				var abs = Math.abs;

				var x0ypzn = ptl(
						V.x+n.x,
						V.y+abs(n.x)+n.y+abs(n.z),
						V.z-n.y+n.z),
					xpypzn = ptl(
						V.x+n.x+abs(n.y)+n.z,
						V.y+abs(n.x)+n.y+abs(n.z),
						V.z-n.x-n.y+n.z),
					xpypz0 = ptl(
						V.x+n.x+abs(n.y)+n.z,
						V.y+n.y,
						V.z-n.x+n.z),
					xpypzp = ptl(
						V.x+n.x+abs(n.y)+n.z,
						V.y-abs(n.x)+n.y-abs(n.z),
						V.z-n.x+n.y+n.z),
					x0ypzp = ptl(
						V.x+n.x,
						V.y-abs(n.x)+n.y-abs(n.z),
						V.z+n.y+n.z),
					xnypzp = ptl(
						V.x+n.x-abs(n.y)-n.z,
						V.y-abs(n.x)+n.y-abs(n.z),
						V.z+n.x+n.y+n.z),
					xnypz0 = ptl(
						V.x+n.x-abs(n.y)-n.z,
						V.y+n.y,
						V.z+n.x+n.z),
					xnypzn = ptl(
						V.x+n.x-abs(n.y)-n.z,
						V.y+abs(n.x)+n.y+abs(n.z),
						V.z+n.x-n.y+n.z);
				
				x0ypzn = ia[x0ypzn] !== undefined;
				xpypzn = ia[xpypzn] !== undefined;
				xpypz0 = ia[xpypz0] !== undefined;
				xpypzp = ia[xpypzp] !== undefined;
				x0ypzp = ia[x0ypzp] !== undefined;
				xnypzp = ia[xnypzp] !== undefined;
				xnypz0 = ia[xnypz0] !== undefined;
				xnypzn = ia[xnypzn] !== undefined;
				
				col0 = 1 - 0.15 * (x0ypzn + xnypz0 + xnypzn);
				col1 = 1 - 0.15 * (x0ypzn + xpypzn + xpypz0);
				col2 = 1 - 0.15 * (xnypz0 + xnypzp + x0ypzp);
				col3 = 1 - 0.15 * (x0ypzp + xpypzp + xpypz0);
					
				colors[colorIndex++] = col0;
				colors[colorIndex++] = col0;
				colors[colorIndex++] = col0;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col1;
				colors[colorIndex++] = col1;
				colors[colorIndex++] = col1;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col2;
				colors[colorIndex++] = col3;
				colors[colorIndex++] = col3;
				colors[colorIndex++] = col3;
				colors[colorIndex++] = col1;
				colors[colorIndex++] = col1;
				colors[colorIndex++] = col1;
				
			}
			
		}
		//prefab.colors.forEach(function(value) {
            //colors[c++] = value;
        //});
        
    }//);
	
	//
	//totalTime += new Date().getTime() - date.getTime();
    //console.log( totalTime + "ms" );
    
    // compile our message to send back to the main thread,
    // it contains the vertex, uv and normal buffers, and
    // the time it took to build them in miliseconds.
    message.push( {
        
        chunkID: chunkID,
        vertices: vertices.buffer,
        coords: coords.buffer,
        normals: normals.buffer,
		colors: colors.buffer,
        ms: new Date() - date
        
    } );
    
    // some of our message is transferable, so those items
    // go in this list so they are transfered instead of copied.
    transfer.push(
    
        message[messages].vertices,
        message[messages].coords,
        message[messages].normals,
		message[messages].colors
    
    );
    
    // send back to main thread
    if ( ++messages == WORKER_MESSAGES_MIN || waitingQueue.length == 0 ) {
        
        postMessage( message, transfer );
        messages = 0;
        message = [];
        transfer = [];
        
    }
	
	// this bit of code here allows us to avoid call stack limit errors
    // by setting the WORKER_RECURSION_LIMIT constant to a number lower
    // than the call stack limit.
    var forceNonRepeat = false;
    if ( ++recursions > WORKER_RECURSION_LIMIT ) {
    
        recursions = 0;
        forceNonRepeat = true;
    
    }
    
    // if there is an.ything waiting in the queue, execute that immedietly.
    if ( !forceNonRepeat && waitingQueue.length > 0 ) {
    
        WorkerUpdateMesh( waitingQueue.shift() );
    
    } else {
        
        // setTimeout is used as this allows for items to be queued inside
        // the worker, rather than waiting outside to come in on next tick.
        setTimeout( function() {
            
            if ( waitingQueue.length > 0 ) {
                
                WorkerUpdateMesh( waitingQueue.shift() );
            
            } else {
                
                isWorking = false;
                
            }
            
        }, 0 );
    
    }

}


//
var GetTileUV = function( index ) {

	let
		texY = Math.floor( index / TEXTURE_X_TILES ),
		texX = index - texY * TEXTURE_X_TILES;
		
	const
		tbs = border / (textureTileSize*4 + border*8),
		tps = texturePadding / textureWidth;
		
    texY /= TEXTURE_Y_TILES * tps;
    texX /= TEXTURE_X_TILES * tps;
	texX += tbs / tps;
	texY += tbs / tps;
	
	return [ texX, texY ];

}

 