/**
 * PMX Editor Application
 * Main controller that connects the parser, writer, and viewport.
 */
(function () {
    let model = null;
    let viewport = null;
    let selectedMaterialIndex = -1;
    let selectedBoneIndex = -1;
    let selectedMorphIndex = -1;
    let selectedRigidbodyIndex = -1;
    let selectedJointIndex = -1;

    // Initialize i18n
    I18n.applyTranslations();

    // Language switcher
    const btnLangZh = document.getElementById('btn-lang-zh');
    const btnLangEn = document.getElementById('btn-lang-en');

    function updateLangButtons() {
        btnLangZh.classList.toggle('active', I18n.currentLang === 'zh');
        btnLangEn.classList.toggle('active', I18n.currentLang === 'en');
    }

    btnLangZh.addEventListener('click', () => {
        I18n.setLang('zh');
        updateLangButtons();
        if (model) refreshDynamicContent();
    });

    btnLangEn.addEventListener('click', () => {
        I18n.setLang('en');
        updateLangButtons();
        if (model) refreshDynamicContent();
    });

    updateLangButtons();

    // Initialize viewport
    const canvas = document.getElementById('viewport-canvas');
    viewport = new PMXViewport(canvas);

    // File input
    const fileInput = document.getElementById('file-input');
    const btnOpen = document.getElementById('btn-open');
    const btnSave = document.getElementById('btn-save');

    btnOpen.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('loading-overlay').style.display = 'flex';
        document.getElementById('file-name').textContent = file.name;

        try {
            const buffer = await file.arrayBuffer();
            const parser = new PMXParser(buffer);
            model = parser.parse();

            updateUI();
            viewport.loadModel(model);
            btnSave.disabled = false;
        } catch (err) {
            alert(`${I18n.t('error.parseFailed')}: ${err.message}`);
            console.error(err);
        } finally {
            document.getElementById('loading-overlay').style.display = 'none';
        }
    });

    // Save
    btnSave.addEventListener('click', () => {
        if (!model) return;

        try {
            const writer = new PMXWriter(model);
            const buffer = writer.write();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = document.getElementById('file-name').textContent || 'model.pmx';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert(`${I18n.t('error.saveFailed')}: ${err.message}`);
            console.error(err);
        }
    });

    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`panel-${tab.dataset.panel}`).classList.add('active');
        });
    });

    // Viewport controls
    document.getElementById('btn-wireframe').addEventListener('click', (e) => {
        const active = viewport.toggleWireframe();
        e.target.style.background = active ? 'var(--accent)' : '';
    });

    document.getElementById('btn-bones-toggle').addEventListener('click', (e) => {
        const active = viewport.toggleBones();
        e.target.style.background = active ? 'var(--accent)' : '';
    });

    document.getElementById('btn-reset-camera').addEventListener('click', () => {
        viewport.resetCamera();
    });

    // Helper: get morph type names based on current language
    function getMorphTypeNames() {
        return [
            I18n.t('morphs.typeGroup'),
            I18n.t('morphs.typeVertex'),
            I18n.t('morphs.typeBone'),
            I18n.t('morphs.typeUV'),
            I18n.t('morphs.typeUVExt1'),
            I18n.t('morphs.typeUVExt2'),
            I18n.t('morphs.typeUVExt3'),
            I18n.t('morphs.typeUVExt4'),
            I18n.t('morphs.typeMaterial'),
            I18n.t('morphs.typeFlip'),
            I18n.t('morphs.typeImpulse')
        ];
    }

    // Refresh dynamic (JS-generated) content on language change
    function refreshDynamicContent() {
        populateVertexList();
        populateMaterialList();
        populateBoneList();
        populateMorphList();
        populateRigidbodyList();
        populateJointList();

        // Update viewport triangle text
        if (model) {
            const trisEl = document.getElementById('viewport-tris');
            if (trisEl) {
                const trisSpan = trisEl.querySelector('[data-i18n]');
                if (trisSpan) trisSpan.textContent = I18n.t('viewport.triangles');
            }
        }
    }

    // Listen for language change events
    window.addEventListener('langChanged', () => {
        if (model) refreshDynamicContent();
    });

    function updateUI() {
        if (!model) return;

        // Info panel
        document.getElementById('model-name-local').value = model.nameLocal;
        document.getElementById('model-name-universal').value = model.nameUniversal;
        document.getElementById('model-comment-local').value = model.commentLocal;
        document.getElementById('model-comment-universal').value = model.commentUniversal;

        // Enable editing on info fields
        document.getElementById('model-name-local').disabled = false;
        document.getElementById('model-name-universal').disabled = false;
        document.getElementById('model-comment-local').disabled = false;
        document.getElementById('model-comment-universal').disabled = false;

        // Bind model info changes
        document.getElementById('model-name-local').oninput = (e) => { model.nameLocal = e.target.value; };
        document.getElementById('model-name-universal').oninput = (e) => { model.nameUniversal = e.target.value; };
        document.getElementById('model-comment-local').oninput = (e) => { model.commentLocal = e.target.value; };
        document.getElementById('model-comment-universal').oninput = (e) => { model.commentUniversal = e.target.value; };

        // Stats
        document.getElementById('stat-version').textContent = model.version.toFixed(1);
        document.getElementById('stat-encoding').textContent = model.globals.encoding === 0 ? 'UTF-16LE' : 'UTF-8';
        document.getElementById('stat-vertices').textContent = model.vertices.length.toLocaleString();
        document.getElementById('stat-surfaces').textContent = (model.surfaces.length / 3).toLocaleString();
        document.getElementById('stat-materials').textContent = model.materials.length;
        document.getElementById('stat-bones').textContent = model.bones.length;
        document.getElementById('stat-morphs').textContent = model.morphs.length;
        document.getElementById('stat-rigidbodies').textContent = model.rigidBodies.length;
        document.getElementById('stat-joints').textContent = model.joints.length;
        document.getElementById('stat-textures').textContent = model.textures.length;

        // Populate lists
        populateVertexList();
        populateMaterialList();
        populateBoneList();
        populateMorphList();
        populateRigidbodyList();
        populateJointList();
    }

    // Vertex list
    function populateVertexList() {
        const list = document.getElementById('vertex-list');
        const count = model.vertices.length;
        document.getElementById('vertex-count').textContent = count.toLocaleString();

        const maxShow = Math.min(count, 200);
        list.innerHTML = '';
        for (let i = 0; i < maxShow; i++) {
            const item = createListItem(i, `${I18n.t('vertices.item')} ${i} (${model.vertices[i].position.map(v => v.toFixed(2)).join(', ')})`);
            item.addEventListener('click', () => selectVertex(i));
            list.appendChild(item);
        }
        if (count > 200) {
            const more = document.createElement('div');
            more.className = 'list-item';
            more.textContent = `... ${I18n.t('vertices.more', (count - 200).toLocaleString())}`;
            more.style.color = 'var(--text-secondary)';
            more.style.justifyContent = 'center';
            list.appendChild(more);
        }

        document.getElementById('vertex-search').oninput = (e) => {
            const idx = parseInt(e.target.value);
            if (!isNaN(idx) && idx >= 0 && idx < count) {
                selectVertex(idx);
            }
        };
    }

    function selectVertex(index) {
        const vertex = model.vertices[index];
        if (!vertex) return;

        document.getElementById('vertex-detail').style.display = 'block';
        document.getElementById('vertex-index').textContent = index;
        document.getElementById('vertex-pos-x').value = vertex.position[0];
        document.getElementById('vertex-pos-y').value = vertex.position[1];
        document.getElementById('vertex-pos-z').value = vertex.position[2];
        document.getElementById('vertex-normal-x').value = vertex.normal[0];
        document.getElementById('vertex-normal-y').value = vertex.normal[1];
        document.getElementById('vertex-normal-z').value = vertex.normal[2];
        document.getElementById('vertex-uv-u').value = vertex.uv[0];
        document.getElementById('vertex-uv-v').value = vertex.uv[1];
        document.getElementById('vertex-edge-scale').value = vertex.edgeScale;

        const bindVec = (prefix, arr) => {
            ['x', 'y', 'z'].forEach((axis, i) => {
                const el = document.getElementById(`${prefix}-${axis}`);
                if (el) el.oninput = (e) => { arr[i] = parseFloat(e.target.value) || 0; };
            });
        };
        bindVec('vertex-pos', vertex.position);
        bindVec('vertex-normal', vertex.normal);
        document.getElementById('vertex-uv-u').oninput = (e) => { vertex.uv[0] = parseFloat(e.target.value) || 0; };
        document.getElementById('vertex-uv-v').oninput = (e) => { vertex.uv[1] = parseFloat(e.target.value) || 0; };
        document.getElementById('vertex-edge-scale').oninput = (e) => { vertex.edgeScale = parseFloat(e.target.value) || 0; };
    }

    // Material list
    function populateMaterialList() {
        const list = document.getElementById('material-list');
        document.getElementById('material-count').textContent = model.materials.length;
        list.innerHTML = '';

        for (let i = 0; i < model.materials.length; i++) {
            const mat = model.materials[i];
            const item = createListItem(i, mat.nameLocal || mat.nameUniversal || `${I18n.t('materials.item')} ${i}`);
            item.addEventListener('click', () => selectMaterial(i));
            list.appendChild(item);
        }

        document.getElementById('material-search').oninput = (e) => {
            filterList(list, e.target.value);
        };
    }

    function selectMaterial(index) {
        selectedMaterialIndex = index;
        const mat = model.materials[index];
        if (!mat) return;

        highlightListItem('material-list', index);
        document.getElementById('material-detail').style.display = 'block';
        document.getElementById('mat-name-local').value = mat.nameLocal;
        document.getElementById('mat-name-universal').value = mat.nameUniversal;
        document.getElementById('mat-diffuse-color').value = rgbToHex(mat.diffuse[0], mat.diffuse[1], mat.diffuse[2]);
        document.getElementById('mat-diffuse-alpha').value = mat.diffuse[3];
        document.getElementById('mat-specular-color').value = rgbToHex(mat.specular[0], mat.specular[1], mat.specular[2]);
        document.getElementById('mat-specular-strength').value = mat.specularStrength;
        document.getElementById('mat-ambient-color').value = rgbToHex(mat.ambient[0], mat.ambient[1], mat.ambient[2]);
        document.getElementById('mat-edge-color').value = rgbToHex(mat.edgeColor[0], mat.edgeColor[1], mat.edgeColor[2]);
        document.getElementById('mat-edge-alpha').value = mat.edgeColor[3];
        document.getElementById('mat-edge-size').value = mat.edgeScale;
        document.getElementById('mat-surface-count').value = mat.surfaceCount;

        // Texture info
        updateTexturePreview(index);

        // Highlight in viewport
        viewport.highlightMaterial(index);

        document.getElementById('mat-flag-nocull').checked = !!(mat.flags & 0x01);
        document.getElementById('mat-flag-shadow').checked = !!(mat.flags & 0x02);
        document.getElementById('mat-flag-drawshadow').checked = !!(mat.flags & 0x04);
        document.getElementById('mat-flag-receiveshadow').checked = !!(mat.flags & 0x08);
        document.getElementById('mat-flag-edge').checked = !!(mat.flags & 0x10);

        document.getElementById('mat-name-local').oninput = (e) => { mat.nameLocal = e.target.value; };
        document.getElementById('mat-name-universal').oninput = (e) => { mat.nameUniversal = e.target.value; };
        document.getElementById('mat-diffuse-color').oninput = (e) => {
            const rgb = hexToRgb(e.target.value);
            mat.diffuse[0] = rgb[0]; mat.diffuse[1] = rgb[1]; mat.diffuse[2] = rgb[2];
            viewport.updateMaterialColor(index, 'diffuse', mat.diffuse);
        };
        document.getElementById('mat-diffuse-alpha').oninput = (e) => {
            mat.diffuse[3] = parseFloat(e.target.value) || 1;
            viewport.updateMaterialColor(index, 'diffuse', mat.diffuse);
        };
        document.getElementById('mat-specular-color').oninput = (e) => {
            const rgb = hexToRgb(e.target.value);
            mat.specular[0] = rgb[0]; mat.specular[1] = rgb[1]; mat.specular[2] = rgb[2];
            viewport.updateMaterialColor(index, 'specular', mat.specular);
        };
        document.getElementById('mat-specular-strength').oninput = (e) => {
            mat.specularStrength = parseFloat(e.target.value) || 0;
            viewport.updateMaterialColor(index, 'shininess', mat.specularStrength);
        };
        document.getElementById('mat-ambient-color').oninput = (e) => {
            const rgb = hexToRgb(e.target.value);
            mat.ambient[0] = rgb[0]; mat.ambient[1] = rgb[1]; mat.ambient[2] = rgb[2];
        };
        document.getElementById('mat-edge-color').oninput = (e) => {
            const rgb = hexToRgb(e.target.value);
            mat.edgeColor[0] = rgb[0]; mat.edgeColor[1] = rgb[1]; mat.edgeColor[2] = rgb[2];
        };
        document.getElementById('mat-edge-alpha').oninput = (e) => { mat.edgeColor[3] = parseFloat(e.target.value) || 1; };
        document.getElementById('mat-edge-size').oninput = (e) => { mat.edgeScale = parseFloat(e.target.value) || 0; };

        const updateFlags = () => {
            mat.flags = 0;
            if (document.getElementById('mat-flag-nocull').checked) mat.flags |= 0x01;
            if (document.getElementById('mat-flag-shadow').checked) mat.flags |= 0x02;
            if (document.getElementById('mat-flag-drawshadow').checked) mat.flags |= 0x04;
            if (document.getElementById('mat-flag-receiveshadow').checked) mat.flags |= 0x08;
            if (document.getElementById('mat-flag-edge').checked) mat.flags |= 0x10;
        };
        ['mat-flag-nocull', 'mat-flag-shadow', 'mat-flag-drawshadow', 'mat-flag-receiveshadow', 'mat-flag-edge']
            .forEach(id => document.getElementById(id).onchange = updateFlags);
    }

    // Texture management
    function updateTexturePreview(materialIndex) {
        const mat = model.materials[materialIndex];
        const previewEl = document.getElementById('mat-texture-preview');
        const pathEl = document.getElementById('mat-texture-path');

        // Show texture path
        const texIndex = mat.textureIndex;
        if (texIndex >= 0 && texIndex < model.textures.length) {
            pathEl.textContent = model.textures[texIndex];
            pathEl.title = model.textures[texIndex];
        } else {
            pathEl.textContent = '-';
            pathEl.title = '';
        }

        // Show texture preview if loaded
        if (materialTextureUrls[materialIndex]) {
            previewEl.innerHTML = `<img src="${materialTextureUrls[materialIndex]}" alt="texture">`;
        } else {
            previewEl.innerHTML = `<span class="texture-placeholder">${I18n.t('materials.noTexture')}</span>`;
        }
    }

    // Store texture URLs per material
    const materialTextureUrls = {};

    // Load texture button
    document.getElementById('btn-load-texture').addEventListener('click', () => {
        if (selectedMaterialIndex < 0) return;
        document.getElementById('texture-file-input').click();
    });

    document.getElementById('texture-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || selectedMaterialIndex < 0) return;

        const url = URL.createObjectURL(file);
        materialTextureUrls[selectedMaterialIndex] = url;

        // Apply to viewport
        viewport.applyTextureToMaterial(selectedMaterialIndex, url);

        // Update preview
        updateTexturePreview(selectedMaterialIndex);

        // Update texture path in model
        const mat = model.materials[selectedMaterialIndex];
        const newTexPath = file.name;
        if (mat.textureIndex >= 0 && mat.textureIndex < model.textures.length) {
            model.textures[mat.textureIndex] = newTexPath;
        } else {
            // Add new texture entry
            model.textures.push(newTexPath);
            mat.textureIndex = model.textures.length - 1;
        }

        // Reset file input
        e.target.value = '';
    });

    // Remove texture button
    document.getElementById('btn-remove-texture').addEventListener('click', () => {
        if (selectedMaterialIndex < 0) return;

        // Remove from viewport
        viewport.applyTextureToMaterial(selectedMaterialIndex, null);

        // Clean up URL
        if (materialTextureUrls[selectedMaterialIndex]) {
            URL.revokeObjectURL(materialTextureUrls[selectedMaterialIndex]);
            delete materialTextureUrls[selectedMaterialIndex];
        }

        // Update preview
        updateTexturePreview(selectedMaterialIndex);
    });

    // Material presets
    const materialPresets = {
        silk: {
            specular: [1.0, 1.0, 1.0],
            specularStrength: 80,
            ambient: [0.4, 0.4, 0.45],
            flags: 0x01 | 0x02 | 0x04 | 0x08 // double-sided + all shadows
        },
        denim: {
            specular: [0.15, 0.15, 0.2],
            specularStrength: 8,
            ambient: [0.15, 0.15, 0.25],
            flags: 0x02 | 0x04 | 0x08 | 0x10
        },
        leather: {
            specular: [0.5, 0.4, 0.3],
            specularStrength: 35,
            ambient: [0.1, 0.08, 0.05],
            flags: 0x02 | 0x04 | 0x08 | 0x10
        },
        cotton: {
            specular: [0.2, 0.2, 0.2],
            specularStrength: 5,
            ambient: [0.3, 0.3, 0.3],
            flags: 0x02 | 0x04 | 0x08 | 0x10
        },
        velvet: {
            specular: [0.3, 0.25, 0.35],
            specularStrength: 15,
            ambient: [0.2, 0.15, 0.25],
            flags: 0x01 | 0x02 | 0x04 | 0x08 | 0x10
        },
        metal: {
            specular: [1.0, 1.0, 1.0],
            specularStrength: 120,
            ambient: [0.1, 0.1, 0.1],
            flags: 0x02 | 0x04 | 0x08 | 0x10
        }
    };

    document.getElementById('material-preset-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn || selectedMaterialIndex < 0) return;

        const presetName = btn.dataset.preset;
        const preset = materialPresets[presetName];
        if (!preset) return;

        const mat = model.materials[selectedMaterialIndex];

        // Apply preset values
        mat.specular = [...preset.specular];
        mat.specularStrength = preset.specularStrength;
        mat.ambient = [...preset.ambient];
        mat.flags = preset.flags;

        // Update viewport
        viewport.updateMaterialColor(selectedMaterialIndex, 'specular', mat.specular);
        viewport.updateMaterialColor(selectedMaterialIndex, 'shininess', mat.specularStrength);

        // Refresh the form
        selectMaterial(selectedMaterialIndex);

        // Highlight active preset
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });

    // Bone list
    function populateBoneList() {
        const list = document.getElementById('bone-list');
        document.getElementById('bone-count').textContent = model.bones.length;
        list.innerHTML = '';

        for (let i = 0; i < model.bones.length; i++) {
            const bone = model.bones[i];
            const item = createListItem(i, bone.nameLocal || bone.nameUniversal || `${I18n.t('bones.item')} ${i}`);
            item.addEventListener('click', () => selectBone(i));
            list.appendChild(item);
        }

        document.getElementById('bone-search').oninput = (e) => {
            filterList(list, e.target.value);
        };
    }

    function selectBone(index) {
        selectedBoneIndex = index;
        const bone = model.bones[index];
        if (!bone) return;

        highlightListItem('bone-list', index);
        document.getElementById('bone-detail').style.display = 'block';
        document.getElementById('bone-name-local').value = bone.nameLocal;
        document.getElementById('bone-name-universal').value = bone.nameUniversal;
        document.getElementById('bone-pos-x').value = bone.position[0];
        document.getElementById('bone-pos-y').value = bone.position[1];
        document.getElementById('bone-pos-z').value = bone.position[2];
        document.getElementById('bone-parent-index').value = bone.parentIndex;
        document.getElementById('bone-layer').value = bone.layer;

        document.getElementById('bone-flag-indexed-tail').checked = !!(bone.flags & 0x0001);
        document.getElementById('bone-flag-rotatable').checked = !!(bone.flags & 0x0002);
        document.getElementById('bone-flag-translatable').checked = !!(bone.flags & 0x0004);
        document.getElementById('bone-flag-visible').checked = !!(bone.flags & 0x0008);
        document.getElementById('bone-flag-enabled').checked = !!(bone.flags & 0x0010);
        document.getElementById('bone-flag-ik').checked = !!(bone.flags & 0x0020);

        document.getElementById('bone-name-local').oninput = (e) => { bone.nameLocal = e.target.value; };
        document.getElementById('bone-name-universal').oninput = (e) => { bone.nameUniversal = e.target.value; };
        document.getElementById('bone-pos-x').oninput = (e) => { bone.position[0] = parseFloat(e.target.value) || 0; };
        document.getElementById('bone-pos-y').oninput = (e) => { bone.position[1] = parseFloat(e.target.value) || 0; };
        document.getElementById('bone-pos-z').oninput = (e) => { bone.position[2] = parseFloat(e.target.value) || 0; };
        document.getElementById('bone-parent-index').oninput = (e) => { bone.parentIndex = parseInt(e.target.value) || -1; };
        document.getElementById('bone-layer').oninput = (e) => { bone.layer = parseInt(e.target.value) || 0; };
    }

    // Morph list
    function populateMorphList() {
        const list = document.getElementById('morph-list');
        document.getElementById('morph-count').textContent = model.morphs.length;
        list.innerHTML = '';

        const morphTypeNames = getMorphTypeNames();

        for (let i = 0; i < model.morphs.length; i++) {
            const morph = model.morphs[i];
            const item = createListItem(i, `${morph.nameLocal || morph.nameUniversal || `${I18n.t('morphs.item')} ${i}`} [${morphTypeNames[morph.type] || '?'}]`);
            item.addEventListener('click', () => selectMorph(i));
            list.appendChild(item);
        }

        document.getElementById('morph-search').oninput = (e) => {
            filterList(list, e.target.value);
        };
    }

    function selectMorph(index) {
        selectedMorphIndex = index;
        const morph = model.morphs[index];
        if (!morph) return;

        const morphTypeNames = getMorphTypeNames();

        highlightListItem('morph-list', index);
        document.getElementById('morph-detail').style.display = 'block';
        document.getElementById('morph-name-local').value = morph.nameLocal;
        document.getElementById('morph-name-universal').value = morph.nameUniversal;
        document.getElementById('morph-panel').value = morph.panelType;
        document.getElementById('morph-type').value = morphTypeNames[morph.type] || `Type ${morph.type}`;
        document.getElementById('morph-offset-count').value = morph.offsets.length;

        document.getElementById('morph-name-local').oninput = (e) => { morph.nameLocal = e.target.value; };
        document.getElementById('morph-name-universal').oninput = (e) => { morph.nameUniversal = e.target.value; };
        document.getElementById('morph-panel').onchange = (e) => { morph.panelType = parseInt(e.target.value); };
    }

    // Rigidbody list
    function populateRigidbodyList() {
        const list = document.getElementById('rigidbody-list');
        document.getElementById('rigidbody-count').textContent = model.rigidBodies.length;
        list.innerHTML = '';

        for (let i = 0; i < model.rigidBodies.length; i++) {
            const rb = model.rigidBodies[i];
            const item = createListItem(i, rb.nameLocal || rb.nameUniversal || `${I18n.t('rigidbodies.item')} ${i}`);
            item.addEventListener('click', () => selectRigidbody(i));
            list.appendChild(item);
        }

        document.getElementById('rigidbody-search').oninput = (e) => {
            filterList(list, e.target.value);
        };
    }

    function selectRigidbody(index) {
        selectedRigidbodyIndex = index;
        const rb = model.rigidBodies[index];
        if (!rb) return;

        highlightListItem('rigidbody-list', index);
        document.getElementById('rigidbody-detail').style.display = 'block';
        document.getElementById('rb-name-local').value = rb.nameLocal;
        document.getElementById('rb-name-universal').value = rb.nameUniversal;
        document.getElementById('rb-shape').value = rb.shape;
        document.getElementById('rb-size-x').value = rb.shapeSize[0];
        document.getElementById('rb-size-y').value = rb.shapeSize[1];
        document.getElementById('rb-size-z').value = rb.shapeSize[2];
        document.getElementById('rb-pos-x').value = rb.shapePosition[0];
        document.getElementById('rb-pos-y').value = rb.shapePosition[1];
        document.getElementById('rb-pos-z').value = rb.shapePosition[2];
        document.getElementById('rb-mass').value = rb.mass;
        document.getElementById('rb-physics-mode').value = rb.physicsMode;

        document.getElementById('rb-name-local').oninput = (e) => { rb.nameLocal = e.target.value; };
        document.getElementById('rb-name-universal').oninput = (e) => { rb.nameUniversal = e.target.value; };
        document.getElementById('rb-shape').onchange = (e) => { rb.shape = parseInt(e.target.value); };
        document.getElementById('rb-size-x').oninput = (e) => { rb.shapeSize[0] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-size-y').oninput = (e) => { rb.shapeSize[1] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-size-z').oninput = (e) => { rb.shapeSize[2] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-pos-x').oninput = (e) => { rb.shapePosition[0] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-pos-y').oninput = (e) => { rb.shapePosition[1] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-pos-z').oninput = (e) => { rb.shapePosition[2] = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-mass').oninput = (e) => { rb.mass = parseFloat(e.target.value) || 0; };
        document.getElementById('rb-physics-mode').onchange = (e) => { rb.physicsMode = parseInt(e.target.value); };
    }

    // Joint list
    function populateJointList() {
        const list = document.getElementById('joint-list');
        document.getElementById('joint-count').textContent = model.joints.length;
        list.innerHTML = '';

        for (let i = 0; i < model.joints.length; i++) {
            const joint = model.joints[i];
            const item = createListItem(i, joint.nameLocal || joint.nameUniversal || `${I18n.t('joints.item')} ${i}`);
            item.addEventListener('click', () => selectJoint(i));
            list.appendChild(item);
        }

        document.getElementById('joint-search').oninput = (e) => {
            filterList(list, e.target.value);
        };
    }

    function selectJoint(index) {
        selectedJointIndex = index;
        const joint = model.joints[index];
        if (!joint) return;

        highlightListItem('joint-list', index);
        document.getElementById('joint-detail').style.display = 'block';
        document.getElementById('joint-name-local').value = joint.nameLocal;
        document.getElementById('joint-name-universal').value = joint.nameUniversal;
        document.getElementById('joint-type').value = joint.type;
        document.getElementById('joint-pos-x').value = joint.position[0];
        document.getElementById('joint-pos-y').value = joint.position[1];
        document.getElementById('joint-pos-z').value = joint.position[2];

        document.getElementById('joint-name-local').oninput = (e) => { joint.nameLocal = e.target.value; };
        document.getElementById('joint-name-universal').oninput = (e) => { joint.nameUniversal = e.target.value; };
        document.getElementById('joint-type').onchange = (e) => { joint.type = parseInt(e.target.value); };
        document.getElementById('joint-pos-x').oninput = (e) => { joint.position[0] = parseFloat(e.target.value) || 0; };
        document.getElementById('joint-pos-y').oninput = (e) => { joint.position[1] = parseFloat(e.target.value) || 0; };
        document.getElementById('joint-pos-z').oninput = (e) => { joint.position[2] = parseFloat(e.target.value) || 0; };
    }

    // Utility functions
    function createListItem(index, text) {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.dataset.index = index;
        div.innerHTML = `<span class="item-index">${index}</span><span>${escapeHtml(text)}</span>`;
        return div;
    }

    function highlightListItem(listId, index) {
        const list = document.getElementById(listId);
        list.querySelectorAll('.list-item').forEach(item => {
            item.classList.toggle('selected', parseInt(item.dataset.index) === index);
        });
    }

    function filterList(list, query) {
        const items = list.querySelectorAll('.list-item');
        const q = query.toLowerCase();
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(q) ? '' : 'none';
        });
    }

    function rgbToHex(r, g, b) {
        const toHex = (v) => {
            const hex = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
