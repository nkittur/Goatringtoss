// ============================================================
// GOAT RING TOSS - Babylon.js Mobile Game
// ============================================================

(function () {
    "use strict";

    // ---- Constants ----
    const STORAGE_KEY = "goatRingTossHighScores";
    const MAX_HIGH_SCORES = 5;
    const FIELD_WIDTH = 12;
    const FIELD_DEPTH = 20;
    const GOAT_Y = 0;
    const RING_RADIUS = 0.55;
    const RING_TUBE = 0.07;

    // ---- Goat type definitions ----
    const GOAT_TYPES = {
        billy: {
            name: "Billy",
            gender: "male",
            scale: 1.0,
            speed: 1.0,
            points: 100,
            color: [0.82, 0.68, 0.46],
            hornScale: 1.3,
            bodyLength: 1.1,
            desc: "Big & slow"
        },
        nanny: {
            name: "Nanny",
            gender: "female",
            scale: 0.75,
            speed: 1.5,
            points: 200,
            color: [0.9, 0.85, 0.8],
            hornScale: 0.6,
            bodyLength: 0.9,
            desc: "Medium & quick"
        },
        kid: {
            name: "Kid",
            gender: "baby",
            scale: 0.5,
            speed: 2.2,
            points: 500,
            color: [1.0, 0.95, 0.88],
            hornScale: 0.0,
            bodyLength: 0.65,
            desc: "Tiny & very fast"
        },
        bigBilly: {
            name: "Big Billy",
            gender: "male",
            scale: 1.3,
            speed: 0.6,
            points: 50,
            color: [0.55, 0.42, 0.32],
            hornScale: 1.8,
            bodyLength: 1.4,
            desc: "Huge & very slow"
        },
        swiftNanny: {
            name: "Swift Nanny",
            gender: "female",
            scale: 0.65,
            speed: 2.8,
            points: 350,
            color: [0.95, 0.75, 0.75],
            hornScale: 0.5,
            bodyLength: 0.8,
            desc: "Small & very fast"
        }
    };

    // ---- Level definitions ----
    const LEVELS = [
        {
            level: 1,
            name: "The Pasture",
            desc: "Easy pickings! Big slow billies roaming around.",
            rings: 8,
            goats: [
                { type: "billy", count: 3 },
                { type: "bigBilly", count: 1 }
            ],
            targetScore: 150,
            timeLimit: 0,
            fieldColor: [0.35, 0.55, 0.2]
        },
        {
            level: 2,
            name: "Mixed Herd",
            desc: "Nannies join the field. They're quicker!",
            rings: 8,
            goats: [
                { type: "billy", count: 2 },
                { type: "nanny", count: 3 }
            ],
            targetScore: 400,
            timeLimit: 0,
            fieldColor: [0.3, 0.5, 0.22]
        },
        {
            level: 3,
            name: "Kids' Play",
            desc: "Baby goats appear! Tiny but worth big points.",
            rings: 10,
            goats: [
                { type: "billy", count: 2 },
                { type: "nanny", count: 2 },
                { type: "kid", count: 2 }
            ],
            targetScore: 800,
            timeLimit: 0,
            fieldColor: [0.28, 0.48, 0.18]
        },
        {
            level: 4,
            name: "Speed Herd",
            desc: "Swift nannies dash across the field!",
            rings: 10,
            goats: [
                { type: "nanny", count: 2 },
                { type: "kid", count: 3 },
                { type: "swiftNanny", count: 2 }
            ],
            targetScore: 1200,
            timeLimit: 0,
            fieldColor: [0.25, 0.45, 0.15]
        },
        {
            level: 5,
            name: "The Grand Stampede",
            desc: "All goat types! Can you master the toss?",
            rings: 12,
            goats: [
                { type: "bigBilly", count: 1 },
                { type: "billy", count: 2 },
                { type: "nanny", count: 2 },
                { type: "swiftNanny", count: 2 },
                { type: "kid", count: 3 }
            ],
            targetScore: 2000,
            timeLimit: 0,
            fieldColor: [0.22, 0.42, 0.12]
        },
        {
            level: 6,
            name: "Endless Meadow",
            desc: "Infinite mode! How high can you score?",
            rings: 15,
            goats: [
                { type: "bigBilly", count: 2 },
                { type: "billy", count: 3 },
                { type: "nanny", count: 3 },
                { type: "swiftNanny", count: 3 },
                { type: "kid", count: 4 }
            ],
            targetScore: 99999,
            timeLimit: 0,
            fieldColor: [0.2, 0.4, 0.1]
        }
    ];

    // ---- State ----
    let canvas, engine, scene, camera;
    let currentLevel = 0;
    let score = 0;
    let levelScore = 0;
    let ringsLeft = 0;
    let ringsThrown = 0;
    let ringsLanded = 0;
    let isPlaying = false;
    let canThrow = true;
    let activeGoats = [];
    let activeRings = [];
    let groundMesh = null;
    let fenceMeshes = [];
    let swipeStart = null;
    let swipeStartTime = 0;
    let shadowGenerator = null;
    let glowLayer = null;
    let goatInfoTimeout = null;
    let levelEnding = false;

    // ---- DOM refs ----
    const hudEl = document.getElementById("hud");
    const hudScore = document.getElementById("hud-score");
    const hudLevel = document.getElementById("hud-level");
    const hudHigh = document.getElementById("hud-high");
    const ringsDisplay = document.getElementById("rings-display");
    const swipeHint = document.getElementById("swipe-hint");
    const goatInfoEl = document.getElementById("goat-info");

    const startScreen = document.getElementById("start-screen");
    const levelScreen = document.getElementById("level-screen");
    const completeScreen = document.getElementById("complete-screen");
    const gameoverScreen = document.getElementById("gameover-screen");

    // ---- High Scores ----
    function getHighScores() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveHighScore(s) {
        let scores = getHighScores();
        scores.push({ score: s, date: new Date().toLocaleDateString() });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, MAX_HIGH_SCORES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        return scores;
    }

    function renderHighScores(container) {
        const scores = getHighScores();
        if (scores.length === 0) {
            container.innerHTML = "";
            return;
        }
        let html = '<h3>High Scores</h3>';
        scores.forEach((s, i) => {
            html += `<div class="score-row">
                <span class="rank">${i + 1}.</span>
                <span class="name">${s.date}</span>
                <span class="pts">${s.score.toLocaleString()}</span>
            </div>`;
        });
        container.innerHTML = html;
    }

    function getTopScore() {
        const scores = getHighScores();
        return scores.length > 0 ? scores[0].score : 0;
    }

    // ---- Babylon Setup ----
    function initEngine() {
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            adaptToDeviceRatio: true
        });

        window.addEventListener("resize", () => engine.resize());
        createScene();
        engine.runRenderLoop(() => {
            if (scene) scene.render();
        });
    }

    function createScene() {
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
        scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        scene.collisionsEnabled = true;

        // Fog for depth
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = new BABYLON.Color3(0.53, 0.81, 0.92);
        scene.fogStart = 25;
        scene.fogEnd = 50;

        // Camera - fixed perspective looking down at the field
        camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 5, -8), scene);
        camera.setTarget(new BABYLON.Vector3(0, 1, 8));
        camera.fov = 0.9;
        // No camera controls - fixed viewpoint

        // Lights
        const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0.3), scene);
        hemi.intensity = 0.6;
        hemi.groundColor = new BABYLON.Color3(0.3, 0.25, 0.2);

        const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.5, -1, 0.5), scene);
        dir.position = new BABYLON.Vector3(10, 15, -10);
        dir.intensity = 0.8;

        // Shadows
        shadowGenerator = new BABYLON.ShadowGenerator(1024, dir);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 16;

        // Glow
        glowLayer = new BABYLON.GlowLayer("glow", scene);
        glowLayer.intensity = 0.3;

        // Ground
        createGround([0.35, 0.55, 0.2]);

        // Skybox elements
        createSkyElements();

        // Fences
        createFences();
    }

    function createGround(color) {
        if (groundMesh) groundMesh.dispose();

        groundMesh = BABYLON.MeshBuilder.CreateGround("ground", {
            width: FIELD_WIDTH * 3,
            height: FIELD_DEPTH * 3
        }, scene);
        groundMesh.position.z = FIELD_DEPTH / 2;
        const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
        groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        groundMesh.material = groundMat;
        groundMesh.receiveShadows = true;
    }

    function createSkyElements() {
        // Sun
        const sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 3 }, scene);
        sun.position = new BABYLON.Vector3(8, 15, 20);
        const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.5);
        sunMat.disableLighting = true;
        sun.material = sunMat;

        // Clouds
        for (let i = 0; i < 6; i++) {
            const cloud = BABYLON.MeshBuilder.CreateSphere("cloud" + i, {
                diameterX: 2 + Math.random() * 3,
                diameterY: 0.8 + Math.random() * 0.5,
                diameterZ: 1.5 + Math.random() * 2
            }, scene);
            cloud.position = new BABYLON.Vector3(
                -15 + Math.random() * 30,
                10 + Math.random() * 5,
                10 + Math.random() * 20
            );
            const cloudMat = new BABYLON.StandardMaterial("cloudMat" + i, scene);
            cloudMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            cloudMat.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.45);
            cloudMat.alpha = 0.85;
            cloud.material = cloudMat;

            // Animate clouds
            const anim = new BABYLON.Animation("cloudMove" + i, "position.x", 30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const startX = cloud.position.x;
            anim.setKeys([
                { frame: 0, value: startX },
                { frame: 600 + i * 100, value: startX + 20 },
                { frame: 1200 + i * 200, value: startX }
            ]);
            cloud.animations.push(anim);
            scene.beginAnimation(cloud, 0, 1200 + i * 200, true);
        }
    }

    function createFences() {
        fenceMeshes.forEach(f => f.dispose());
        fenceMeshes = [];

        const fenceMat = new BABYLON.StandardMaterial("fenceMat", scene);
        fenceMat.diffuseColor = new BABYLON.Color3(0.55, 0.35, 0.2);

        // Posts and rails along sides and back
        const positions = [];
        const hw = FIELD_WIDTH / 2;

        // Left fence
        for (let z = 0; z <= FIELD_DEPTH; z += 2) {
            positions.push({ x: -hw, z: z, side: true });
        }
        // Right fence
        for (let z = 0; z <= FIELD_DEPTH; z += 2) {
            positions.push({ x: hw, z: z, side: true });
        }
        // Back fence
        for (let x = -hw; x <= hw; x += 2) {
            positions.push({ x: x, z: FIELD_DEPTH, side: false });
        }

        positions.forEach((p, i) => {
            // Post
            const post = BABYLON.MeshBuilder.CreateCylinder("fpost" + i, {
                height: 1.8, diameter: 0.15
            }, scene);
            post.position = new BABYLON.Vector3(p.x, 0.9, p.z);
            post.material = fenceMat;
            shadowGenerator.addShadowCaster(post);
            fenceMeshes.push(post);
        });

        // Rails
        function addRail(x1, z1, x2, z2, y) {
            const dx = x2 - x1, dz = z2 - z1;
            const len = Math.sqrt(dx * dx + dz * dz);
            const rail = BABYLON.MeshBuilder.CreateCylinder("frail" + fenceMeshes.length, {
                height: len, diameter: 0.08
            }, scene);
            rail.position = new BABYLON.Vector3((x1 + x2) / 2, y, (z1 + z2) / 2);
            rail.rotation.z = Math.PI / 2;
            rail.rotation.y = Math.atan2(dz, dx);
            rail.material = fenceMat;
            fenceMeshes.push(rail);
        }

        // Side rails
        for (let z = 0; z < FIELD_DEPTH; z += 2) {
            addRail(-hw, z, -hw, z + 2, 0.6);
            addRail(-hw, z, -hw, z + 2, 1.3);
            addRail(hw, z, hw, z + 2, 0.6);
            addRail(hw, z, hw, z + 2, 1.3);
        }
        // Back rails
        for (let x = -hw; x < hw; x += 2) {
            addRail(x, FIELD_DEPTH, x + 2, FIELD_DEPTH, 0.6);
            addRail(x, FIELD_DEPTH, x + 2, FIELD_DEPTH, 1.3);
        }
    }

    // ---- Goat Builder ----
    function createGoat(typeName, startPos) {
        const def = GOAT_TYPES[typeName];
        const s = def.scale;
        const root = new BABYLON.TransformNode("goat_" + typeName + "_" + Date.now(), scene);
        root.position = startPos.clone();

        const mainColor = new BABYLON.Color3(def.color[0], def.color[1], def.color[2]);
        const darkColor = mainColor.scale(0.7);

        const bodyMat = new BABYLON.StandardMaterial("goatBodyMat_" + root.name, scene);
        bodyMat.diffuseColor = mainColor;
        bodyMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const darkMat = new BABYLON.StandardMaterial("goatDarkMat_" + root.name, scene);
        darkMat.diffuseColor = darkColor;
        darkMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Body
        const body = BABYLON.MeshBuilder.CreateSphere("body", {
            diameterX: 1.0 * s * def.bodyLength,
            diameterY: 0.7 * s,
            diameterZ: 0.6 * s
        }, scene);
        body.position.y = 0.6 * s;
        body.material = bodyMat;
        body.parent = root;
        shadowGenerator.addShadowCaster(body);

        // Neck
        const neck = BABYLON.MeshBuilder.CreateCylinder("neck", {
            height: 0.4 * s, diameter: 0.2 * s
        }, scene);
        neck.position = new BABYLON.Vector3(0.45 * s * def.bodyLength, 0.85 * s, 0);
        neck.rotation.z = -0.5;
        neck.material = bodyMat;
        neck.parent = root;

        // Head
        const head = BABYLON.MeshBuilder.CreateSphere("head", {
            diameterX: 0.35 * s,
            diameterY: 0.3 * s,
            diameterZ: 0.25 * s
        }, scene);
        head.position = new BABYLON.Vector3(0.6 * s * def.bodyLength, 1.1 * s, 0);
        head.material = bodyMat;
        head.parent = root;
        shadowGenerator.addShadowCaster(head);

        // Snout
        const snout = BABYLON.MeshBuilder.CreateSphere("snout", {
            diameterX: 0.18 * s,
            diameterY: 0.13 * s,
            diameterZ: 0.15 * s
        }, scene);
        snout.position = new BABYLON.Vector3(0.75 * s * def.bodyLength, 1.05 * s, 0);
        snout.material = darkMat;
        snout.parent = root;

        // Eyes
        const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
        eyeMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        eyeMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

        [-1, 1].forEach(side => {
            const eye = BABYLON.MeshBuilder.CreateSphere("eye", {
                diameter: 0.06 * s
            }, scene);
            eye.position = new BABYLON.Vector3(
                0.68 * s * def.bodyLength,
                1.15 * s,
                side * 0.1 * s
            );
            eye.material = eyeMat;
            eye.parent = root;
        });

        // Ears
        [-1, 1].forEach(side => {
            const ear = BABYLON.MeshBuilder.CreateSphere("ear", {
                diameterX: 0.15 * s,
                diameterY: 0.06 * s,
                diameterZ: 0.1 * s
            }, scene);
            ear.position = new BABYLON.Vector3(
                0.55 * s * def.bodyLength,
                1.2 * s,
                side * 0.18 * s
            );
            ear.material = bodyMat;
            ear.parent = root;
        });

        // Horns (if has horns)
        if (def.hornScale > 0) {
            const hornMat = new BABYLON.StandardMaterial("hornMat", scene);
            hornMat.diffuseColor = new BABYLON.Color3(0.85, 0.82, 0.75);

            [-1, 1].forEach(side => {
                const horn = BABYLON.MeshBuilder.CreateCylinder("horn", {
                    height: 0.3 * s * def.hornScale,
                    diameterTop: 0.02 * s,
                    diameterBottom: 0.06 * s
                }, scene);
                horn.position = new BABYLON.Vector3(
                    0.55 * s * def.bodyLength,
                    1.3 * s + 0.1 * s * def.hornScale,
                    side * 0.08 * s
                );
                horn.rotation.z = side * 0.3;
                horn.rotation.x = -0.2;
                horn.material = hornMat;
                horn.parent = root;
            });
        }

        // Beard for males
        if (def.gender === "male") {
            const beard = BABYLON.MeshBuilder.CreateCylinder("beard", {
                height: 0.15 * s,
                diameterTop: 0.08 * s,
                diameterBottom: 0.03 * s
            }, scene);
            beard.position = new BABYLON.Vector3(
                0.7 * s * def.bodyLength,
                0.92 * s,
                0
            );
            beard.material = darkMat;
            beard.parent = root;
        }

        // Udder for females
        if (def.gender === "female") {
            const udderMat = new BABYLON.StandardMaterial("udderMat", scene);
            udderMat.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.8);
            const udder = BABYLON.MeshBuilder.CreateSphere("udder", {
                diameterX: 0.2 * s,
                diameterY: 0.12 * s,
                diameterZ: 0.15 * s
            }, scene);
            udder.position = new BABYLON.Vector3(-0.1 * s, 0.28 * s, 0);
            udder.material = udderMat;
            udder.parent = root;
        }

        // Legs
        const legPositions = [
            { x: 0.3, z: 0.12 }, { x: 0.3, z: -0.12 },
            { x: -0.3, z: 0.12 }, { x: -0.3, z: -0.12 }
        ];

        const legMeshes = [];
        legPositions.forEach((lp, i) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder("leg" + i, {
                height: 0.5 * s, diameter: 0.1 * s
            }, scene);
            leg.position = new BABYLON.Vector3(
                lp.x * s * def.bodyLength,
                0.25 * s,
                lp.z * s
            );
            leg.material = bodyMat;
            leg.parent = root;
            shadowGenerator.addShadowCaster(leg);
            legMeshes.push(leg);

            // Hoof
            const hoof = BABYLON.MeshBuilder.CreateCylinder("hoof" + i, {
                height: 0.06 * s, diameter: 0.12 * s
            }, scene);
            hoof.position = new BABYLON.Vector3(
                lp.x * s * def.bodyLength,
                0.03 * s,
                lp.z * s
            );
            hoof.material = darkMat;
            hoof.parent = root;
        });

        // Tail
        const tail = BABYLON.MeshBuilder.CreateCylinder("tail", {
            height: 0.2 * s,
            diameterTop: 0.04 * s,
            diameterBottom: 0.06 * s
        }, scene);
        tail.position = new BABYLON.Vector3(-0.55 * s * def.bodyLength, 0.85 * s, 0);
        tail.rotation.z = 0.8;
        tail.material = bodyMat;
        tail.parent = root;

        // Ring target - invisible cylinder around the neck/head area for collision
        const targetZone = BABYLON.MeshBuilder.CreateCylinder("target", {
            height: 0.4 * s,
            diameter: RING_RADIUS * 2 * 0.85
        }, scene);
        targetZone.position = new BABYLON.Vector3(0.45 * s * def.bodyLength, 0.9 * s, 0);
        targetZone.isVisible = false;
        targetZone.parent = root;

        // Walking animation
        const walkAnim = new BABYLON.Animation("walk", "position.y", 30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        walkAnim.setKeys([
            { frame: 0, value: body.position.y },
            { frame: 8, value: body.position.y + 0.03 * s },
            { frame: 16, value: body.position.y }
        ]);
        body.animations.push(walkAnim);
        scene.beginAnimation(body, 0, 16, true, 2.0 * def.speed);

        // Leg walk animation
        legMeshes.forEach((leg, i) => {
            const legAnim = new BABYLON.Animation("legWalk" + i, "rotation.x", 30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            const phase = i < 2 ? 0 : 8;
            const altPhase = i % 2 === 0 ? 0 : 8;
            legAnim.setKeys([
                { frame: 0, value: -0.2 },
                { frame: 8, value: 0.2 },
                { frame: 16, value: -0.2 }
            ]);
            leg.animations.push(legAnim);
            scene.beginAnimation(leg, altPhase, 16 + altPhase, true, 2.0 * def.speed);
        });

        // Tail wagging
        const tailAnim = new BABYLON.Animation("tailWag", "rotation.x", 30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        tailAnim.setKeys([
            { frame: 0, value: -0.3 },
            { frame: 10, value: 0.3 },
            { frame: 20, value: -0.3 }
        ]);
        tail.animations.push(tailAnim);
        scene.beginAnimation(tail, 0, 20, true, 1.5);

        return {
            root: root,
            typeName: typeName,
            def: def,
            body: body,
            head: head,
            targetZone: targetZone,
            hasRing: false,
            direction: Math.random() > 0.5 ? 1 : -1,
            moveZ: (Math.random() - 0.5) * 0.3,
            pauseTimer: 0,
            isPaused: false
        };
    }

    // ---- Ring Builder ----
    function createRing(position) {
        const ring = BABYLON.MeshBuilder.CreateTorus("ring", {
            diameter: RING_RADIUS * 2,
            thickness: RING_TUBE * 2,
            tessellation: 32
        }, scene);
        ring.position = position.clone();

        const ringMat = new BABYLON.StandardMaterial("ringMat_" + Date.now(), scene);
        ringMat.diffuseColor = new BABYLON.Color3(0.9, 0.65, 0.1);
        ringMat.specularColor = new BABYLON.Color3(0.8, 0.6, 0.2);
        ringMat.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.02);
        ring.material = ringMat;
        shadowGenerator.addShadowCaster(ring);

        return ring;
    }

    // ---- Goat AI Movement ----
    function updateGoats(dt) {
        activeGoats.forEach(g => {
            if (g.hasRing) return; // Ringed goats stop

            if (g.isPaused) {
                g.pauseTimer -= dt;
                if (g.pauseTimer <= 0) {
                    g.isPaused = false;
                    g.direction = Math.random() > 0.5 ? 1 : -1;
                    g.moveZ = (Math.random() - 0.5) * 0.4;
                }
                return;
            }

            const speed = g.def.speed * 1.5 * dt;
            const pos = g.root.position;

            pos.x += g.direction * speed;
            pos.z += g.moveZ * speed;

            // Keep within field bounds
            const hw = FIELD_WIDTH / 2 - 1;
            if (pos.x > hw) {
                pos.x = hw;
                g.direction = -1;
                g.moveZ = (Math.random() - 0.5) * 0.4;
            } else if (pos.x < -hw) {
                pos.x = -hw;
                g.direction = 1;
                g.moveZ = (Math.random() - 0.5) * 0.4;
            }

            if (pos.z > FIELD_DEPTH - 2) {
                pos.z = FIELD_DEPTH - 2;
                g.moveZ = -Math.abs(g.moveZ);
            } else if (pos.z < 3) {
                pos.z = 3;
                g.moveZ = Math.abs(g.moveZ);
            }

            // Face movement direction
            g.root.rotation.y = g.direction > 0 ? 0 : Math.PI;

            // Random pause
            if (Math.random() < 0.002) {
                g.isPaused = true;
                g.pauseTimer = 0.5 + Math.random() * 2;
            }
        });
    }

    // ---- Ring Physics (simple arc trajectory) ----
    function updateRings(dt) {
        for (let i = activeRings.length - 1; i >= 0; i--) {
            const r = activeRings[i];
            if (r.landed) continue;

            r.velocity.y -= 9.8 * dt; // gravity
            r.mesh.position.addInPlace(r.velocity.scale(dt));

            // Spin the ring while in air
            r.mesh.rotation.x += r.spinSpeed * dt;
            r.mesh.rotation.z += r.wobble * dt;

            // Check in-flight collision with goat necks (ring descending through target height)
            if (r.velocity.y < 0) {
                activeGoats.forEach(g => {
                    if (g.hasRing || r.landed) return;
                    const targetWorldPos = g.targetZone.getAbsolutePosition();
                    const dy = Math.abs(r.mesh.position.y - targetWorldPos.y);
                    if (dy > 0.3 * g.def.scale) return;
                    const dx = r.mesh.position.x - targetWorldPos.x;
                    const dz = r.mesh.position.z - targetWorldPos.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const tolerance = RING_RADIUS * 0.6 + 0.12 * g.def.scale;
                    if (dist < tolerance) {
                        r.landed = true;
                        r.mesh.rotation.x = Math.PI / 2;
                        ringGoat(g, r);
                        ringsThrown++;
                        updateHUD();
                        if (ringsLeft <= 0 && allRingsLanded() && !levelEnding) {
                            levelEnding = true;
                            setTimeout(() => endLevel(), 800);
                        }
                    }
                });
                if (r.landed) continue;
            }

            // Check if ring has hit ground level
            if (r.mesh.position.y <= 0.1) {
                r.mesh.position.y = 0.1;
                r.landed = true;
                r.mesh.rotation.x = Math.PI / 2; // Lay flat

                // Check if any goat is "ringed"
                let hitGoat = null;
                let bestDist = Infinity;

                activeGoats.forEach(g => {
                    if (g.hasRing) return;
                    const targetWorldPos = g.targetZone.getAbsolutePosition();
                    const dx = r.mesh.position.x - targetWorldPos.x;
                    const dz = r.mesh.position.z - targetWorldPos.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    // Ring must land close enough to the goat's neck area
                    const tolerance = RING_RADIUS * 0.7 + 0.15 * g.def.scale;
                    if (dist < tolerance && dist < bestDist) {
                        bestDist = dist;
                        hitGoat = g;
                    }
                });

                if (hitGoat) {
                    ringGoat(hitGoat, r);
                } else {
                    showScorePopup(r.mesh.position, "MISS", true);
                    // Fade ring out
                    fadeOutMesh(r.mesh, 1.5);
                }

                ringsThrown++;
                updateHUD();

                if (ringsLeft <= 0 && allRingsLanded() && !levelEnding) {
                    levelEnding = true;
                    setTimeout(() => endLevel(), 800);
                }
            }
        }
    }

    function allRingsLanded() {
        return activeRings.every(r => r.landed);
    }

    function ringGoat(goat, ring) {
        goat.hasRing = true;
        ringsLanded++;

        // Position ring on goat's neck
        const targetPos = goat.targetZone.getAbsolutePosition();
        ring.mesh.position.x = targetPos.x;
        ring.mesh.position.z = targetPos.z;
        ring.mesh.position.y = targetPos.y;
        ring.mesh.rotation.x = Math.PI / 2;
        ring.mesh.parent = goat.root;
        ring.mesh.position = goat.targetZone.position.clone();
        ring.mesh.rotation.x = Math.PI / 2;

        // Score
        const points = goat.def.points;
        score += points;
        levelScore += points;

        // Visual feedback
        showScorePopup(goat.root.position, "+" + points, false);
        flashGoat(goat);

        // Ring glow + particles
        ring.mesh.material.emissiveColor = new BABYLON.Color3(0.4, 0.3, 0.05);
        createRingParticles(goat.root.position);

        updateHUD();
    }

    function flashGoat(goat) {
        const origColor = goat.body.material.diffuseColor.clone();
        goat.body.material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.1);
        setTimeout(() => {
            if (goat.body.material) {
                goat.body.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
            }
        }, 300);
    }

    // ---- Score Popup ----
    function showScorePopup(worldPos, text, isMiss) {
        // Project 3D position to screen
        const projected = BABYLON.Vector3.Project(
            worldPos,
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
        );

        const popup = document.createElement("div");
        popup.className = "score-popup" + (isMiss ? " miss" : "");
        popup.textContent = text;
        popup.style.left = projected.x + "px";
        popup.style.top = projected.y + "px";
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 1200);
    }

    function fadeOutMesh(mesh, duration) {
        const anim = new BABYLON.Animation("fadeOut", "material.alpha", 30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        anim.setKeys([
            { frame: 0, value: 1 },
            { frame: 30 * duration, value: 0 }
        ]);
        mesh.animations.push(anim);
        scene.beginAnimation(mesh, 0, 30 * duration, false, 1, () => {
            mesh.dispose();
        });
    }

    // ---- Throw Ring ----
    function throwRing(swipeLength, swipeAngle) {
        if (!canThrow || ringsLeft <= 0 || !isPlaying) return;

        canThrow = false;
        ringsLeft--;
        updateHUD();

        // Starting position (from player's perspective)
        const startPos = new BABYLON.Vector3(0, 1.5, -5);

        // Calculate throw power from swipe length (pixels)
        // Short swipe (~50px) → power ~0.1, long swipe (~400px) → power ~1.0
        const screenRef = Math.min(window.innerWidth, window.innerHeight);
        const power = Math.min(Math.max((swipeLength - 40) / (screenRef * 0.5), 0.1), 1.0);

        // Clamp launch angle to +-60 degrees so rings stay in the field
        const clampedAngle = Math.max(-1.05, Math.min(1.05, swipeAngle));

        // Split forward speed into lateral (x) and depth (z) based on swipe angle
        const forwardSpeed = 2 + power * 8;

        const ring = createRing(startPos);

        const throwData = {
            mesh: ring,
            velocity: new BABYLON.Vector3(
                Math.sin(clampedAngle) * forwardSpeed,
                2.5 + power * 3.5,
                Math.cos(clampedAngle) * forwardSpeed
            ),
            landed: false,
            spinSpeed: 8 + Math.random() * 4,
            wobble: (Math.random() - 0.5) * 3
        };

        activeRings.push(throwData);

        // Re-enable throw after short delay
        setTimeout(() => {
            canThrow = true;
        }, 500);

        // Hide swipe hint after first throw
        swipeHint.classList.add("hidden");
    }

    // ---- Swipe Detection ----
    function initSwipeControls() {
        canvas.addEventListener("touchstart", onTouchStart, { passive: false });
        canvas.addEventListener("touchmove", onTouchMove, { passive: false });
        canvas.addEventListener("touchend", onTouchEnd, { passive: false });

        // Also support mouse for desktop testing
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseup", onMouseUp);
    }

    let mouseDown = false;

    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        swipeStart = { x: touch.clientX, y: touch.clientY };
        swipeStartTime = Date.now();
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (!swipeStart) return;

        const touch = e.touches[0];
        const dy = swipeStart.y - touch.clientY;

        // Show goat info based on aim direction
        if (dy > 20) {
            updateGoatInfo(touch.clientX);
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        if (!swipeStart) return;

        const touch = e.changedTouches[0];
        processSwipe(touch.clientX, touch.clientY);
        swipeStart = null;
        hideGoatInfo();
    }

    function onMouseDown(e) {
        mouseDown = true;
        swipeStart = { x: e.clientX, y: e.clientY };
        swipeStartTime = Date.now();
    }

    function onMouseMove(e) {
        if (!mouseDown || !swipeStart) return;
        const dy = swipeStart.y - e.clientY;
        if (dy > 20) {
            updateGoatInfo(e.clientX);
        }
    }

    function onMouseUp(e) {
        if (!mouseDown) return;
        mouseDown = false;
        processSwipe(e.clientX, e.clientY);
        swipeStart = null;
        hideGoatInfo();
    }

    function processSwipe(endX, endY) {
        if (!swipeStart || !isPlaying) return;

        const dx = endX - swipeStart.x;
        const dy = swipeStart.y - endY; // Inverted: swipe up = positive

        if (dy < 40) return; // Must swipe upward enough

        // Use swipe length (pixels) to determine throw power
        const swipeLength = Math.sqrt(dx * dx + dy * dy);

        // Compute real launch angle from swipe direction (radians from vertical)
        // Swipe straight up = 0, swipe up-right = positive, up-left = negative
        const angle = Math.atan2(dx, dy);

        throwRing(swipeLength, angle);
    }

    function updateGoatInfo(screenX) {
        // Find goat closest to aim direction
        const normX = (screenX / window.innerWidth - 0.5) * 2;
        let closestGoat = null;
        let closestDist = Infinity;

        activeGoats.forEach(g => {
            if (g.hasRing) return;
            const dist = Math.abs(g.root.position.x / (FIELD_WIDTH / 2) - normX);
            if (dist < closestDist) {
                closestDist = dist;
                closestGoat = g;
            }
        });

        if (closestGoat && closestDist < 1) {
            goatInfoEl.textContent = `${closestGoat.def.name} - ${closestGoat.def.desc} (${closestGoat.def.points} pts)`;
            goatInfoEl.classList.add("show");
        }
    }

    function hideGoatInfo() {
        goatInfoEl.classList.remove("show");
    }

    // ---- HUD ----
    function updateHUD() {
        hudScore.textContent = score.toLocaleString();
        hudLevel.textContent = currentLevel + 1;
        hudHigh.textContent = getTopScore().toLocaleString();

        // Rings display
        const levelDef = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];
        let html = "";
        for (let i = 0; i < levelDef.rings; i++) {
            const available = i < ringsLeft;
            html += `<div class="ring-icon ${available ? 'available' : ''}"></div>`;
        }
        ringsDisplay.innerHTML = html;
    }

    // ---- Level Management ----
    function showScreen(screen) {
        [startScreen, levelScreen, completeScreen, gameoverScreen].forEach(s => {
            s.classList.add("hidden");
        });
        if (screen) screen.classList.remove("hidden");
    }

    function startGame() {
        score = 0;
        currentLevel = 0;
        showScreen(null);
        showLevelIntro();
    }

    function showLevelIntro() {
        const levelDef = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];
        document.getElementById("level-title").textContent =
            `Level ${currentLevel + 1}: ${levelDef.name}`;
        document.getElementById("level-desc").textContent = levelDef.desc;
        showScreen(levelScreen);
    }

    function startLevel() {
        showScreen(null);
        hudEl.classList.remove("hidden");
        swipeHint.classList.remove("hidden");

        const levelDef = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];

        // Update ground color
        createGround(levelDef.fieldColor);

        // Clear old goats/rings
        clearField();

        ringsLeft = levelDef.rings;
        levelScore = 0;
        ringsThrown = 0;
        ringsLanded = 0;
        canThrow = true;
        isPlaying = true;
        levelEnding = false;

        // Spawn goats
        levelDef.goats.forEach(goatGroup => {
            for (let i = 0; i < goatGroup.count; i++) {
                const pos = new BABYLON.Vector3(
                    (Math.random() - 0.5) * (FIELD_WIDTH - 4),
                    GOAT_Y,
                    4 + Math.random() * (FIELD_DEPTH - 6)
                );
                const goat = createGoat(goatGroup.type, pos);
                activeGoats.push(goat);
            }
        });

        updateHUD();
    }

    function clearField() {
        activeGoats.forEach(g => {
            g.root.getChildMeshes().forEach(m => m.dispose());
            g.root.dispose();
        });
        activeGoats = [];

        activeRings.forEach(r => {
            if (r.mesh && !r.mesh.isDisposed()) r.mesh.dispose();
        });
        activeRings = [];
    }

    function endLevel() {
        isPlaying = false;
        hudEl.classList.add("hidden");
        swipeHint.classList.add("hidden");

        const levelDef = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];
        const passed = levelScore >= levelDef.targetScore || currentLevel >= LEVELS.length - 1;

        const statsHtml = `
            <div class="stat-box">
                <div class="stat-val">${levelScore}</div>
                <div class="stat-label">Level Score</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">${ringsLanded}/${ringsThrown}</div>
                <div class="stat-label">Rings Landed</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">${score}</div>
                <div class="stat-label">Total Score</div>
            </div>
            <div class="stat-box">
                <div class="stat-val">${ringsThrown > 0 ? Math.round(ringsLanded / ringsThrown * 100) : 0}%</div>
                <div class="stat-label">Accuracy</div>
            </div>
        `;

        if (passed && currentLevel < LEVELS.length - 1) {
            // Show level complete
            document.getElementById("level-stats").innerHTML = statsHtml;
            showScreen(completeScreen);
        } else {
            // Game over (final level or didn't meet target)
            const isNewHigh = score > getTopScore();
            document.getElementById("final-score").textContent = "Score: " + score.toLocaleString();
            document.getElementById("new-high-score").style.display = isNewHigh ? "block" : "none";
            saveHighScore(score);
            renderHighScores(document.getElementById("gameover-high-scores"));
            showScreen(gameoverScreen);
        }
    }

    function nextLevel() {
        currentLevel++;
        showScreen(null);
        showLevelIntro();
    }

    // ---- Game Loop ----
    function gameLoop() {
        scene.registerBeforeRender(() => {
            const dt = engine.getDeltaTime() / 1000;
            if (!isPlaying) return;

            updateGoats(dt);
            updateRings(dt);
        });
    }

    // ---- Particle Effects ----
    function createRingParticles(position) {
        const ps = new BABYLON.ParticleSystem("ringParts", 50, scene);
        ps.emitter = position.clone();
        ps.createPointEmitter(
            new BABYLON.Vector3(-0.5, 1, -0.5),
            new BABYLON.Vector3(0.5, 2, 0.5)
        );
        ps.color1 = new BABYLON.Color4(1, 0.8, 0.2, 1);
        ps.color2 = new BABYLON.Color4(1, 0.6, 0.1, 0.8);
        ps.minSize = 0.05;
        ps.maxSize = 0.15;
        ps.minLifeTime = 0.3;
        ps.maxLifeTime = 0.8;
        ps.emitRate = 100;
        ps.manualEmitCount = 30;
        ps.gravity = new BABYLON.Vector3(0, -5, 0);
        ps.start();
        setTimeout(() => ps.dispose(), 1500);
    }

    // ---- Button Handlers ----
    function initButtons() {
        document.getElementById("btn-start").addEventListener("click", startGame);
        document.getElementById("btn-start").addEventListener("touchend", (e) => {
            e.preventDefault();
            startGame();
        });

        document.getElementById("btn-level-start").addEventListener("click", startLevel);
        document.getElementById("btn-level-start").addEventListener("touchend", (e) => {
            e.preventDefault();
            startLevel();
        });

        document.getElementById("btn-next-level").addEventListener("click", nextLevel);
        document.getElementById("btn-next-level").addEventListener("touchend", (e) => {
            e.preventDefault();
            nextLevel();
        });

        document.getElementById("btn-restart").addEventListener("click", startGame);
        document.getElementById("btn-restart").addEventListener("touchend", (e) => {
            e.preventDefault();
            startGame();
        });
    }

    // ---- Init ----
    function init() {
        initEngine();
        initSwipeControls();
        initButtons();
        gameLoop();

        // Show start screen with high scores
        renderHighScores(document.getElementById("start-high-scores"));
        hudHigh.textContent = getTopScore().toLocaleString();
    }

    // Wait for DOM
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
