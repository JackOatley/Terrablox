var BLOX = (function( module ) {

    //
    module.box = {
        prefabs: [],
        faces: [
            [0, 2, 1],    // east
            [2, 3, 1],
            [4, 6, 5],    // west
            [6, 7, 5],
            [4, 5, 1],    // top
            [5, 0, 1],
            [7, 6, 2],    // bottom
            [6, 3, 2],
            [5, 7, 0],    // south
            [7, 2, 0],
            [1, 3, 4],    // north
            [3, 6, 4],
        ],
        vertices: [
            [1, 1, 1],
            [1, 1, 0],
            [1, 0, 1],
            [1, 0, 0],
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
            [0, 0, 1]
        ],
        coords: [
            [0, 1],
            [0, 0],
            [1, 1],
            [0, 0],
            [1, 0],
            [1, 1]
        ],
        normals: [
            [1,  0,  0],   // east
            [-1, 0,  0],   // west
            [0,  1,  0],   // top
            [0,  -1, 0],   // bottom
            [0,  0,  1],   // north
            [0,  0, -1]    // south
        ],
		colors: [
			[1, 1, 1],
			[1, 1, 1],
			[0, 0, 0],
			[1, 1, 1],
			[0, 0, 0],
			[0, 0, 0]
		]
	}

    // generate prefabs face indices
    for ( var n = 0; n < 64; n++ ) {

        var arr = [];
        
        if (n & 0b100000) { arr.push(0); }
        if (n & 0b010000) { arr.push(1); }
        if (n & 0b001000) { arr.push(2); }
        if (n & 0b000100) { arr.push(3); }
        if (n & 0b000010) { arr.push(4); }
        if (n & 0b000001) { arr.push(5); }
        
        module.box.prefabs.push(arr);

    }
    
    return module;
}( BLOX || {} ));