
/**
 * A voxel
 * @constructor
 */ 
function Voxel( chunk, x, y, z ) {
    
    this.x = x;
    this.y = y;
    this.z = z;
    this.texture = [ 0.5, 0.5 ];
    this.cullingMask = 0b000000;
    
}

Voxel.prototype.addToMesh = function() {
    
    var box = new THREE.BoxGeometry( 1, 1, 1 );
    var mesh = new THREE.Mesh( box );
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.updateMatrix();
    this.parentChunk.geometry.merge( mesh.geometry, mesh.matrix );
    
}
