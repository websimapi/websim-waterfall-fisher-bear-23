import * as THREE from 'three';

const darkBrownMat = new THREE.MeshLambertMaterial({ color: 0x4a2d1e });
const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
const treeLeavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const grassMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
const bushMat = new THREE.MeshLambertMaterial({ color: 0x3cb371 });
const sandMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c }); // tan/sand color
const waterMat = new THREE.MeshLambertMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.8 });

function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

function createMountainSide(isLeft) {
    const group = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    const baseWidth = 8, baseDepth = 20, startY = 2, endY = -20;
    const bankEdgeX = 10; // Ground shelves end at x = +/-10
    let currentY = startY, layerCount = 0;
    while (currentY > endY) {
        layerCount++;
        const layerHeight = 3 + Math.random() * 3;
        const widthIncrease = Math.random() * 2;
        const depthIncrease = Math.random() * 2;
        const layerWidth = baseWidth + (layerCount * widthIncrease);
        const layerDepth = baseDepth + (layerCount * depthIncrease);
        const layerX = sign * (bankEdgeX + layerWidth / 2 - 1); // Start just inside the bank edge
        const layerZ = -5 + (Math.random() - 0.5) * 2;
        const layerY = currentY - layerHeight / 2;
        group.add(createVoxel(layerX, layerY, layerZ, layerWidth, layerHeight, layerDepth, rockMat));
        const detailRocks = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < detailRocks; i++) {
            const size = 1 + Math.random() * 2;
            const detailX = layerX + sign * (Math.random() * layerWidth - (layerWidth / 2));
            const detailY = currentY + size / 2;
            const detailZ = layerZ + (Math.random() - 0.5) * layerDepth;
            group.add(createVoxel(detailX, detailY, detailZ, size, size, size, rockMat));
        }
        currentY -= layerHeight;
    }
    return group;
}

function createTree(x, y, z) {
    const group = new THREE.Group();
    const trunkHeight = 1 + Math.random();
    const leavesHeight = 2 + Math.random() * 2;
    group.add(createVoxel(0, trunkHeight/2, 0, 0.5, trunkHeight, 0.5, treeTrunkMat));
    group.add(createVoxel(0, trunkHeight + leavesHeight/2 - 0.5, 0, 1.5, leavesHeight, 1.5, treeLeavesMat));
    group.position.set(x, y, z);
    return group;
}

/* simple bush: chunky voxel blob */
function createBush(x, y, z) {
    const g = new THREE.Group();
    g.add(createVoxel(0, 0.25, 0, 1.2, 0.6, 1.2, bushMat));
    g.add(createVoxel(0.5, 0.35, -0.2, 0.7, 0.5, 0.7, bushMat));
    g.add(createVoxel(-0.4, 0.3, 0.3, 0.8, 0.5, 0.6, bushMat));
    g.position.set(x, y, z);
    return g;
}

