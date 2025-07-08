import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, camera, renderer;
let player, environment, obstacles, coins;
let score = 0;

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x004466); // Deep blue for water-like background

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20); // Adjusted for a better runner view
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Environment - Ground (Temple Path)
    const groundGeometry = new THREE.PlaneGeometry(10, 200); // Long path
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4226 }); // Earthy brown
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);

    // Player Character (Placeholder - adventurer-like)
    const playerBodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
    const playerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown jacket
    player = new THREE.Mesh(playerBodyGeometry, playerBodyMaterial);
    player.position.set(0, 0.75, 0); // Position above ground
    scene.add(player);

    // Coin (Placeholder - shiny gold)
    const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(2, 1, -10); // Example position
    scene.add(coin);

    // Obstacle (Placeholder - crumbling stone block)
    const obstacleGeometry = new THREE.BoxGeometry(3, 2, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 }); // Slate gray
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(-2, 1, -20); // Example position
    scene.add(obstacle);

    // Obstacles and Coins arrays (will be dynamically generated)
    obstacles = [obstacle];
    coins = [coin];

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    // Gyroscope input handling
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleGyroInput, true);
    } else {
        console.warn("DeviceOrientationEvent not supported on this device.");
    }

    // Placeholder for ambient jungle sounds
    // const audio = new Audio('path/to/jungle_ambient.mp3');
    // audio.loop = true;
    // audio.play();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let gameSpeed = 0.1;

function animate() {
    requestAnimationFrame(animate);

    // Player movement (continuous forward motion)
    player.position.z -= gameSpeed;
    camera.position.z -= gameSpeed; // Camera follows player

    // Coin rotation
    coins.forEach(coin => {
        coin.rotation.y += 0.05;
    });

    // Simple score update based on distance
    score = Math.floor(-player.position.z / 10); // Score increases as player moves forward
    updateScore(0); // Update display

    // Game logic updates here (placeholders for more complex logic)
    // Obstacle generation logic would go here
    // Collision detection logic would go here

    renderer.render(scene, camera);
}

// Placeholder for gyroscope input
function handleGyroInput(event) {
    const { beta, gamma } = event; // beta for front-back tilt, gamma for left-right tilt
    const sensitivity = 0.1; // Adjust as needed

    // Use gamma for left-right movement (roll)
    // Limit player's x position to stay within the path
    player.position.x = THREE.MathUtils.clamp(player.position.x + (gamma * sensitivity * 0.01), -4, 4);

    // Optional: Use beta for subtle forward/backward tilt if desired, or for jump/slide
    // For example, if beta exceeds a threshold, trigger a jump or slide
}


// Placeholder for score update
function updateScore(points) {
    score += points;
    document.getElementById('score-display').innerText = `Score: ${score}`;
}

init();