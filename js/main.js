// Main script

var mouse = {x: 0, y: 0};

var deltaTime = 1;
var lastTick = Date.now();

// position animation vars
var finalPosition = { x: 0, y: 0, z: 0 };
var moveSpeed = 1;
var oscillSpeed = 0.01;
var moveThreshold = 0.2;	//distance from finalPosition to start oscillating

// rotation animation vars
var fixedRotation = {
	x: Math.PI + 0.4,
	y: -0.9,
	z: -0.4
};
var minRotDist = 8;
var isRotating = false;
var snapBackSpeed = 1;

// selection vars
var fadeSpeed = 2;
var maxOpacity = 0.8;
var minOpactiy = 0.001;

// Init the three.js scene and global vars
var scene = new THREE.Scene();
//var camera = new THREE.OrthographicCamera( wWidth / - 20, wWidth / 20, wHeight / 20, wHeight / - 20, 1, 1000 )
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var canvas = document.getElementById("cubeCanvas");

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor( 0xffffff, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.gammaInput = true;
renderer.gammaOutput = true;
document.body.appendChild( renderer.domElement );

var cubes = new THREE.Object3D();
var yellowPlane = new THREE.Object3D();
var redPlane = new THREE.Object3D();
var bluePlane = new THREE.Object3D();
var planes = [yellowPlane, redPlane, bluePlane];
var currState = cubeState.LERPING;
var raycaster = new THREE.Raycaster();


// Event Listeners
window.addEventListener('resize', resizeCanvas, false);
canvas.addEventListener( 'mousemove', mouseOver );
document.addEventListener( 'mousedown', onMouseDown, false);
document.addEventListener( 'touchstart', onTouchStart, false);

function resizeCanvas() {
	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseDown( event ) {
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObjects(planes);
	
	if(intersects.length > 0) {
		// object selected can be found in intersects[0]
		//intersects[0].object.material.opacity = maxOpacity;
		//debug.innerHTML = intersects[0].object.material.opacity;
		switch(intersects[0].object.material.color.getHex()) {
			case 0xffff00: selectedYellow(); break;
			case 0xff0000: selectedRed(); break;
			case 0x0000ff: selectedBlue(); break;
		}
	}
}

function onTouchStart( event ) {
	event.preventDefault();
	
	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	onMouseDown(event);
}

function mouseOver( event ) {
	var vector = new THREE.Vector3();

	vector.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1,
		0.5 );
		
	raycaster.setFromCamera(vector, camera);
	var intersects = raycaster.intersectObjects(planes);
	
	if(intersects.length > 0) {
		for (var i = 0; i < planes.length; i++) {
			planes[i].selected = (intersects[0].object === planes[i]);
		}
	}
	else {
		for (var i = 0; i < planes.length; i++) {
			planes[i].selected = false;
		}
	}
	
	
	
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
	
	
	//debug.innerHTML = "x: " + pos.x + " y: " + pos.y;
}

function selectedYellow() {
	//renderer.setClearColor( 0xffff00, 1);
	currState = cubeState.EXITING;
	cubes.acceleration.y = 0.5;
	cubes.velocity.y = -1.5;
}

function selectedRed() {
	//renderer.setClearColor( 0xff0000, 1);
	currState = cubeState.EXITING;
	cubes.acceleration.x = 0.5;
	cubes.velocity.x = -2.0;
}

function selectedBlue() {
	//renderer.setClearColor( 0x0000ff, 1);
	currState = cubeState.EXITING;
	cubes.acceleration.x = -0.5;
	cubes.velocity.x = 2.0;
}

function initScene() {
	// Lights
	var amientLight = new THREE.AmbientLight(0xffffff, 0.2)
	scene.add(amientLight);
	var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(0,1,0);
	scene.add(directionalLight);
	directionalLight.castShadow = true;
	directionalLight.shadow.camera.visible = true;
	directionalLight.shadow.mapSize.width = window.innerWidth;
	directionalLight.shadow.mapSize.height = window.innerHeight;
	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 200;
	
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
					if(!(i == 0 && j == 0 && k == 0)) {
						cubie = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
						cubie.position.x = i*2.2;
						cubie.position.y = j*2.2;
						cubie.position.z = k*2.2;
						cubes.add(cubie);
						cubie.castShadow = true;
					}
				}
			}
		}
	});
	
	
	var geometry2 = new THREE.BoxGeometry( 30, 1, 30 );
	var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff } );
	var cube2 = new THREE.Mesh( geometry2, material2 );
	cube2.position.y -= 6.5;
	scene.add(cube2);
	cube2.receiveShadow = true;
	
	// Selector planes geometry
	var planeSize = 7;
	var geometry = new THREE.PlaneGeometry( planeSize, planeSize, 1, 1 );
	var ymaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, transparent: true, opacity: 0} );
	var rmaterial = new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0} );
	var bmaterial = new THREE.MeshBasicMaterial( {color: 0x0000ff, transparent: true, opacity: 0} );
	var planeDist = 3.5;
	yellowPlane = new THREE.Mesh( geometry, ymaterial );
	redPlane = new THREE.Mesh( geometry, rmaterial );
	bluePlane = new THREE.Mesh( geometry, bmaterial );
	yellowPlane.position.y = -planeDist;
	yellowPlane.rotation.x = Math.PI / 2;
	redPlane.position.z = -planeDist;
	redPlane.rotation.x = Math.PI;
	bluePlane.position.x = -planeDist;
	bluePlane.rotation.y = -Math.PI / 2;
	cubes.add(yellowPlane);
	cubes.add(redPlane);
	cubes.add(bluePlane);
	yellowPlane.selected = false;
	redPlane.selected = false;
	bluePlane.selected = false;
	planes = [yellowPlane, redPlane, bluePlane];
	
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
		case cubeState.EXITING:
			
			
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
	
	// update rotation
	if(!isRotating) {
		// Lerp back to origin
		var rotDist = getDistance(cubes.rotation, fixedRotation);
		cubes.rotation.x += (deltaTime * snapBackSpeed * rotDist.x);
		cubes.rotation.y += (deltaTime * snapBackSpeed * rotDist.y);
	}
	
	// update selection panels
	for(var i = 0; i < planes.length; i++) {
		if(planes[i].selected)
			planes[i].material.opacity = maxOpacity;
		else
			if(planes[i].material.opacity > minOpactiy)
				planes[i].material.opacity -= (deltaTime * fadeSpeed);
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