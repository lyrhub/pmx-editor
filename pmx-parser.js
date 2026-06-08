/**
 * PMX (Polygon Model eXtended) 2.0/2.1 Binary Parser
 * Parses MMD PMX model files into editable JavaScript objects.
 */
class PMXParser {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this.offset = 0;
        this.encoding = 0; // 0=UTF16LE, 1=UTF8
        this.additionalVec4Count = 0;
        this.vertexIndexSize = 4;
        this.textureIndexSize = 4;
        this.materialIndexSize = 4;
        this.boneIndexSize = 4;
        this.morphIndexSize = 4;
        this.rigidbodyIndexSize = 4;
    }

    readInt8() {
        const val = this.view.getInt8(this.offset);
        this.offset += 1;
        return val;
    }

    readUint8() {
        const val = this.view.getUint8(this.offset);
        this.offset += 1;
        return val;
    }

    readInt16() {
        const val = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return val;
    }

    readUint16() {
        const val = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return val;
    }

    readInt32() {
        const val = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readUint32() {
        const val = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readFloat32() {
        const val = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return val;
    }

    readBytes(length) {
        const bytes = new Uint8Array(this.buffer, this.offset, length);
        this.offset += length;
        return bytes;
    }

    readText() {
        const length = this.readInt32();
        if (length === 0) return '';
        const bytes = this.readBytes(length);
        if (this.encoding === 0) {
            // UTF-16LE
            const u16 = new Uint16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
            return String.fromCharCode(...u16);
        } else {
            // UTF-8
            return new TextDecoder('utf-8').decode(bytes);
        }
    }

    readIndex(size, unsigned = false) {
        switch (size) {
            case 1: return unsigned ? this.readUint8() : this.readInt8();
            case 2: return unsigned ? this.readUint16() : this.readInt16();
            case 4: return this.readInt32();
            default: throw new Error(`Invalid index size: ${size}`);
        }
    }

    readVertexIndex() {
        return this.readIndex(this.vertexIndexSize, true);
    }

    readTextureIndex() {
        return this.readIndex(this.textureIndexSize);
    }

    readMaterialIndex() {
        return this.readIndex(this.materialIndexSize);
    }

    readBoneIndex() {
        return this.readIndex(this.boneIndexSize);
    }

    readMorphIndex() {
        return this.readIndex(this.morphIndexSize);
    }

    readRigidbodyIndex() {
        return this.readIndex(this.rigidbodyIndexSize);
    }

    readVec2() {
        return [this.readFloat32(), this.readFloat32()];
    }

    readVec3() {
        return [this.readFloat32(), this.readFloat32(), this.readFloat32()];
    }

    readVec4() {
        return [this.readFloat32(), this.readFloat32(), this.readFloat32(), this.readFloat32()];
    }

    parse() {
        const model = {};

        // Header
        const sig = this.readBytes(4);
        const signature = String.fromCharCode(...sig);
        if (signature !== 'PMX ') {
            throw new Error('Not a valid PMX file (invalid signature)');
        }

        model.version = this.readFloat32();
        const globalsCount = this.readUint8();

        // Globals
        this.encoding = this.readUint8();
        this.additionalVec4Count = this.readUint8();
        this.vertexIndexSize = this.readUint8();
        this.textureIndexSize = this.readUint8();
        this.materialIndexSize = this.readUint8();
        this.boneIndexSize = this.readUint8();
        this.morphIndexSize = this.readUint8();
        this.rigidbodyIndexSize = this.readUint8();

        model.globals = {
            encoding: this.encoding,
            additionalVec4Count: this.additionalVec4Count,
            vertexIndexSize: this.vertexIndexSize,
            textureIndexSize: this.textureIndexSize,
            materialIndexSize: this.materialIndexSize,
            boneIndexSize: this.boneIndexSize,
            morphIndexSize: this.morphIndexSize,
            rigidbodyIndexSize: this.rigidbodyIndexSize
        };

        // Model info
        model.nameLocal = this.readText();
        model.nameUniversal = this.readText();
        model.commentLocal = this.readText();
        model.commentUniversal = this.readText();

        // Vertices
        model.vertices = this.parseVertices();

        // Surfaces (faces)
        model.surfaces = this.parseSurfaces();

        // Textures
        model.textures = this.parseTextures();

        // Materials
        model.materials = this.parseMaterials();

        // Bones
        model.bones = this.parseBones();

        // Morphs
        model.morphs = this.parseMorphs();

        // Display frames
        model.displayFrames = this.parseDisplayFrames();

        // Rigid bodies
        model.rigidBodies = this.parseRigidBodies();

        // Joints
        model.joints = this.parseJoints();

        // Soft bodies (PMX 2.1)
        if (model.version >= 2.1 && this.offset < this.buffer.byteLength) {
            try {
                model.softBodies = this.parseSoftBodies();
            } catch (e) {
                model.softBodies = [];
            }
        } else {
            model.softBodies = [];
        }

        return model;
    }

    parseVertices() {
        const count = this.readInt32();
        const vertices = new Array(count);

        for (let i = 0; i < count; i++) {
            const vertex = {};
            vertex.position = this.readVec3();
            vertex.normal = this.readVec3();
            vertex.uv = this.readVec2();

            vertex.additionalVec4 = [];
            for (let j = 0; j < this.additionalVec4Count; j++) {
                vertex.additionalVec4.push(this.readVec4());
            }

            vertex.deformType = this.readUint8();
            vertex.deform = this.parseDeform(vertex.deformType);
            vertex.edgeScale = this.readFloat32();

            vertices[i] = vertex;
        }

        return vertices;
    }

    parseDeform(type) {
        switch (type) {
            case 0: // BDEF1
                return { boneIndex: this.readBoneIndex() };
            case 1: // BDEF2
                return {
                    boneIndex1: this.readBoneIndex(),
                    boneIndex2: this.readBoneIndex(),
                    weight1: this.readFloat32()
                };
            case 2: // BDEF4
                return {
                    boneIndex1: this.readBoneIndex(),
                    boneIndex2: this.readBoneIndex(),
                    boneIndex3: this.readBoneIndex(),
                    boneIndex4: this.readBoneIndex(),
                    weight1: this.readFloat32(),
                    weight2: this.readFloat32(),
                    weight3: this.readFloat32(),
                    weight4: this.readFloat32()
                };
            case 3: // SDEF
                return {
                    boneIndex1: this.readBoneIndex(),
                    boneIndex2: this.readBoneIndex(),
                    weight1: this.readFloat32(),
                    c: this.readVec3(),
                    r0: this.readVec3(),
                    r1: this.readVec3()
                };
            case 4: // QDEF
                return {
                    boneIndex1: this.readBoneIndex(),
                    boneIndex2: this.readBoneIndex(),
                    boneIndex3: this.readBoneIndex(),
                    boneIndex4: this.readBoneIndex(),
                    weight1: this.readFloat32(),
                    weight2: this.readFloat32(),
                    weight3: this.readFloat32(),
                    weight4: this.readFloat32()
                };
            default:
                throw new Error(`Unknown deform type: ${type}`);
        }
    }

    parseSurfaces() {
        const count = this.readInt32();
        const surfaces = new Array(count);
        for (let i = 0; i < count; i++) {
            surfaces[i] = this.readVertexIndex();
        }
        return surfaces;
    }

    parseTextures() {
        const count = this.readInt32();
        const textures = new Array(count);
        for (let i = 0; i < count; i++) {
            textures[i] = this.readText();
        }
        return textures;
    }

    parseMaterials() {
        const count = this.readInt32();
        const materials = new Array(count);

        for (let i = 0; i < count; i++) {
            const mat = {};
            mat.nameLocal = this.readText();
            mat.nameUniversal = this.readText();
            mat.diffuse = this.readVec4();
            mat.specular = this.readVec3();
            mat.specularStrength = this.readFloat32();
            mat.ambient = this.readVec3();
            mat.flags = this.readUint8();
            mat.edgeColor = this.readVec4();
            mat.edgeScale = this.readFloat32();
            mat.textureIndex = this.readTextureIndex();
            mat.environmentIndex = this.readTextureIndex();
            mat.environmentBlendMode = this.readUint8();
            mat.toonReference = this.readUint8();
            if (mat.toonReference === 0) {
                mat.toonValue = this.readTextureIndex();
            } else {
                mat.toonValue = this.readUint8();
            }
            mat.metadata = this.readText();
            mat.surfaceCount = this.readInt32();

            materials[i] = mat;
        }

        return materials;
    }

    parseBones() {
        const count = this.readInt32();
        const bones = new Array(count);

        for (let i = 0; i < count; i++) {
            const bone = {};
            bone.nameLocal = this.readText();
            bone.nameUniversal = this.readText();
            bone.position = this.readVec3();
            bone.parentIndex = this.readBoneIndex();
            bone.layer = this.readInt32();
            bone.flags = this.readUint16();

            // Tail position
            if (bone.flags & 0x0001) {
                bone.tailIndex = this.readBoneIndex();
            } else {
                bone.tailPosition = this.readVec3();
            }

            // Inherit
            if (bone.flags & 0x0100 || bone.flags & 0x0200) {
                bone.inheritParentIndex = this.readBoneIndex();
                bone.inheritWeight = this.readFloat32();
            }

            // Fixed axis
            if (bone.flags & 0x0400) {
                bone.fixedAxis = this.readVec3();
            }

            // Local coordinate
            if (bone.flags & 0x0800) {
                bone.localCoordinateX = this.readVec3();
                bone.localCoordinateZ = this.readVec3();
            }

            // External parent
            if (bone.flags & 0x2000) {
                bone.externalParentIndex = this.readInt32();
            }

            // IK
            if (bone.flags & 0x0020) {
                bone.ik = this.parseIK();
            }

            bones[i] = bone;
        }

        return bones;
    }

    parseIK() {
        const ik = {};
        ik.targetIndex = this.readBoneIndex();
        ik.loopCount = this.readInt32();
        ik.limitRadian = this.readFloat32();
        const linkCount = this.readInt32();
        ik.links = new Array(linkCount);

        for (let i = 0; i < linkCount; i++) {
            const link = {};
            link.boneIndex = this.readBoneIndex();
            link.hasLimits = this.readUint8();
            if (link.hasLimits) {
                link.limitMin = this.readVec3();
                link.limitMax = this.readVec3();
            }
            ik.links[i] = link;
        }

        return ik;
    }

    parseMorphs() {
        const count = this.readInt32();
        const morphs = new Array(count);

        for (let i = 0; i < count; i++) {
            const morph = {};
            morph.nameLocal = this.readText();
            morph.nameUniversal = this.readText();
            morph.panelType = this.readUint8();
            morph.type = this.readUint8();
            const offsetCount = this.readInt32();
            morph.offsets = new Array(offsetCount);

            for (let j = 0; j < offsetCount; j++) {
                morph.offsets[j] = this.parseMorphOffset(morph.type);
            }

            morphs[i] = morph;
        }

        return morphs;
    }

    parseMorphOffset(type) {
        switch (type) {
            case 0: // Group
                return { morphIndex: this.readMorphIndex(), influence: this.readFloat32() };
            case 1: // Vertex
                return { vertexIndex: this.readVertexIndex(), translation: this.readVec3() };
            case 2: // Bone
                return {
                    boneIndex: this.readBoneIndex(),
                    translation: this.readVec3(),
                    rotation: this.readVec4()
                };
            case 3: case 4: case 5: case 6: case 7: // UV
                return { vertexIndex: this.readVertexIndex(), floats: this.readVec4() };
            case 8: // Material
                return {
                    materialIndex: this.readMaterialIndex(),
                    operation: this.readUint8(),
                    diffuse: this.readVec4(),
                    specular: this.readVec3(),
                    specularity: this.readFloat32(),
                    ambient: this.readVec3(),
                    edgeColor: this.readVec4(),
                    edgeSize: this.readFloat32(),
                    textureTint: this.readVec4(),
                    environmentTint: this.readVec4(),
                    toonTint: this.readVec4()
                };
            case 9: // Flip
                return { morphIndex: this.readMorphIndex(), influence: this.readFloat32() };
            case 10: // Impulse
                return {
                    rigidbodyIndex: this.readRigidbodyIndex(),
                    localFlag: this.readUint8(),
                    movementSpeed: this.readVec3(),
                    rotationTorque: this.readVec3()
                };
            default:
                throw new Error(`Unknown morph type: ${type}`);
        }
    }

    parseDisplayFrames() {
        const count = this.readInt32();
        const frames = new Array(count);

        for (let i = 0; i < count; i++) {
            const frame = {};
            frame.nameLocal = this.readText();
            frame.nameUniversal = this.readText();
            frame.specialFlag = this.readUint8();
            const elementCount = this.readInt32();
            frame.elements = new Array(elementCount);

            for (let j = 0; j < elementCount; j++) {
                const element = {};
                element.type = this.readUint8();
                if (element.type === 0) {
                    element.index = this.readBoneIndex();
                } else {
                    element.index = this.readMorphIndex();
                }
                frame.elements[j] = element;
            }

            frames[i] = frame;
        }

        return frames;
    }

    parseRigidBodies() {
        const count = this.readInt32();
        const bodies = new Array(count);

        for (let i = 0; i < count; i++) {
            const body = {};
            body.nameLocal = this.readText();
            body.nameUniversal = this.readText();
            body.relatedBoneIndex = this.readBoneIndex();
            body.groupId = this.readUint8();
            body.nonCollisionGroup = this.readUint16();
            body.shape = this.readUint8();
            body.shapeSize = this.readVec3();
            body.shapePosition = this.readVec3();
            body.shapeRotation = this.readVec3();
            body.mass = this.readFloat32();
            body.moveAttenuation = this.readFloat32();
            body.rotationDamping = this.readFloat32();
            body.repulsion = this.readFloat32();
            body.frictionForce = this.readFloat32();
            body.physicsMode = this.readUint8();

            bodies[i] = body;
        }

        return bodies;
    }

    parseJoints() {
        const count = this.readInt32();
        const joints = new Array(count);

        for (let i = 0; i < count; i++) {
            const joint = {};
            joint.nameLocal = this.readText();
            joint.nameUniversal = this.readText();
            joint.type = this.readUint8();
            joint.rigidBodyIndexA = this.readRigidbodyIndex();
            joint.rigidBodyIndexB = this.readRigidbodyIndex();
            joint.position = this.readVec3();
            joint.rotation = this.readVec3();
            joint.positionMin = this.readVec3();
            joint.positionMax = this.readVec3();
            joint.rotationMin = this.readVec3();
            joint.rotationMax = this.readVec3();
            joint.positionSpring = this.readVec3();
            joint.rotationSpring = this.readVec3();

            joints[i] = joint;
        }

        return joints;
    }

    parseSoftBodies() {
        const count = this.readInt32();
        const bodies = new Array(count);

        for (let i = 0; i < count; i++) {
            const body = {};
            body.nameLocal = this.readText();
            body.nameUniversal = this.readText();
            body.shape = this.readUint8();
            body.materialIndex = this.readMaterialIndex();
            body.group = this.readUint8();
            body.nonCollisionMask = this.readUint16();
            body.flags = this.readUint8();
            body.bLinkCreateDistance = this.readInt32();
            body.numberOfClusters = this.readInt32();
            body.totalMass = this.readFloat32();
            body.collisionMargin = this.readFloat32();
            body.aerodynamicsModel = this.readInt32();

            // Config values
            body.configVCF = this.readFloat32();
            body.configDP = this.readFloat32();
            body.configDG = this.readFloat32();
            body.configLF = this.readFloat32();
            body.configPR = this.readFloat32();
            body.configVC = this.readFloat32();
            body.configDF = this.readFloat32();
            body.configMT = this.readFloat32();
            body.configCHR = this.readFloat32();
            body.configKHR = this.readFloat32();
            body.configSHR = this.readFloat32();
            body.configAHR = this.readFloat32();

            // Cluster values
            body.clusterSRHR = this.readFloat32();
            body.clusterSKHR = this.readFloat32();
            body.clusterSSHR = this.readFloat32();
            body.clusterSRSPLT = this.readFloat32();
            body.clusterSKSPLT = this.readFloat32();
            body.clusterSSSPLT = this.readFloat32();

            // Iteration values
            body.iterationVIT = this.readInt32();
            body.iterationPIT = this.readInt32();
            body.iterationDIT = this.readInt32();
            body.iterationCIT = this.readInt32();

            // Material values
            body.materialLST = this.readInt32();
            body.materialAST = this.readInt32();
            body.materialVST = this.readInt32();

            // Anchors
            const anchorCount = this.readInt32();
            body.anchors = new Array(anchorCount);
            for (let j = 0; j < anchorCount; j++) {
                body.anchors[j] = {
                    rigidbodyIndex: this.readRigidbodyIndex(),
                    vertexIndex: this.readVertexIndex(),
                    nearMode: this.readUint8()
                };
            }

            // Vertex pins
            const pinCount = this.readInt32();
            body.vertexPins = new Array(pinCount);
            for (let j = 0; j < pinCount; j++) {
                body.vertexPins[j] = this.readVertexIndex();
            }

            bodies[i] = body;
        }

        return bodies;
    }
}
