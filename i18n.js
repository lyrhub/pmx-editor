/**
 * Internationalization (i18n) module for PMX Editor
 * Supports Chinese (zh) and English (en)
 */
const I18n = {
    currentLang: localStorage.getItem('pmx-editor-lang') || 'zh',

    messages: {
        zh: {
            // Toolbar
            'toolbar.open': '📂 打开文件',
            'toolbar.save': '💾 保存',
            'toolbar.noFile': '未加载文件',
            'toolbar.loading': '正在解析 PMX 文件...',

            // Tabs
            'tab.info': '📋 信息',
            'tab.vertices': '📐 顶点',
            'tab.materials': '🎨 材质',
            'tab.bones': '🦴 骨骼',
            'tab.morphs': '😊 表情',
            'tab.rigidbodies': '⚙️ 刚体',
            'tab.joints': '🔗 关节',

            // Info panel
            'info.title': '模型信息',
            'info.nameLocal': '名称 (日文)',
            'info.nameUniversal': '名称 (英文)',
            'info.commentLocal': '注释 (日文)',
            'info.commentUniversal': '注释 (英文)',
            'info.stats': '文件统计',
            'info.version': '版本',
            'info.encoding': '编码',
            'info.vertexCount': '顶点数',
            'info.surfaceCount': '面数',
            'info.materialCount': '材质数',
            'info.boneCount': '骨骼数',
            'info.morphCount': '表情数',
            'info.rigidbodyCount': '刚体数',
            'info.jointCount': '关节数',
            'info.textureCount': '纹理数',

            // Vertices
            'vertices.title': '顶点列表',
            'vertices.search': '搜索顶点索引...',
            'vertices.detail': '顶点详情',
            'vertices.position': '位置 (X, Y, Z)',
            'vertices.normal': '法线 (X, Y, Z)',
            'vertices.uv': 'UV (U, V)',
            'vertices.edgeScale': '边缘缩放',
            'vertices.item': '顶点',
            'vertices.more': '还有 {0} 个顶点',

            // Materials
            'materials.title': '材质列表',
            'materials.search': '搜索材质名称...',
            'materials.detail': '材质详情',
            'materials.nameLocal': '名称 (日文)',
            'materials.nameUniversal': '名称 (英文)',
            'materials.diffuse': '漫反射颜色 (RGBA)',
            'materials.specularColor': '高光颜色 (RGB)',
            'materials.specularStrength': '高光强度',
            'materials.ambient': '环境光颜色 (RGB)',
            'materials.edgeColor': '边缘颜色',
            'materials.edgeSize': '边缘大小',
            'materials.surfaceCount': '面数',
            'materials.flags': '标志',
            'materials.flagNoCull': '双面',
            'materials.flagShadow': '地面阴影',
            'materials.flagDrawShadow': '投射阴影',
            'materials.flagReceiveShadow': '接受阴影',
            'materials.flagEdge': '边缘',
            'materials.item': '材质',

            // Bones
            'bones.title': '骨骼列表',
            'bones.search': '搜索骨骼名称...',
            'bones.detail': '骨骼详情',
            'bones.nameLocal': '名称 (日文)',
            'bones.nameUniversal': '名称 (英文)',
            'bones.position': '位置 (X, Y, Z)',
            'bones.parentIndex': '父骨骼索引',
            'bones.layer': '层级',
            'bones.flags': '标志',
            'bones.flagIndexedTail': '索引尾部',
            'bones.flagRotatable': '旋转',
            'bones.flagTranslatable': '平移',
            'bones.flagVisible': '可见',
            'bones.flagEnabled': '启用',
            'bones.flagIK': 'IK',
            'bones.item': '骨骼',

            // Morphs
            'morphs.title': '表情列表',
            'morphs.search': '搜索表情名称...',
            'morphs.detail': '表情详情',
            'morphs.nameLocal': '名称 (日文)',
            'morphs.nameUniversal': '名称 (英文)',
            'morphs.panelType': '面板类型',
            'morphs.type': '类型',
            'morphs.offsetCount': '偏移数据数量',
            'morphs.item': '表情',
            'morphs.panelSystem': '系统保留',
            'morphs.panelEyebrow': '眉毛',
            'morphs.panelEye': '眼睛',
            'morphs.panelMouth': '嘴巴',
            'morphs.panelOther': '其他',
            'morphs.typeGroup': '组合',
            'morphs.typeVertex': '顶点',
            'morphs.typeBone': '骨骼',
            'morphs.typeUV': 'UV',
            'morphs.typeUVExt1': 'UV扩展1',
            'morphs.typeUVExt2': 'UV扩展2',
            'morphs.typeUVExt3': 'UV扩展3',
            'morphs.typeUVExt4': 'UV扩展4',
            'morphs.typeMaterial': '材质',
            'morphs.typeFlip': '翻转',
            'morphs.typeImpulse': '冲击',

            // Rigidbodies
            'rigidbodies.title': '刚体列表',
            'rigidbodies.search': '搜索刚体名称...',
            'rigidbodies.detail': '刚体详情',
            'rigidbodies.nameLocal': '名称 (日文)',
            'rigidbodies.nameUniversal': '名称 (英文)',
            'rigidbodies.shape': '形状',
            'rigidbodies.shapeSphere': '球体',
            'rigidbodies.shapeBox': '方盒',
            'rigidbodies.shapeCapsule': '胶囊',
            'rigidbodies.size': '尺寸 (X, Y, Z)',
            'rigidbodies.position': '位置 (X, Y, Z)',
            'rigidbodies.mass': '质量',
            'rigidbodies.physicsMode': '物理模式',
            'rigidbodies.modeFollowBone': '跟随骨骼',
            'rigidbodies.modePhysics': '物理演算',
            'rigidbodies.modePhysicsBone': '物理+骨骼',
            'rigidbodies.item': '刚体',

            // Joints
            'joints.title': '关节列表',
            'joints.search': '搜索关节名称...',
            'joints.detail': '关节详情',
            'joints.nameLocal': '名称 (日文)',
            'joints.nameUniversal': '名称 (英文)',
            'joints.type': '类型',
            'joints.position': '位置 (X, Y, Z)',
            'joints.item': '关节',

            // Viewport
            'viewport.wireframe': '线框模式',
            'viewport.bones': '显示骨骼',
            'viewport.resetCamera': '重置视角',
            'viewport.triangles': '三角面',

            // Errors
            'error.parseFailed': '解析 PMX 文件失败',
            'error.saveFailed': '保存 PMX 文件失败',
        },

        en: {
            // Toolbar
            'toolbar.open': '📂 Open File',
            'toolbar.save': '💾 Save',
            'toolbar.noFile': 'No file loaded',
            'toolbar.loading': 'Parsing PMX file...',

            // Tabs
            'tab.info': '📋 Info',
            'tab.vertices': '📐 Vertices',
            'tab.materials': '🎨 Materials',
            'tab.bones': '🦴 Bones',
            'tab.morphs': '😊 Morphs',
            'tab.rigidbodies': '⚙️ Rigidbodies',
            'tab.joints': '🔗 Joints',

            // Info panel
            'info.title': 'Model Info',
            'info.nameLocal': 'Name (Japanese)',
            'info.nameUniversal': 'Name (English)',
            'info.commentLocal': 'Comment (Japanese)',
            'info.commentUniversal': 'Comment (English)',
            'info.stats': 'File Statistics',
            'info.version': 'Version',
            'info.encoding': 'Encoding',
            'info.vertexCount': 'Vertices',
            'info.surfaceCount': 'Faces',
            'info.materialCount': 'Materials',
            'info.boneCount': 'Bones',
            'info.morphCount': 'Morphs',
            'info.rigidbodyCount': 'Rigidbodies',
            'info.jointCount': 'Joints',
            'info.textureCount': 'Textures',

            // Vertices
            'vertices.title': 'Vertex List',
            'vertices.search': 'Search vertex index...',
            'vertices.detail': 'Vertex Detail',
            'vertices.position': 'Position (X, Y, Z)',
            'vertices.normal': 'Normal (X, Y, Z)',
            'vertices.uv': 'UV (U, V)',
            'vertices.edgeScale': 'Edge Scale',
            'vertices.item': 'Vertex',
            'vertices.more': '{0} more vertices',

            // Materials
            'materials.title': 'Material List',
            'materials.search': 'Search material name...',
            'materials.detail': 'Material Detail',
            'materials.nameLocal': 'Name (Japanese)',
            'materials.nameUniversal': 'Name (English)',
            'materials.diffuse': 'Diffuse Color (RGBA)',
            'materials.specularColor': 'Specular Color (RGB)',
            'materials.specularStrength': 'Specular Strength',
            'materials.ambient': 'Ambient Color (RGB)',
            'materials.edgeColor': 'Edge Color',
            'materials.edgeSize': 'Edge Size',
            'materials.surfaceCount': 'Face Count',
            'materials.flags': 'Flags',
            'materials.flagNoCull': 'Double-sided',
            'materials.flagShadow': 'Ground Shadow',
            'materials.flagDrawShadow': 'Cast Shadow',
            'materials.flagReceiveShadow': 'Receive Shadow',
            'materials.flagEdge': 'Edge',
            'materials.item': 'Material',

            // Bones
            'bones.title': 'Bone List',
            'bones.search': 'Search bone name...',
            'bones.detail': 'Bone Detail',
            'bones.nameLocal': 'Name (Japanese)',
            'bones.nameUniversal': 'Name (English)',
            'bones.position': 'Position (X, Y, Z)',
            'bones.parentIndex': 'Parent Index',
            'bones.layer': 'Layer',
            'bones.flags': 'Flags',
            'bones.flagIndexedTail': 'Indexed Tail',
            'bones.flagRotatable': 'Rotatable',
            'bones.flagTranslatable': 'Translatable',
            'bones.flagVisible': 'Visible',
            'bones.flagEnabled': 'Enabled',
            'bones.flagIK': 'IK',
            'bones.item': 'Bone',

            // Morphs
            'morphs.title': 'Morph List',
            'morphs.search': 'Search morph name...',
            'morphs.detail': 'Morph Detail',
            'morphs.nameLocal': 'Name (Japanese)',
            'morphs.nameUniversal': 'Name (English)',
            'morphs.panelType': 'Panel Type',
            'morphs.type': 'Type',
            'morphs.offsetCount': 'Offset Count',
            'morphs.item': 'Morph',
            'morphs.panelSystem': 'System',
            'morphs.panelEyebrow': 'Eyebrow',
            'morphs.panelEye': 'Eye',
            'morphs.panelMouth': 'Mouth',
            'morphs.panelOther': 'Other',
            'morphs.typeGroup': 'Group',
            'morphs.typeVertex': 'Vertex',
            'morphs.typeBone': 'Bone',
            'morphs.typeUV': 'UV',
            'morphs.typeUVExt1': 'UV Ext1',
            'morphs.typeUVExt2': 'UV Ext2',
            'morphs.typeUVExt3': 'UV Ext3',
            'morphs.typeUVExt4': 'UV Ext4',
            'morphs.typeMaterial': 'Material',
            'morphs.typeFlip': 'Flip',
            'morphs.typeImpulse': 'Impulse',

            // Rigidbodies
            'rigidbodies.title': 'Rigidbody List',
            'rigidbodies.search': 'Search rigidbody name...',
            'rigidbodies.detail': 'Rigidbody Detail',
            'rigidbodies.nameLocal': 'Name (Japanese)',
            'rigidbodies.nameUniversal': 'Name (English)',
            'rigidbodies.shape': 'Shape',
            'rigidbodies.shapeSphere': 'Sphere',
            'rigidbodies.shapeBox': 'Box',
            'rigidbodies.shapeCapsule': 'Capsule',
            'rigidbodies.size': 'Size (X, Y, Z)',
            'rigidbodies.position': 'Position (X, Y, Z)',
            'rigidbodies.mass': 'Mass',
            'rigidbodies.physicsMode': 'Physics Mode',
            'rigidbodies.modeFollowBone': 'Follow Bone',
            'rigidbodies.modePhysics': 'Physics',
            'rigidbodies.modePhysicsBone': 'Physics + Bone',
            'rigidbodies.item': 'Rigidbody',

            // Joints
            'joints.title': 'Joint List',
            'joints.search': 'Search joint name...',
            'joints.detail': 'Joint Detail',
            'joints.nameLocal': 'Name (Japanese)',
            'joints.nameUniversal': 'Name (English)',
            'joints.type': 'Type',
            'joints.position': 'Position (X, Y, Z)',
            'joints.item': 'Joint',

            // Viewport
            'viewport.wireframe': 'Wireframe',
            'viewport.bones': 'Show Bones',
            'viewport.resetCamera': 'Reset Camera',
            'viewport.triangles': 'Triangles',

            // Errors
            'error.parseFailed': 'Failed to parse PMX file',
            'error.saveFailed': 'Failed to save PMX file',
        }
    },

    t(key, ...args) {
        const msg = this.messages[this.currentLang][key] || key;
        if (args.length === 0) return msg;
        return msg.replace(/\{(\d+)\}/g, (_, i) => args[parseInt(i)] ?? '');
    },

    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('pmx-editor-lang', lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        this.applyTranslations();
    },

    applyTranslations() {
        // Apply data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Update page title
        document.title = this.currentLang === 'zh' ? 'PMX 模型编辑器' : 'PMX Model Editor';

        // Dispatch event for dynamic content updates
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: this.currentLang } }));
    }
};
