// Main script

var sqrSize = Math.min(window.innerWidth, window.innerHeight );
var wWidth;
var wHeight;

var deltaTime = 1;
var lastTick = Date.now();

var finalPosition = { x: 0, y: 0, z: 0 };
var moveSpeed = 1;
var oscillSpeed = 0.01;
var moveThreshold = 0.2;	//distance from finalPosition to start oscillating

var fixedRotation = {
	x: Math.PI + 0.4,
	y: -0.9,
	z: -0.4
};
var minRotDist = 8;
var isRotating = false;
var snapBackSpeed = 1;


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

// Event Listeners
window.addEventListener('resize', resizeCanvas, false);
document.getElementsByTagName('canvas')[0].addEventListener( 'mousemove', mouseOver );
document.addEventListener( 'mousedown', onMouseDown, false);
document.addEventListener( 'touchstart', onTouchStart, false);

function resizeCanvas() {
	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseDown( event ) {
	
}

function onTouchStart( event ) {
	
}

function mouseOver( event ) {
	var vector = new THREE.Vector3();

	vector.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1,
		0.5 );
	
	vector.unproject( camera );
	
	var dir = vector.sub( camera.position ).normalize();
	
	var distance = - camera.position.z / dir.z;
	
	var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
	var dist = getDistance(pos, {x: 0, y: 0, z: 0});
	
	if(dist.magnitude < minRotDist) {
		isRotating = true;
		cubes.rotation.x = fixedRotation.x - dist.y * Math.PI / 180;
		cubes.rotation.y = fixedRotation.y - dist.x * Math.PI / 180;
	}
	else
		isRotating = false;
	
	
	debug.innerHTML = "x: " + pos.x + " y: " + pos.y;
}

function initScene() {
	// Lights
	var amientLight = new THREE.AmbientLight(0xffffff)
	scene.add(amientLight);
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(0,1,0);
	scene.add(directionalLight);
	
	var cubeSize = 7;
	
	// Objects
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
	cubes.rotation.x = fixedRotation.x;
	cubes.rotation.y = fixedRotation.y;
	cubes.rotation.z = fixedRotation.z;
	
	camera.position.z = 15;
}

var render = function () {
	// update the time variables
	deltaTime = (Date.now() - lastTick) / 1000.0;
	lastTick = Date.now();
	//debug.innerHTML = "Y: " + cubes.position.y;
	
	requestAnimationFrame( render );

	//cubes.rotation.x += 0.01;
	updateCubes();

	renderer.render(scene, camera);
};

function updateCubes() {
	
	switch(currState) {
		case cubeState.LERPING:
			var dist = getDistance(cubes.position, finalPosition);
			cubes.velocity.y = ( deltaTime * moveSpeed * dist.y) ;
			//debug.innerHTML = dist.y;
			if(Math.abs(dist.y) < moveThreshold) {
				currState = cubeState.OSCILLATING;
			}
			break;
		case cubeState.OSCILLATING:
			var dist = getDistance(cubes.position, finalPosition);
			cubes.acceleration.y = (deltaTime * oscillSpeed * dist.y / Math.abs(dist.y));
			if(cubes.position.y > moveThreshold)
				cubes.position.y = moveThreshold;
			else if(cubes.position.y < -moveThreshold)
				cubes.position.y = -moveThreshold;
			break;
		default:
		
			break;
	}
	
	// update physics
	cubes.velocity.x += cubes.acceleration.x;
	cubes.velocity.y += cubes.acceleration.y;
	cubes.velocity.z += cubes.acceleration.z;
	cubes.position.x += cubes.velocity.x;
	cubes.position.y += cubes.velocity.y;
	cubes.position.z += cubes.velocity.z;
	
	//update rotation
	if(!isRotating) {
		// Lerp back to origin
		var rotDist = getDistance(cubes.rotation, fixedRotation);
		cubes.rotation.x += (deltaTime * snapBackSpeed * rotDist.x);
		cubes.rotation.y += (deltaTime * snapBackSpeed * rotDist.y);
	}
}

function getDistance(initialPos, finalPos) {
	var dist = {x: 0, y: 0, z: 0, magnitude: 0};
	dist.x = finalPos.x - initialPos.x;
	dist.y = finalPos.y - initialPos.y;
	dist.z = finalPos.z - initialPos.z;
	dist.magnitude = Math.sqrt(Math.pow(dist.x, 2) + Math.pow(dist.y, 2) + Math.pow(dist.z, 2));
	return dist;
}


initScene();
resizeCanvas();
render();