export function createScenery() {
    const group = new THREE.Group();

    // Riverbed - add this first to be under the water and other objects.
    const waterWidth = 8;
    const riverLength = 30;
    const cliffEdgeZ = 2.5;
    const riverBedY = 1.9; // Water is at Y=2.0, banks at Y=2.1. Put this just under water.

    const riverBedGeo = new THREE.PlaneGeometry(waterWidth, riverLength);
    const riverBed = new THREE.Mesh(riverBedGeo, sandMat);
    riverBed.rotation.x = -Math.PI / 2;
    riverBed.position.set(0, riverBedY, cliffEdgeZ - riverLength / 2);
    group.add(riverBed);

    // --- NEW: Lower river at the bottom of the waterfall ---
    const lowerRiverY = -18.1;
    const lowerRiverWidth = 8;
    const lowerRiverLength = 40; // make it longer, extending away from camera

    // Lower river bed
    const lowerRiverBedGeo = new THREE.PlaneGeometry(lowerRiverWidth, lowerRiverLength);
    const lowerRiverBed = new THREE.Mesh(lowerRiverBedGeo, sandMat);
    lowerRiverBed.rotation.x = -Math.PI / 2;
    lowerRiverBed.position.set(0, lowerRiverY, cliffEdgeZ + lowerRiverLength / 2); // Flow away from camera
    group.add(lowerRiverBed);

    // Lower river water surface
    const lowerWaterGeo = new THREE.PlaneGeometry(lowerRiverWidth, lowerRiverLength);
    const lowerWater = new THREE.Mesh(lowerWaterGeo, waterMat);
    lowerWater.rotation.x = -Math.PI / 2;
    lowerWater.position.set(0, lowerRiverY + 0.1, cliffEdgeZ + lowerRiverLength / 2); // Flow away from camera
    group.add(lowerWater);

    // Banks for the lower river
    const lowerBankY = lowerRiverY + 0.2;
    const lowerBankThickness = 0.4;
    const lowerBankL = createVoxel(-7, lowerBankY - lowerBankThickness/2, cliffEdgeZ + lowerRiverLength/2, 6, lowerBankThickness, lowerRiverLength, grassMat);
    const lowerBankR = createVoxel( 7, lowerBankY - lowerBankThickness/2, cliffEdgeZ + lowerRiverLength/2, 6, lowerBankThickness, lowerRiverLength, grassMat);
    group.add(lowerBankL, lowerBankR);

    // Add some trees/bushes on the lower banks
    for (let i = 0; i < 5; i++) {
        const z = cliffEdgeZ + 5 + (Math.random() * (lowerRiverLength - 10)); // Position along the new river direction
        group.add(createTree(-7.5 - Math.random(), lowerBankY, z));
        group.add(createTree( 7.5 + Math.random(), lowerBankY, z));
        if (Math.random() > 0.5) group.add(createBush(-8 - Math.random(), lowerBankY, z));
        if (Math.random() > 0.5) group.add(createBush( 8 + Math.random(), lowerBankY, z));
    }

    // --- REVISED: Cliff face behind waterfall ---
    const cliffWallGroup = new THREE.Group();
    cliffWallGroup.position.z = 1.8; // Position the whole wall behind the waterfall
    const cliffHeight = 22; // from y=2 to y=-20
    const cliffWidth = 10;
    
    // Create a base wall
    cliffWallGroup.add(createVoxel(0, -9, 0, cliffWidth, cliffHeight, 1.2, rockMat));
    
    // Add procedural, overlapping rock chunks for a more natural look
    for (let i = 0; i < 25; i++) {
        const w = 2 + Math.random() * 4;
        const h = 2 + Math.random() * 4;
        const d = 0.5 + Math.random() * 1;
        const x = (Math.random() - 0.5) * cliffWidth;
        const y = (Math.random() - 0.5) * cliffHeight;
        const z = (Math.random() - 0.5) * 0.8;
        cliffWallGroup.add(createVoxel(x, y, z, w, h, d, rockMat));
    }
    group.add(cliffWallGroup);

    const logGeo = new THREE.CylinderGeometry(0.7, 0.7, 9, 8);
    const log = new THREE.Mesh(logGeo, darkBrownMat);
    log.name = "log";
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 2.7, 4);
    group.add(log);
    const leftMountain = createMountainSide(true);
    const rightMountain = createMountainSide(false);
    group.add(leftMountain);
    group.add(rightMountain);
    // green ground shelves along both sides. Water is at y=2.0. Banks are slightly higher.
    const groundY = 2.1;
    const groundThickness = 0.4;
    const groundL = createVoxel(-7, groundY - groundThickness/2, -8, 6, groundThickness, 24, grassMat);
    const groundR = createVoxel( 7, groundY - groundThickness/2, -8, 6, groundThickness, 24, grassMat);
    group.add(groundL, groundR);

    // Adjusted tree/bush positions to be on the grass banks (x is between +/-4 and +/-10)
    group.add(createTree(-7, groundY, 0));
    group.add(createTree(-8, groundY, -5));
    group.add(createTree(-6, groundY, -10));
    group.add(createTree(7, groundY, -2));
    group.add(createTree(9, groundY, 2));
    group.add(createTree(8, groundY, -8));

    for (let i=0;i<12;i++){ const z=-26-Math.random()*24, x=(Math.random()<0.5?-12:12)+(Math.random()*4-2), w=4+Math.random()*6, h=1.5+Math.random()*2.5, d=5+Math.random()*8; group.add(createVoxel(x, 1.2-Math.random()*1.5, z, w, h, d, rockMat)); }
    // additional dense forest scatter
    for (let i = 0; i < 6; i++) {
        const z = -12 + Math.random() * 18;
        group.add(createTree(-7 - Math.random()*2, groundY, z));
        group.add(createTree( 7 + Math.random()*2, groundY, z + (Math.random()-0.5)*2));
        if (Math.random() > 0.6) group.add(createBush(-7.2 - Math.random()*2, groundY, z + Math.random()*2-1));
        if (Math.random() > 0.6) group.add(createBush( 7.2 + Math.random()*2, groundY, z + Math.random()*2-1));
    }

    // --- Distant Terrain Generation ---
    const distantTerrainGroup = new THREE.Group();
    const terrainColors = [
        grassMat, 
        rockMat,
        new THREE.MeshLambertMaterial({ color: 0x287a4b }), // Darker green
        new THREE.MeshLambertMaterial({ color: 0x707070 })  // Darker rock
    ];

    for (let i = 0; i < 150; i++) {
        const z = -50 - (Math.random() * 150); // Position from z=-50 to z=-200
        const isFar = z < -100;

        const side = Math.random() < 0.5 ? -1 : 1;
        const x = side * (15 + Math.random() * 60); // Place them wider than the immediate banks

        const w = 8 + Math.random() * (isFar ? 35 : 18);
        const d = 8 + Math.random() * (isFar ? 35 : 18);
        const h = 5 + Math.random() * (isFar ? 50 : 25);

        const y = -15 + h / 2; // Position them lower down to look like mountains rising

        const mat = terrainColors[Math.floor(Math.random() * terrainColors.length)];
        const terrainChunk = createVoxel(x, y, z, w, h, d, mat);
        distantTerrainGroup.add(terrainChunk);

        // Add a secondary smaller chunk sometimes for more natural, lumpy shapes
        if (Math.random() > 0.6) {
             const w2 = w * (0.4 + Math.random() * 0.4);
             const d2 = d * (0.4 + Math.random() * 0.4);
             const h2 = h * (0.4 + Math.random() * 0.4);
             const x2 = x + (Math.random() - 0.5) * w;
             const z2 = z + (Math.random() - 0.5) * d;
             const y2 = y + (Math.random() - 0.5) * h * 0.5;
             const secondaryChunk = createVoxel(x2, y2, z2, w2, h2, d2, mat);
             distantTerrainGroup.add(secondaryChunk);
        }
    }
    group.add(distantTerrainGroup);

    return group;
}