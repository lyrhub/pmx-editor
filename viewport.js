/**
 * 3D Viewport using Three.js for PMX model preview
 */
class PMXViewport {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.boneMesh = null;
        this.gridHelper = null;
        this.wireframe = false;
        this.showBones = false;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = {}; // cache: path -> THREE.Texture

        this.init();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
        this.camera.position.set(0, 10, 25);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, 10, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.update();

        // Lights
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x444466, 0.3);
        backLight.position.set(-5, 5, -7);
        this.scene.add(backLight);

        // Grid
        this.gridHelper = new THREE.GridHelper(20, 20, 0x404060, 0x303050);
        this.scene.add(this.gridHelper);

        // Axis helper
        const axisHelper = new THREE.AxesHelper(5);
        this.scene.add(axisHelper);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        // FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            const fpsEl = document.getElementById('viewport-fps');
            if (fpsEl) fpsEl.textContent = `FPS: ${this.fps}`;
        }
    }

    loadModel(model) {
        // Remove existing mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (this.mesh.material.map) this.mesh.material.map.dispose();
                this.mesh.material.dispose();
            }
        }
        if (this.boneMesh) {
            this.scene.remove(this.boneMesh);
        }

        // Clear texture cache
        this.loadedTextures = {};

        // Build geometry
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(model.vertices.length * 3);
        const normals = new Float32Array(model.vertices.length * 3);
        const uvs = new Float32Array(model.vertices.length * 2);

        for (let i = 0; i < model.vertices.length; i++) {
            const v = model.vertices[i];
            positions[i * 3] = v.position[0];
            positions[i * 3 + 1] = v.position[1];
            positions[i * 3 + 2] = v.position[2];
            normals[i * 3] = v.normal[0];
            normals[i * 3 + 1] = v.normal[1];
            normals[i * 3 + 2] = v.normal[2];
            uvs[i * 2] = v.uv[0];
            uvs[i * 2 + 1] = v.uv[1];
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Indices
        const indices = new Uint32Array(model.surfaces);
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        // Create material groups
        const materials = [];
        let surfaceOffset = 0;
        for (let i = 0; i < model.materials.length; i++) {
            const mat = model.materials[i];
            const diffuse = mat.diffuse;

            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(diffuse[0], diffuse[1], diffuse[2]),
                opacity: diffuse[3],
                transparent: diffuse[3] < 1.0,
                specular: new THREE.Color(mat.specular[0], mat.specular[1], mat.specular[2]),
                shininess: mat.specularStrength,
                side: (mat.flags & 0x01) ? THREE.DoubleSide : THREE.FrontSide
            });
            materials.push(material);

            geometry.addGroup(surfaceOffset, mat.surfaceCount, i);
            surfaceOffset += mat.surfaceCount;
        }

        // Create mesh
        if (materials.length > 0) {
            this.mesh = new THREE.Mesh(geometry, materials);
        } else {
            this.mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                color: 0x888888,
                side: THREE.DoubleSide
            }));
        }

        this.scene.add(this.mesh);

        // Build bone visualization
        this.buildBoneVisualization(model.bones);

        // Auto-fit camera
        this.fitCamera();

        // Update triangle count
        const trisEl = document.getElementById('viewport-tris');
        if (trisEl) trisEl.textContent = `${I18n.t('viewport.triangles')}: ${(model.surfaces.length / 3).toLocaleString()}`;
    }

    /**
     * Apply a texture (from a File/Blob URL or data URL) to a specific material index
     */
    applyTextureToMaterial(materialIndex, textureUrl) {
        if (!this.mesh || !Array.isArray(this.mesh.material)) return;
        if (materialIndex < 0 || materialIndex >= this.mesh.material.length) return;

        const material = this.mesh.material[materialIndex];

        if (textureUrl) {
            const texture = this.textureLoader.load(textureUrl, () => {
                material.needsUpdate = true;
            });
            texture.flipY = false; // PMX textures are typically not flipped
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            // Dispose old texture
            if (material.map) {
                material.map.dispose();
            }
            material.map = texture;
            material.needsUpdate = true;
        } else {
            // Remove texture
            if (material.map) {
                material.map.dispose();
                material.map = null;
                material.needsUpdate = true;
            }
        }
    }

    /**
     * Update material color properties in real-time
     */
    updateMaterialColor(materialIndex, property, color) {
        if (!this.mesh || !Array.isArray(this.mesh.material)) return;
        if (materialIndex < 0 || materialIndex >= this.mesh.material.length) return;

        const material = this.mesh.material[materialIndex];
        switch (property) {
            case 'diffuse':
                material.color.setRGB(color[0], color[1], color[2]);
                if (color.length > 3) {
                    material.opacity = color[3];
                    material.transparent = color[3] < 1.0;
                }
                break;
            case 'specular':
                material.specular.setRGB(color[0], color[1], color[2]);
                break;
            case 'shininess':
                material.shininess = color;
                break;
        }
        material.needsUpdate = true;
    }

    /**
     * Highlight a specific material group (for selection feedback)
     */
    highlightMaterial(materialIndex) {
        if (!this.mesh || !Array.isArray(this.mesh.material)) return;
        
        this.mesh.material.forEach((mat, i) => {
            mat.emissive = mat.emissive || new THREE.Color(0, 0, 0);
            if (i === materialIndex) {
                mat.emissive.setRGB(0.1, 0.05, 0.15);
            } else {
                mat.emissive.setRGB(0, 0, 0);
            }
        });
    }

    clearMaterialHighlight() {
        if (!this.mesh || !Array.isArray(this.mesh.material)) return;
        this.mesh.material.forEach(mat => {
            mat.emissive = mat.emissive || new THREE.Color(0, 0, 0);
            mat.emissive.setRGB(0, 0, 0);
        });
    }

    buildBoneVisualization(bones) {
        if (this.boneMesh) {
            this.scene.remove(this.boneMesh);
        }

        const boneGroup = new THREE.Group();

        for (let i = 0; i < bones.length; i++) {
            const bone = bones[i];
            const pos = bone.position;

            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0x00ff88 })
            );
            sphere.position.set(pos[0], pos[1], pos[2]);
            boneGroup.add(sphere);

            if (bone.parentIndex >= 0 && bone.parentIndex < bones.length) {
                const parent = bones[bone.parentIndex];
                const points = [
                    new THREE.Vector3(pos[0], pos[1], pos[2]),
                    new THREE.Vector3(parent.position[0], parent.position[1], parent.position[2])
                ];
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x00ff88, opacity: 0.5, transparent: true }));
                boneGroup.add(line);
            }
        }

        this.boneMesh = boneGroup;
        this.boneMesh.visible = this.showBones;
        this.scene.add(this.boneMesh);
    }

    fitCamera() {
        if (!this.mesh) return;

        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        this.camera.position.set(center.x, center.y, center.z + distance);
        this.controls.target.copy(center);
        this.controls.update();
    }

    toggleWireframe() {
        this.wireframe = !this.wireframe;
        if (this.mesh) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => { m.wireframe = this.wireframe; });
            } else {
                this.mesh.material.wireframe = this.wireframe;
            }
        }
        return this.wireframe;
    }

    toggleBones() {
        this.showBones = !this.showBones;
        if (this.boneMesh) {
            this.boneMesh.visible = this.showBones;
        }
        return this.showBones;
    }

    resetCamera() {
        this.fitCamera();
    }
}
