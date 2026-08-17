document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("iglesia-canvas-container");
    if (!container) return;
    if (typeof THREE === "undefined") {
        const loading = document.getElementById("canvas-loading");
        if (loading) loading.innerHTML = "Error: No se pudo cargar el motor 3D. Refresca la página.";
        return;
    }

    // Remove loading text
    const loading = document.getElementById("canvas-loading");
    if (loading) loading.style.display = "none";

    // Basic Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e5ec);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(-15, 12, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.target.set(0, 4, 3);
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    dirLight.position.set(-10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xb5a898, // Cuarcita irregular
        roughness: 0.9,
    });
    
    const roofMat = new THREE.MeshStandardMaterial({ 
        color: 0x3a3c42, // Pizarra oscura
        roughness: 0.8,
    });

    const brickMat = new THREE.MeshStandardMaterial({
        color: 0xa85842, // Ladrillo
        roughness: 0.9
    });

    // Group for the church
    const church = new THREE.Group();

    // Helper function to create a block with a roof
    function createBlock(w, h, d, x, z, roofType, roofH) {
        const group = new THREE.Group();
        
        // Walls
        const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        walls.position.y = h / 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        group.add(walls);

        // Roof
        let roofGeo;
        let roofMesh;
        if (roofType === 4) { // 4-aguas (Pyramid)
            roofGeo = new THREE.ConeGeometry(Math.sqrt(w*w + d*d)/2, roofH, 4);
            roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.y = h + roofH / 2;
            roofMesh.rotation.y = Math.PI / 4;
        } else if (roofType === 2) { // 2-aguas (Prism along Z axis)
            roofGeo = new THREE.CylinderGeometry(0, w/2, d, 4, 1, false, Math.PI/4);
            roofMesh = new THREE.Mesh(roofGeo, roofMat);
            // Cylinder is along Y, we need it along Z
            roofMesh.rotation.x = Math.PI / 2;
            roofMesh.rotation.y = Math.PI / 4;
            roofMesh.position.y = h + (w/2) / 2;
            // Actually it's easier to use a BoxGeometry and rotate it, or a custom shape.
            // Let's use a ConeGeometry with 4 sides rotated to match the block width.
            // A prism can be made by a ConeGeometry(radius, height, 4) rotated.
            // For simplicity, a ConeGeometry with 4 sides is a pyramid (4 aguas).
            // A 2-aguas roof can be made by a BoxGeometry rotated 45 degrees.
        }
        
        // To make beautiful roofs, let's use ConeGeometry(radius, height, radialSegments)
        // 4 aguas: ConeGeometry(radius, height, 4)
        if (roofType === 4 || roofType === 3 || roofType === 2 || roofType === 1) {
            // For a general architectural look, a 4-sided pyramid looks great for the Cruzero
            if (roofType === 4) {
                roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.8, roofH, 4);
                roofMesh = new THREE.Mesh(roofGeo, roofMat);
                roofMesh.rotation.y = Math.PI / 4;
                roofMesh.position.y = h + roofH / 2;
            } else if (roofType === 2) {
                // Nave roof: a wedge
                const shape = new THREE.Shape();
                shape.moveTo(-w/2, 0);
                shape.lineTo(w/2, 0);
                shape.lineTo(0, roofH);
                shape.lineTo(-w/2, 0);
                const extrudeSettings = { depth: d, bevelEnabled: false };
                roofGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                roofMesh = new THREE.Mesh(roofGeo, roofMat);
                roofMesh.position.z = -d/2;
                roofMesh.position.y = h;
            } else if (roofType === 3) {
                // 3 aguas for presbytery and chapels: we approximate with a 4-sided pyramid
                roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.7, roofH, 4);
                roofMesh = new THREE.Mesh(roofGeo, roofMat);
                roofMesh.rotation.y = Math.PI / 4;
                roofMesh.position.y = h + roofH / 2;
            } else if (roofType === 1) {
                // 1 agua for sacristy: sloped box
                roofGeo = new THREE.BoxGeometry(w, 0.2, d);
                roofMesh = new THREE.Mesh(roofGeo, roofMat);
                roofMesh.position.y = h + 0.1;
                roofMesh.position.z = -d*0.1;
                roofMesh.rotation.x = Math.PI / 12; // sloped
            }
            
            if (roofMesh) {
                roofMesh.castShadow = true;
                roofMesh.receiveShadow = true;
                group.add(roofMesh);
            }
        }

        group.position.set(x, 0, z);
        return group;
    }

    // DIMENSIONS (Approximate from infographic)
    // Scale: 1 unit = ~1 meter
    
    // Crucero (Crossing) - Central block
    const crucero = createBlock(4, 5, 4, 0, 0, 4, 2.5);
    church.add(crucero);

    // Nave (West of crucero)
    const nave = createBlock(3.6, 4, 6, 0, 5, 2, 1.8);
    church.add(nave);

    // Presbiterio (East of crucero)
    const presbiterio = createBlock(3.2, 4, 3.5, 0, -3.75, 3, 1.8);
    church.add(presbiterio);

    // Capilla Lateral 1 (North)
    const capillaN = createBlock(2.5, 3.5, 2.5, -3.25, 0, 3, 1.5);
    church.add(capillaN);

    // Capilla Lateral 2 (South)
    const capillaS = createBlock(2.5, 3.5, 2.5, 3.25, 0, 3, 1.5);
    church.add(capillaS);

    // Sacristia (Attached to Presbiterio, South-East)
    const sacristia = createBlock(2, 2.5, 2.5, 2.6, -3.25, 1, 0.5);
    church.add(sacristia);

    // Espadaña (Bell Gable) - West facade of Nave
    const espGroup = new THREE.Group();
    // Base of espadaña (slightly wider than nave)
    const espBase = new THREE.Mesh(new THREE.BoxGeometry(4, 5.5, 0.6), wallMat);
    espBase.position.y = 5.5 / 2;
    espBase.castShadow = true;
    espBase.receiveShadow = true;
    espGroup.add(espBase);

    // Triangle top
    const espShape = new THREE.Shape();
    espShape.moveTo(-2, 0);
    espShape.lineTo(2, 0);
    espShape.lineTo(0, 3);
    espShape.lineTo(-2, 0);
    
    // Holes (campanas)
    const hole1 = new THREE.Path();
    hole1.moveTo(-1, 0.2);
    hole1.lineTo(-1, 1);
    hole1.absarc(-0.5, 1, 0.5, Math.PI, 0, true);
    hole1.lineTo(0, 0.2);
    hole1.lineTo(-1, 0.2);
    espShape.holes.push(hole1);

    const hole2 = new THREE.Path();
    hole2.moveTo(0.2, 0.2);
    hole2.lineTo(0.2, 1);
    hole2.absarc(0.7, 1, 0.5, Math.PI, 0, true);
    hole2.lineTo(1.2, 0.2);
    hole2.lineTo(0.2, 0.2);
    espShape.holes.push(hole2);

    const hole3 = new THREE.Path();
    hole3.moveTo(-0.4, 1.6);
    hole3.lineTo(-0.4, 2);
    hole3.absarc(0, 2, 0.4, Math.PI, 0, true);
    hole3.lineTo(0.4, 1.6);
    hole3.lineTo(-0.4, 1.6);
    espShape.holes.push(hole3);

    const espExtrude = { depth: 0.6, bevelEnabled: false };
    const espGeo = new THREE.ExtrudeGeometry(espShape, espExtrude);
    const espTop = new THREE.Mesh(espGeo, wallMat);
    espTop.position.set(0, 5.5, -0.3);
    espTop.castShadow = true;
    espTop.receiveShadow = true;
    espGroup.add(espTop);

    // Small crosses on espadaña and crucero
    function createCross() {
        const cMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), cMat);
        const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), cMat);
        horizontal.position.y = 0.2;
        const g = new THREE.Group();
        g.add(vertical);
        g.add(horizontal);
        return g;
    }

    const crossEsp = createCross();
    crossEsp.position.set(0, 8.9, 0);
    espGroup.add(crossEsp);

    // Position espadaña at the front of the nave (Z +)
    espGroup.position.set(0, 0, 8);
    church.add(espGroup);

    const crossCru = createCross();
    crossCru.position.set(0, 7.9, 0);
    church.add(crossCru);

    scene.add(church);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x6e8065 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Portón del cementerio (Brick arch at the South-West)
    const archGroup = new THREE.Group();
    const pillarGeo = new THREE.BoxGeometry(0.6, 2.5, 0.6);
    const p1 = new THREE.Mesh(pillarGeo, brickMat);
    p1.position.set(-1.2, 1.25, 0);
    p1.castShadow = true;
    const p2 = new THREE.Mesh(pillarGeo, brickMat);
    p2.position.set(1.2, 1.25, 0);
    p2.castShadow = true;
    
    // Arch top (triangle)
    const archTopGeo = new THREE.ConeGeometry(1.6, 1, 4);
    const archTop = new THREE.Mesh(archTopGeo, brickMat);
    archTop.rotation.y = Math.PI / 4;
    archTop.position.set(0, 3, 0);
    archTop.castShadow = true;
    
    const crossArch = createCross();
    crossArch.position.set(0, 3.9, 0);

    archGroup.add(p1);
    archGroup.add(p2);
    archGroup.add(archTop);
    archGroup.add(crossArch);
    
    archGroup.position.set(6, 0, 8); // South-West of church
    scene.add(archGroup);

    // Render loop
    window.addEventListener("resize", () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    const animate = function () {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };

    animate();
});
