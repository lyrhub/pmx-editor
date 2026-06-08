/**
 * PMX Writer - Serializes a PMX model object back to binary format
 */
class PMXWriter {
    constructor(model) {
        this.model = model;
        this.buffers = [];
        this.encoding = model.globals.encoding;
    }

    writeInt8(val) {
        const buf = new ArrayBuffer(1);
        new DataView(buf).setInt8(0, val);
        this.buffers.push(new Uint8Array(buf));
    }

    writeUint8(val) {
        const buf = new ArrayBuffer(1);
        new DataView(buf).setUint8(0, val);
        this.buffers.push(new Uint8Array(buf));
    }

    writeInt16(val) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setInt16(0, val, true);
        this.buffers.push(new Uint8Array(buf));
    }

    writeUint16(val) {
        const buf = new ArrayBuffer(2);
        new DataView(buf).setUint16(0, val, true);
        this.buffers.push(new Uint8Array(buf));
    }

    writeInt32(val) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setInt32(0, val, true);
        this.buffers.push(new Uint8Array(buf));
    }

    writeUint32(val) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setUint32(0, val, true);
        this.buffers.push(new Uint8Array(buf));
    }

    writeFloat32(val) {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, val, true);
        this.buffers.push(new Uint8Array(buf));
    }

    writeBytes(bytes) {
        this.buffers.push(new Uint8Array(bytes));
    }

    writeText(str) {
        let encoded;
        if (this.encoding === 0) {
            // UTF-16LE
            encoded = new Uint8Array(str.length * 2);
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i);
                encoded[i * 2] = code & 0xFF;
                encoded[i * 2 + 1] = (code >> 8) & 0xFF;
            }
        } else {
            // UTF-8
            encoded = new TextEncoder().encode(str);
        }
        this.writeInt32(encoded.length);
        this.writeBytes(encoded);
    }

    writeIndex(size, value) {
        switch (size) {
            case 1: this.writeInt8(value); break;
            case 2: this.writeInt16(value); break;
            case 4: this.writeInt32(value); break;
        }
    }

    writeUnsignedIndex(size, value) {
        switch (size) {
            case 1: this.writeUint8(value); break;
            case 2: this.writeUint16(value); break;
            case 4: this.writeInt32(value); break;
        }
    }

    writeVec2(v) {
        this.writeFloat32(v[0]);
        this.writeFloat32(v[1]);
    }

    writeVec3(v) {
        this.writeFloat32(v[0]);
        this.writeFloat32(v[1]);
        this.writeFloat32(v[2]);
    }

    writeVec4(v) {
        this.writeFloat32(v[0]);
        this.writeFloat32(v[1]);
        this.writeFloat32(v[2]);
        this.writeFloat32(v[3]);
    }

    write() {
        const model = this.model;
        const g = model.globals;

        // Signature
        this.writeBytes([0x50, 0x4D, 0x58, 0x20]);

        // Version
        this.writeFloat32(model.version);

        // Globals count (always 8 for PMX 2.0)
        this.writeUint8(8);
        this.writeUint8(g.encoding);
        this.writeUint8(g.additionalVec4Count);
        this.writeUint8(g.vertexIndexSize);
        this.writeUint8(g.textureIndexSize);
        this.writeUint8(g.materialIndexSize);
        this.writeUint8(g.boneIndexSize);
        this.writeUint8(g.morphIndexSize);
        this.writeUint8(g.rigidbodyIndexSize);

        // Model info
        this.writeText(model.nameLocal);
        this.writeText(model.nameUniversal);
        this.writeText(model.commentLocal);
        this.writeText(model.commentUniversal);

        // Vertices
        this.writeVertices(model.vertices, g);

        // Surfaces
        this.writeInt32(model.surfaces.length);
        for (const s of model.surfaces) {
            this.writeUnsignedIndex(g.vertexIndexSize, s);
        }

        // Textures
        this.writeInt32(model.textures.length);
        for (const t of model.textures) {
            this.writeText(t);
        }

        // Materials
        this.writeMaterials(model.materials, g);

        // Bones
        this.writeBones(model.bones, g);

        // Morphs
        this.writeMorphs(model.morphs, g);

        // Display frames
        this.writeDisplayFrames(model.displayFrames, g);

        // Rigid bodies
        this.writeRigidBodies(model.rigidBodies, g);

        // Joints
        this.writeJoints(model.joints, g);

        // Soft bodies (PMX 2.1)
        if (model.version >= 2.1) {
            this.writeSoftBodies(model.softBodies || [], g);
        }

        // Combine all buffers
        const totalLength = this.buffers.reduce((sum, b) => sum + b.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of this.buffers) {
            result.set(buf, offset);
            offset += buf.length;
        }
        return result.buffer;
    }

    writeVertices(vertices, g) {
        this.writeInt32(vertices.length);
        for (const v of vertices) {
            this.writeVec3(v.position);
            this.writeVec3(v.normal);
            this.writeVec2(v.uv);

            for (let i = 0; i < g.additionalVec4Count; i++) {
                this.writeVec4(v.additionalVec4[i] || [0, 0, 0, 0]);
            }

            this.writeUint8(v.deformType);
            this.writeDeform(v.deformType, v.deform, g);
            this.writeFloat32(v.edgeScale);
        }
    }

    writeDeform(type, deform, g) {
        switch (type) {
            case 0:
                this.writeIndex(g.boneIndexSize, deform.boneIndex);
                break;
            case 1:
                this.writeIndex(g.boneIndexSize, deform.boneIndex1);
                this.writeIndex(g.boneIndexSize, deform.boneIndex2);
                this.writeFloat32(deform.weight1);
                break;
            case 2:
                this.writeIndex(g.boneIndexSize, deform.boneIndex1);
                this.writeIndex(g.boneIndexSize, deform.boneIndex2);
                this.writeIndex(g.boneIndexSize, deform.boneIndex3);
                this.writeIndex(g.boneIndexSize, deform.boneIndex4);
                this.writeFloat32(deform.weight1);
                this.writeFloat32(deform.weight2);
                this.writeFloat32(deform.weight3);
                this.writeFloat32(deform.weight4);
                break;
            case 3:
                this.writeIndex(g.boneIndexSize, deform.boneIndex1);
                this.writeIndex(g.boneIndexSize, deform.boneIndex2);
                this.writeFloat32(deform.weight1);
                this.writeVec3(deform.c);
                this.writeVec3(deform.r0);
                this.writeVec3(deform.r1);
                break;
            case 4:
                this.writeIndex(g.boneIndexSize, deform.boneIndex1);
                this.writeIndex(g.boneIndexSize, deform.boneIndex2);
                this.writeIndex(g.boneIndexSize, deform.boneIndex3);
                this.writeIndex(g.boneIndexSize, deform.boneIndex4);
                this.writeFloat32(deform.weight1);
                this.writeFloat32(deform.weight2);
                this.writeFloat32(deform.weight3);
                this.writeFloat32(deform.weight4);
                break;
        }
    }

    writeMaterials(materials, g) {
        this.writeInt32(materials.length);
        for (const mat of materials) {
            this.writeText(mat.nameLocal);
            this.writeText(mat.nameUniversal);
            this.writeVec4(mat.diffuse);
            this.writeVec3(mat.specular);
            this.writeFloat32(mat.specularStrength);
            this.writeVec3(mat.ambient);
            this.writeUint8(mat.flags);
            this.writeVec4(mat.edgeColor);
            this.writeFloat32(mat.edgeScale);
            this.writeIndex(g.textureIndexSize, mat.textureIndex);
            this.writeIndex(g.textureIndexSize, mat.environmentIndex);
            this.writeUint8(mat.environmentBlendMode);
            this.writeUint8(mat.toonReference);
            if (mat.toonReference === 0) {
                this.writeIndex(g.textureIndexSize, mat.toonValue);
            } else {
                this.writeUint8(mat.toonValue);
            }
            this.writeText(mat.metadata);
            this.writeInt32(mat.surfaceCount);
        }
    }

    writeBones(bones, g) {
        this.writeInt32(bones.length);
        for (const bone of bones) {
            this.writeText(bone.nameLocal);
            this.writeText(bone.nameUniversal);
            this.writeVec3(bone.position);
            this.writeIndex(g.boneIndexSize, bone.parentIndex);
            this.writeInt32(bone.layer);
            this.writeUint16(bone.flags);

            if (bone.flags & 0x0001) {
                this.writeIndex(g.boneIndexSize, bone.tailIndex);
            } else {
                this.writeVec3(bone.tailPosition);
            }

            if (bone.flags & 0x0100 || bone.flags & 0x0200) {
                this.writeIndex(g.boneIndexSize, bone.inheritParentIndex);
                this.writeFloat32(bone.inheritWeight);
            }

            if (bone.flags & 0x0400) {
                this.writeVec3(bone.fixedAxis);
            }

            if (bone.flags & 0x0800) {
                this.writeVec3(bone.localCoordinateX);
                this.writeVec3(bone.localCoordinateZ);
            }

            if (bone.flags & 0x2000) {
                this.writeInt32(bone.externalParentIndex);
            }

            if (bone.flags & 0x0020) {
                this.writeIK(bone.ik, g);
            }
        }
    }

    writeIK(ik, g) {
        this.writeIndex(g.boneIndexSize, ik.targetIndex);
        this.writeInt32(ik.loopCount);
        this.writeFloat32(ik.limitRadian);
        this.writeInt32(ik.links.length);
        for (const link of ik.links) {
            this.writeIndex(g.boneIndexSize, link.boneIndex);
            this.writeUint8(link.hasLimits);
            if (link.hasLimits) {
                this.writeVec3(link.limitMin);
                this.writeVec3(link.limitMax);
            }
        }
    }

    writeMorphs(morphs, g) {
        this.writeInt32(morphs.length);
        for (const morph of morphs) {
            this.writeText(morph.nameLocal);
            this.writeText(morph.nameUniversal);
            this.writeUint8(morph.panelType);
            this.writeUint8(morph.type);
            this.writeInt32(morph.offsets.length);
            for (const offset of morph.offsets) {
                this.writeMorphOffset(morph.type, offset, g);
            }
        }
    }

    writeMorphOffset(type, offset, g) {
        switch (type) {
            case 0: // Group
                this.writeIndex(g.morphIndexSize, offset.morphIndex);
                this.writeFloat32(offset.influence);
                break;
            case 1: // Vertex
                this.writeUnsignedIndex(g.vertexIndexSize, offset.vertexIndex);
                this.writeVec3(offset.translation);
                break;
            case 2: // Bone
                this.writeIndex(g.boneIndexSize, offset.boneIndex);
                this.writeVec3(offset.translation);
                this.writeVec4(offset.rotation);
                break;
            case 3: case 4: case 5: case 6: case 7: // UV
                this.writeUnsignedIndex(g.vertexIndexSize, offset.vertexIndex);
                this.writeVec4(offset.floats);
                break;
            case 8: // Material
                this.writeIndex(g.materialIndexSize, offset.materialIndex);
                this.writeUint8(offset.operation);
                this.writeVec4(offset.diffuse);
                this.writeVec3(offset.specular);
                this.writeFloat32(offset.specularity);
                this.writeVec3(offset.ambient);
                this.writeVec4(offset.edgeColor);
                this.writeFloat32(offset.edgeSize);
                this.writeVec4(offset.textureTint);
                this.writeVec4(offset.environmentTint);
                this.writeVec4(offset.toonTint);
                break;
            case 9: // Flip
                this.writeIndex(g.morphIndexSize, offset.morphIndex);
                this.writeFloat32(offset.influence);
                break;
            case 10: // Impulse
                this.writeIndex(g.rigidbodyIndexSize, offset.rigidbodyIndex);
                this.writeUint8(offset.localFlag);
                this.writeVec3(offset.movementSpeed);
                this.writeVec3(offset.rotationTorque);
                break;
        }
    }

    writeDisplayFrames(frames, g) {
        this.writeInt32(frames.length);
        for (const frame of frames) {
            this.writeText(frame.nameLocal);
            this.writeText(frame.nameUniversal);
            this.writeUint8(frame.specialFlag);
            this.writeInt32(frame.elements.length);
            for (const el of frame.elements) {
                this.writeUint8(el.type);
                if (el.type === 0) {
                    this.writeIndex(g.boneIndexSize, el.index);
                } else {
                    this.writeIndex(g.morphIndexSize, el.index);
                }
            }
        }
    }

    writeRigidBodies(bodies, g) {
        this.writeInt32(bodies.length);
        for (const body of bodies) {
            this.writeText(body.nameLocal);
            this.writeText(body.nameUniversal);
            this.writeIndex(g.boneIndexSize, body.relatedBoneIndex);
            this.writeUint8(body.groupId);
            this.writeUint16(body.nonCollisionGroup);
            this.writeUint8(body.shape);
            this.writeVec3(body.shapeSize);
            this.writeVec3(body.shapePosition);
            this.writeVec3(body.shapeRotation);
            this.writeFloat32(body.mass);
            this.writeFloat32(body.moveAttenuation);
            this.writeFloat32(body.rotationDamping);
            this.writeFloat32(body.repulsion);
            this.writeFloat32(body.frictionForce);
            this.writeUint8(body.physicsMode);
        }
    }

    writeJoints(joints, g) {
        this.writeInt32(joints.length);
        for (const joint of joints) {
            this.writeText(joint.nameLocal);
            this.writeText(joint.nameUniversal);
            this.writeUint8(joint.type);
            this.writeIndex(g.rigidbodyIndexSize, joint.rigidBodyIndexA);
            this.writeIndex(g.rigidbodyIndexSize, joint.rigidBodyIndexB);
            this.writeVec3(joint.position);
            this.writeVec3(joint.rotation);
            this.writeVec3(joint.positionMin);
            this.writeVec3(joint.positionMax);
            this.writeVec3(joint.rotationMin);
            this.writeVec3(joint.rotationMax);
            this.writeVec3(joint.positionSpring);
            this.writeVec3(joint.rotationSpring);
        }
    }

    writeSoftBodies(bodies, g) {
        this.writeInt32(bodies.length);
        for (const body of bodies) {
            this.writeText(body.nameLocal);
            this.writeText(body.nameUniversal);
            this.writeUint8(body.shape);
            this.writeIndex(g.materialIndexSize, body.materialIndex);
            this.writeUint8(body.group);
            this.writeUint16(body.nonCollisionMask);
            this.writeUint8(body.flags);
            this.writeInt32(body.bLinkCreateDistance);
            this.writeInt32(body.numberOfClusters);
            this.writeFloat32(body.totalMass);
            this.writeFloat32(body.collisionMargin);
            this.writeInt32(body.aerodynamicsModel);

            this.writeFloat32(body.configVCF);
            this.writeFloat32(body.configDP);
            this.writeFloat32(body.configDG);
            this.writeFloat32(body.configLF);
            this.writeFloat32(body.configPR);
            this.writeFloat32(body.configVC);
            this.writeFloat32(body.configDF);
            this.writeFloat32(body.configMT);
            this.writeFloat32(body.configCHR);
            this.writeFloat32(body.configKHR);
            this.writeFloat32(body.configSHR);
            this.writeFloat32(body.configAHR);

            this.writeFloat32(body.clusterSRHR);
            this.writeFloat32(body.clusterSKHR);
            this.writeFloat32(body.clusterSSHR);
            this.writeFloat32(body.clusterSRSPLT);
            this.writeFloat32(body.clusterSKSPLT);
            this.writeFloat32(body.clusterSSSPLT);

            this.writeInt32(body.iterationVIT);
            this.writeInt32(body.iterationPIT);
            this.writeInt32(body.iterationDIT);
            this.writeInt32(body.iterationCIT);

            this.writeInt32(body.materialLST);
            this.writeInt32(body.materialAST);
            this.writeInt32(body.materialVST);

            this.writeInt32(body.anchors.length);
            for (const anchor of body.anchors) {
                this.writeIndex(g.rigidbodyIndexSize, anchor.rigidbodyIndex);
                this.writeUnsignedIndex(g.vertexIndexSize, anchor.vertexIndex);
                this.writeUint8(anchor.nearMode);
            }

            this.writeInt32(body.vertexPins.length);
            for (const pin of body.vertexPins) {
                this.writeUnsignedIndex(g.vertexIndexSize, pin);
            }
        }
    }
}
