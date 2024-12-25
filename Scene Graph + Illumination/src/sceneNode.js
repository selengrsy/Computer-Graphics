/**
 * @class SceneNode
 * @desc A SceneNode is a node in the scene graph.
 * @property {MeshDrawer} meshDrawer - The MeshDrawer object to draw
 * @property {TRS} trs - The TRS object to transform the MeshDrawer
 * @property {SceneNode} parent - The parent node
 * @property {Array} children - The children nodes
 */

class SceneNode {
    constructor(meshDrawer, trs, parent = null) {
        this.meshDrawer = meshDrawer;
        this.trs = trs;
        this.parent = parent;
        this.children = [];

        if (parent) {
            this.parent.__addChild(this);
        }
    }

    __addChild(node) {
        this.children.push(node);
    }

    draw(mvp, modelView, normalMatrix, modelMatrix) {
        // Calculate transformed matrices
        var transformedModel = modelMatrix;
        var transformedModelView = modelView;
        var transformedMvp = mvp;
        var transformedNormals = normalMatrix;
    
        if (this.trs) {
            // Get the transformation matrices separately
            const translationMatrix = this.trs.getTranslationMatrix();
            const rotationMatrix = this.trs.getRotationMatrix();
            const scaleMatrix = this.trs.getScaleMatrix();
            
            // Combine the transformations
            const trsMatrix = MatrixMult(MatrixMult(translationMatrix, rotationMatrix), scaleMatrix);
            
            // Apply transformations
            transformedModel = MatrixMult(modelMatrix, trsMatrix);
            transformedModelView = MatrixMult(modelView, trsMatrix);
            transformedMvp = MatrixMult(mvp, trsMatrix);
            transformedNormals = getNormalMatrix(transformedModel);
        }
    
        // Draw the MeshDrawer if it exists
        if (this.meshDrawer) {
            this.meshDrawer.draw(transformedMvp, transformedModelView, transformedNormals, transformedModel);
        }
    
        // Recursively draw all children
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].draw(transformedMvp, transformedModelView, transformedNormals, transformedModel);
        }
    }

    

}