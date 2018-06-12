
//
importScripts( "../constants.js" );
importScripts( "../numbers.js" );
importScripts( "../utils.js" );
importScripts( "../blox-block-index.js" );

//
var blockIndex = new BLOX.BlockIndex( "../../js/blocks.json" ),
	isWorking = false,
	nearestQueue = [],
	waitingQueue = [],
	message = [],
	transfer = [],
	messages = 0,
	totalTime = 0,
	worldPosition,
	scan = 0,
	mapWidth = 1024,
	mapDepth = 1024,
	recursions = 0;

// received a message from the main thread
addEventListener( "message", function( event ) {
    
	if ( event.data.setup !== undefined ) {
    
		mapWidth = event.data.worldWidth;
		mapDepth = event.data.worldDepth;
    
	} else {
    
		if (isWorking) {
            
			nearestQueue.push( event.data.worldPosition );
			waitingQueue.push( event );
            
		} else {
            
			isWorking = true;
			WorkerUpdateCulling( event );
            
		}
        
	}
    
} );

/**
 *
 */
var WorkerUpdateCulling = function( event ) {
	
	// don't execute if the block index has not yet been loaded.
	if ( !blockIndex.isReady() ) {
		
		//console.warn( "block index is not ready!" );
		setTimeout( WorkerUpdateCulling.bind( null, event ), 1 );
		return;
		
	}

	var x, y, z, height, voxel, head, index, tex;

	//console.log( event );
	
	var date = new Date(),
		data = event.data,
		chunkID = data.chunkID,
		voxelMap = new Uint8Array( data.voxelMap ),
		stackHeightsMin = data.stackHeightsMin,
		stackHeightsMax = data.stackHeightsMax,
		timestamp = data.timestamp;
		
	worldPosition = data.worldPosition;

	//
	let visibleVoxels = [],
		visibleFaces = 0,
		voxelDataArray = [];

	for ( x = 1; x < CHUNK_WIDTH_B-1; x++ )
	for ( z = 1; z < CHUNK_DEPTH_B-1; z++ ) {

		min = GetStackMin( stackHeightsMin, x, z );
		max = GetStackMax( stackHeightsMax, x, z );

		if ( ENABLE_EDGES ) {

			if ( worldPosition.x*CHUNK_WIDTH + x == mapWidth
			||   worldPosition.z*CHUNK_DEPTH + z == mapDepth
			||   worldPosition.x + x == 1
			||   worldPosition.z + z == 1 ) {
				min = 1;
			}
		
		}
        
        for ( y = min; y < max; y++ ) {
        
            scan += 1;
            
            index = PointToLinearIndex( x, y, z );
            index *= DATA_OFFSET_MAX;
            
            // get the voxel at the given index
            // if it's a valid voxel, then continue
            voxel = voxelMap[ index ];
            if ( voxel !== NULL_VOXEL ) {
                
                // get the culling mask for this voxel, if it's NOT zero then
                // at least one face is visible, so then add to the list.
                let mask = GetCullingMask( voxelMap, x, y, z );
                if ( mask ) {
                    
                    // add voxel data to array
					visibleFaces += CountSetBits( mask );
					voxelDataArray.push( x-1, y-1, z-1, voxel, mask );
                
                }
                
            }
        
        }
    
    }
    
    //
    visibleVoxelsU8 = new Int8Array( voxelDataArray );
    
    //
    //totalTime += new Date().getTime() - date.getTime();
    //console.log( "scanned "+scan+" voxels in "+totalTime + "ms" );
    
    // compile our message to send back to the main thread,
    // it contains the vertex, uv and normal buffers, and
    // the time it took to build them in miliseconds.
    message.push( {
        
        chunkID: chunkID,
        visibleVoxels: visibleVoxelsU8.buffer,//visibleVoxels,
        visibleFaces: visibleFaces,
		voxelMap: voxelMap.buffer,
        ms: new Date().getTime() - date.getTime()
        
    } );
    
    // some of our message is transferable, so those items
    // go in this list so they are transfered instead of copied.
    transfer.push(
    
        visibleVoxelsU8.buffer,
		voxelMap.buffer
    
    );
    
	// send back to main thread
	if ( ++messages == WORKER_MESSAGES_MIN || waitingQueue.length == 0 ) {
        
		postMessage( message );
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
    
    // if there is anything waiting in the queue, execute that immedietly.
    if ( !forceNonRepeat && waitingQueue.length > 0 ) {
    
        //WorkerUpdateCulling( waitingQueue.shift() );
		//WorkerUpdateCulling( waitingQueue.splice( 0, 1 ) );
		
		let index = nearestInQueue( 16, 0, 16 ),
			next = waitingQueue.splice( index, 1 )[0];
		
		nearestQueue.splice( index, 1 );
		WorkerUpdateCulling( next );
    
    } else {
        
        // setTimeout is used as this allows for items to be queued inside
        // the worker, rather than waiting outside to come in on next tick.
        setTimeout( function() {
            
            if ( waitingQueue.length > 0 ) {
                
				let index = nearestInQueue( 16, 0, 16 ),
					next = waitingQueue.splice( index, 1 )[0];
				
				nearestQueue.splice( index, 1 );
				WorkerUpdateCulling( next );
            
            } else {
                
                isWorking = false;
                
            }
            
        }, 0 );
    
    }

}

//
var nearestInQueue = function( x, y, z ) {
	
	let nearestIndex = 0,
		nearestPosition = { x:x, y:y, z:z },
		nearestDistance = 10000;
	
	for( let n = 0; n < nearestQueue.length; n += 1 ) {
	
		let newPosition = nearestQueue[n];
		
		if ( newPosition !== undefined ) {
			
			let newDistance = distanceVector( nearestPosition, newPosition );
	
			//console.log( newDistance, "<", nearestDistance );
	
			if ( newDistance < nearestDistance ) {
			
				nearestDistance = newDistance;
				//nearestPosition = newPosition;
				nearestIndex = n;
			
			}
			
		}
	
	}
	
	//console.log( "RETURN: " + nearestIndex );
	
	return nearestIndex;
	
}

//
var distanceVector = function( v1, v2 ) {
	
    const dx = v1.x - v2.x,
		  dy = v1.y - v2.y,
		  dz = v1.z - v2.z;

    return Math.sqrt( dx * dx + dy * dy + dz * dz );
	
}

//
var GetStackMin = function( stackMap, x, z ) {

    var index, min;

    index = x + z * CHUNK_WIDTH_B;

    min = Math.max( Math.min(
    
      stackMap[index - CHUNK_WIDTH_B],
      stackMap[index + CHUNK_WIDTH_B],
      stackMap[index - 1 ],
      stackMap[index + 1 ],
      stackMap[index     ]
        
    ) - 1, 1 );
    
    return isNaN( min ) ? 1 : min;

}

//
var GetStackMax = function( stackMap, x, z ) {

    return Math.min( stackMap[ x + z * CHUNK_WIDTH_B ], CHUNK_HEIGHT_B-1 );

}

// Given a voxel map and a position in it, return a bitmask
// that corresponds to neighbors in that map at that position.
var GetCullingMask = function( map, x, y, z ) {

	var index = PointToLinearIndex(x, y, z) * DATA_OFFSET_MAX,
		type = map[index],
		transparent = blockIndex.isTransparent( map[index] );
	
	mask  = 0b100000 * GetCullBetween( type, transparent, map[index + ZOFF] );
	mask |= 0b010000 * GetCullBetween( type, transparent, map[index - ZOFF] );
	mask |= 0b001000 * GetCullBetween( type, transparent, map[index + YOFF] );
	mask |= 0b000100 * GetCullBetween( type, transparent, map[index - YOFF] );
	mask |= 0b000010 * GetCullBetween( type, transparent, map[index + XOFF] );
	mask |= 0b000001 * GetCullBetween( type, transparent, map[index - XOFF] );
	
	if ( ENABLE_EDGES ) {
        
		mask |= 0b100000 * (worldPosition.x*CHUNK_WIDTH + x == mapWidth);
		mask |= 0b000010 * (worldPosition.z*CHUNK_DEPTH + z == mapDepth);
		mask |= 0b010000 * (worldPosition.x + x == 1);
		mask |= 0b000001 * (worldPosition.z + z == 1);
        
	}
    
	return mask;

}

// this function was required to work out the culling between different types of
// blocks, such as opaque > transparent. Specifically transparent blocks of the
// same type.
var GetCullBetween = function( type1, trans1, type2 ) {

	var trans2 = blockIndex.isTransparent( type2 );
	return trans2 - ( trans1 & ( type1 == type2 ) );

}

 