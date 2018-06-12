
/**
 * Returns the number of set bits (1's) in the given number. Code sourced from {@link http://stackoverflow.com/a/109117 this stack overflow awnser}.
 */
function CountSetBits(x) {

	x = x - ((x >> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
	x = (x + (x >> 4)) & 0x0F0F0F0F;
	x = x + (x >> 8);
	x = x + (x >> 16);
	return x & 0x0000003F;

}

/**
 * Returns a new bitmask containing only the N'th set bit of the given mask. To find the index of the first set bit, 0 is provided instead of 1. And 1 is provided to find the second bit.
 * @example
 * // returns 0b001000 (8)
 * IndexOfSetBit(0b011010, 1);
 */
function IndexOfSetBit(mask, n) {

	var i, p = 0;
	for (i = 0b100000; i > 0b000000; i = i >> 1) {
	
		if ((i & mask) && (p++ == n)) {
			return i;
		}
	
	}
	
	return 0;

}

/**
 *
 */
function Array2D( w, h ) {
    
    this.width = w;
    this.height = h;
    
    var array = [];
    for ( var i = 0; i < h; i++ ) {
        array[ i ] = [];
    }
    
    return array;
    
}

/**
 *
 */
function Array3D( w, h, d ) {
    
    this.width = w;
    this.height = h;
    this.depth = d;
    
    var array = [];
    for ( var i = 0; i < h; i++ ) {
        array[ i ] = [];
        for ( var p = 0; p < d; p++ ) {
            array[ i ][p] = [];
        }
    }
    
    return array;
    
}

/**
 *
 */
function VectorNormalize( x1, y1, z1, x2, y2, z2) {
    
    x2 -= x1;
    y2 -= y1;
    z2 -= z1;
    x1 = 0;
    y1 = 0;
    z1 = 0;
    
    var length = Math.sqrt((x2 * x2) + (y2 * y2) + (z2 * z2)) ;
    
    return {
        x: x2 / length,
        y: y2 / length,
        z: z2 / length
    }
    
}

/**
 *
 */
Number.prototype.clamp = function( min, max ) {

    return Math.min( Math.max( this, min ), max );

}

/**
 *
 */
Math.clamp = function( x, min, max ) {

    return Math.min( Math.max( x, min ), max );

}

/**
 *
 */
Math.isPowerOf2 = function( n ) {

    return n && ( n & ( n - 1 ) ) === 0;

}

/**
 *
 */
Math.nearestUpperPowerOf2 = function( n ) {
	
	n--;
	n |= n >> 1;
	n |= n >> 2;
	n |= n >> 4;
	n |= n >> 8;
	n |= n >> 16;
	return ++n;

}
