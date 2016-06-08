// Main script

var sqrSize = Math.min(window.innerWidth, window.innerHeight );
var wWidth;
var wHeight;



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

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, wWidth/wHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( wWidth, wHeight );
renderer.setClearColor( 0xffffff, 1);
document.body.appendChild( renderer.domElement );

var cubeSize = 3;

var geometry = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
var material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
material.side = THREE.BackSide;
var cube1 = new THREE.Mesh( geometry, material );
var cubes = new THREE.Object3D();
cubes.add(cube1);

var geometry2 = new THREE.BoxGeometry( cubeSize * 0.92, cubeSize * 0.92, cubeSize * 0.92 );
var material2 = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube2 = new THREE.Mesh( geometry2, material2 );
//cube2.position.x += 0.22;
//cube2.position.y += 0.22;
//cube2.position.z += 0.22;
cubes.add(cube2);
scene.add( cubes );
cubes.position.z = -5;

camera.position.z = 5;

var render = function () {
	requestAnimationFrame( render );

	cubes.rotation.x += 0.01;
	cubes.rotation.y += 0.01;

	renderer.render(scene, camera);
};


resizeCanvas();
render();