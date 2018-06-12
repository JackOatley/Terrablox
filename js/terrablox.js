
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

BLOX.Chunk.startWorkerManager();

var treeModel = [];
treeModel[0] = new BLOX.Model("models/trees/pine_1.json");
treeModel[1] = new BLOX.Model("models/trees/pine_2.json");
treeModel[2] = new BLOX.Model("models/trees/tree_1.json");
treeModel[3] = new BLOX.Model("models/trees/tree_2.json");
treeModel[4] = new BLOX.Model("models/trees/tree_3.json");
treeModel[5] = new BLOX.Model("models/trees/tree_4.json");
treeModel[6] = new BLOX.Model("models/trees/tree_5.json");
treeModel[7] = new BLOX.Model("models/trees/tree_6.json");
treeModel[8] = new BLOX.Model("models/trees/tree_7.json");
treeModel[9] = new BLOX.Model("models/trees/tree_braffolk_bush.json");
treeModel[10] = new BLOX.Model("models/trees/tree_braffolk_evergreen.json");
treeModel[11] = new BLOX.Model("models/trees/tree_braffolk_meh.json");
treeModel[12] = new BLOX.Model("models/trees/tree_braffolk_small.json");
treeModel[13] = new BLOX.Model("models/trees/tree_braffolk_spreading.json");
treeModel[14] = new BLOX.Model("models/trees/tree_braffolk_willow.json");
treeModel[15] = new BLOX.Model("models/trees/tree_trg.json");
treeModel[16] = new BLOX.Model("models/trees/tree_vagabond.json");


var engine = new BLOX.Engine();
var input = new BLOX.Input();
var edit = new BLOX.Edit();
var gui = new BLOX.GUI();
var texture = new BLOX.Texture();

// create the heightmap
var heightmap = new BLOX.Heightmap();
heightmap.addSource( "img/hm3.png" );

// create the world and generate from the heightmap
var world = new BLOX.World();
world.generateFromHeightmap( heightmap );

var camera = new BLOX.Camera( {
	domElement: engine.renderer.domElement,
	input: input,
	position: new THREE.Vector3( 512, 256, 768 ),
	yaw: -45,
	pitch: 70
} );

var target = new BLOX.Target();

//
engine.setAmbientLight( 0x808080 );
var dirLight = engine.setDirectionalLight( 0x7F7646 );


var update = function(dt) {
	camera.update(dt);
}


var render = function() {
	stats.begin();
	target.update( camera.position, camera.lookAtVector );
	edit.update();
	
	dirLight.position.set(
		camera.position.x-128, 200, camera.position.z-128
	);
	dirLight.target.position.set(
	  camera.position.x, 0, camera.position.z
	);
	stats.end();
}


engine.addToUpdateList( update );
engine.addToRenderList( render );
