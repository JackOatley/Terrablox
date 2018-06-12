// handle edge/cross-chunk cases
            //if ( x-1 < 0
            //||   z-1 < 0
            //||   y-1 < 0
            //||   x+1 > 15
            //||   z+1 > 15
            //||   y+1 > 31 ) {
                
                /*
                var cx = this.worldPosition.x;
                var cy = this.worldPosition.y;
                var cz = this.worldPosition.z;
                
                var mask = 0b000000;
                
                if ( x - 1 < 0 ) {
                    var sx = 15;
                    var chunk = Chunk.find( cx - 1, cy, cz );
                    if ( chunk != undefined ) {
                        mask |= 0b010000 * (chunk.voxelMap[sx][z][y] === undefined);
                        mask |= 0b100000 * (this.voxelMap[x+1][z][y] === undefined);
                    }
                }
                else if ( x + 1 > 15 ) {
                    var sx = 0;
                    var chunk = Chunk.find( cx + 1, cy, cz );
                    if ( chunk != undefined ) {
                        mask |= 0b100000 * (chunk.voxelMap[sx][z][y] === undefined);
                        mask |= 0b010000 * (this.voxelMap[x-1][z][y] === undefined);
                    }
                }
                else {
                    mask |= 0b100000 * (this.voxelMap[x+1][z][y] === undefined);
                    mask |= 0b010000 * (this.voxelMap[x-1][z][y] === undefined);
                }
                
                if ( y - 1 < 0 ) {
                    var sy = 31;
                    var chunk = Chunk.find( cx, cy - 1, cz );
                    if ( chunk != undefined ) {
                        mask |= 0b000100 * (chunk.voxelMap[x][z][sy] === undefined);
                        mask |= 0b001000 * (this.voxelMap[x][z][y+1] === undefined);
                    }
                }
                else if ( y + 1 > 31 ) {
                    var sy = 0;
                    var chunk = Chunk.find( cx, cy + 1, cz );
                    if ( chunk != undefined ) {
                        mask |= 0b001000 * (chunk.voxelMap[x][z][sy] === undefined);
                        mask |= 0b000100 * (this.voxelMap[x][z][y-1] === undefined);
                    }
                }
                else {
                    mask |= 0b001000 * (this.voxelMap[x][z][y+1] === undefined);
                    mask |= 0b000100 * (this.voxelMap[x][z][y-1] === undefined);
                }
                
                if ( z - 1 < 0 ) {
                    var sz = 15;
                    var chunk = Chunk.find( cx, cy, cz - 1 );
                    if ( chunk != undefined ) {
                        mask |= 0b000001 * (chunk.voxelMap[x][sz][y] === undefined);
                        mask |= 0b000010 * (this.voxelMap[x][z+1][y] === undefined);
                    }
                }
                else if ( z + 1 > 15 ) {
                    var sz = 0;
                    var chunk = Chunk.find( cx, cy, cz + 1 );
                    if ( chunk != undefined ) {
                        mask |= 0b000010 * (chunk.voxelMap[x][sz][y] === undefined);
                        mask |= 0b000001 * (this.voxelMap[x][z-1][y] === undefined);
                    }
                }
                else {
                    mask |= 0b000010 * (this.voxelMap[x][z+1][y] === undefined);
                    mask |= 0b000001 * (this.voxelMap[x][z-1][y] === undefined);
                }
                
                if ( mask !== 0b000000 ) {
                    voxel.cullingMask = mask;
                    this.visibleVoxels.push( voxel );
                }
                */
                
            //}