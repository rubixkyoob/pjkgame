// Main script

var sqrSize = Math.min(window.innerWidth, window.innerHeight );
var wWidth;
var wHeight;

var deltaTime = 1;
var lastTick = Date.now();

var finalPosition = { x: 0, y: 0, z: 0 };
var moveSpeed = 1;
var oscillSpeed = 0.01;
var moveThreshold = 0.1;	//distance from finalPosition to start oscillating

// Screen Resizing
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
	var size = Math.min(window.innerWidth, window.innerHeight );
	renderer.setSize( size, size );
}

function init() {
	wWidth = sqrSize;
	wHeight = sqrSize;
}

init();

// Init the three.js scene and global vars
var scene = new THREE.Scene();
//var camera = new THREE.OrthographicCamera( wWidth / - 20, wWidth / 20, wHeight / 20, wHeight / - 20, 1, 1000 )
var camera = new THREE.PerspectiveCamera( 75, wWidth/wHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( wWidth, wHeight );
renderer.setClearColor( 0xffffff, 1);
document.body.appendChild( renderer.domElement );

var cubes = new THREE.Object3D();
var currState = cubeState.LERPING;

// Lights
function initScene() {
	var amientLight = new THREE.AmbientLight(0xffffff)
	scene.add(amientLight);
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(0,1,0);
	scene.add(directionalLight);
	
	var cubeSize = 7;
	
	var geometry = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
	var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
	material.side = THREE.BackSide;
	var cube1 = new THREE.Mesh( geometry, material );
	//cubes.add(cube1);
	
	// Load the Blender model
	var cubie = null;
	var loader = new THREE.JSONLoader();
	loader.load('cube3.json', function( geometry, materials) {
		for(var i = -1; i < 2; i++) {
			for(var j = -1; j < 2; j++) {
				for(var k = -1; k < 2; k++) {
					cubie = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
					cubie.position.x = i*2.2;
					cubie.position.y = j*2.2;
					cubie.position.z = k*2.2;
					cubes.add(cubie);
				}
			}
		}
	});
	
	// Load the outside model
	/*var cubieOutline = null;
	var loader = new THREE.JSONLoader();
	loader.load('cubeOutline.json', function( geometry, materials) {
		for(var i = -1; i < 2; i++) {
			for(var j = -1; j < 2; j++) {
				for(var k = -1; k < 2; k++) {
					var mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
					mat.side = THREE.BackSide;
					cubieOutline = new THREE.Mesh( geometry, mat );
					cubieOutline.position.x = i*2.2;
					cubieOutline.position.y = j*2.2;
					cubieOutline.position.z = k*2.2;
					cubieOutline.scale *= 0.95;
					cubes.add(cubieOutline);
				}
			}
		}
	});*/
	
	var geometry2 = new THREE.BoxGeometry( cubeSize * 0.92, cubeSize * 0.92, cubeSize * 0.92 );
	var material2 = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube2 = new THREE.Mesh( geometry2, material2 );
	//cube2.position.x += 0.22;
	//cube2.position.y += 0.22;
	//cube2.position.z += 0.22;
	//cubes.add(cube2);
	scene.add( cubes );
	
	cubes.position.y = 20;
	cubes.velocity = {x: 0, y: 0, z: 0};
	cubes.acceleration = {x: 0, y: 0, z: 0};
	cubes.rotation.x = Math.PI + 0.4;
	cubes.rotation.y = -0.9;
	cubes.rotation.z = -0.4;
	
	camera.position.z = 15;
}

var render = function () {
	// update the time variables
	deltaTime = (Date.now() - lastTick) / 1000.0;
	lastTick = Date.now();
	debug.innerHTML = "Y: " + cubes.position.y;
	
	requestAnimationFrame( render );

	//cubes.rotation.x += 0.01;
	updateCubes();

	renderer.render(scene, camera);
};

function updateCubes() {
	
	switch(currState) {
		case cubeState.LERPING:
			var dist = distance(cubes.position, finalPosition);
			cubes.velocity.y = ( deltaTime * moveSpeed * dist.y) ;
			//debug.innerHTML = dist.y;
			if(Math.abs(dist.y) < moveThreshold) {
				currState = cubeState.OSCILLATING;
			}
			break;
		case cubeState.OSCILLATING:
			var dist = distance(cubes.position, finalPosition);
			cubes.acceleration.y = (deltaTime * oscillSpeed * dist.y / Math.abs(dist.y));
			break;
		default:
		
			break;
	}
	
	cubes.velocity.x += cubes.acceleration.x;
	cubes.velocity.y += cubes.acceleration.y;
	cubes.velocity.z += cubes.acceleration.z;
	cubes.position.x += cubes.velocity.x;
	cubes.position.y += cubes.velocity.y;
	cubes.position.z += cubes.velocity.z;
}

function distance(initialPos, finalPos) {
	return {
		x: finalPos.x - initialPos.x,
		y: finalPos.y - initialPos.y,
		z: finalPos.z - initialPos.z
	};
}

initScene();
resizeCanvas();
render();