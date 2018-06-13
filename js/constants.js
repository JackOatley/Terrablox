
/** @const {boolean} */ var ENABLE_EDGES = true;
/** @const {boolean} */ var ENABLE_MIPMAPPING = false;
/** @const {boolean} */ var ENABLE_VAO = true;

/** @const {number}  */ var WORLD_HEIGHT      = 128;
/** @const {number}  */ var CHUNK_WIDTH       = 64;
/** @const {number}  */ var CHUNK_HEIGHT      = 128;
/** @const {number}  */ var CHUNK_DEPTH       = 64;
/** @const {number}  */ var TEXTURE_X_TILES = 4;
/** @const {number}  */ var TEXTURE_Y_TILES = 4;

/** @const {number}  */ var WORKER_MESSAGES_MIN    = 2;
/** @const {number}  */ var WORKER_RECURSION_LIMIT = 512;

/** @const {number}  */ var HEIGHTMAP_SCALE   = 256 / WORLD_HEIGHT;
/** @const {number}  */ var CHUNK_WIDTH_B     = CHUNK_WIDTH + 2;
/** @const {number}  */ var CHUNK_HEIGHT_B    = CHUNK_HEIGHT + 2;
/** @const {number}  */ var CHUNK_DEPTH_B     = CHUNK_DEPTH + 2;
/** @const {number}  */ var DATA_OFFSET_MIN   = 1;
/** @const {number}  */ var DATA_OFFSET_MAX   = 1;
/** @const {number}  */ var XOFF              = CHUNK_HEIGHT_B * DATA_OFFSET_MAX;
/** @const {number}  */ var YOFF              = DATA_OFFSET_MAX;
/** @const {number}  */ var ZOFF              = CHUNK_WIDTH_B * XOFF;
/** @const {number}  */ var VOXEL_BUFFER_SIZE = ZOFF * CHUNK_DEPTH_B;
/** @const {number}  */ var NULL_VOXEL        = 255;
