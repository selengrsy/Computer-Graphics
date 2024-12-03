/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		this.enableLightLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
		
		this.normbuffer = gl.createBuffer();
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */
		 // Enable normals for lighting
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

		updateLightPos();
		gl.uniform3fv(this.lightPosLoc, normalize([lightX, lightY, 2]));
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, isSecondTexture = false) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
		if (isSecondTexture) {
			gl.activeTexture(gl.TEXTURE1); // Bind to texture unit 1
			gl.bindTexture(gl.TEXTURE_2D, texture);
			const samplerLoc = gl.getUniformLocation(this.prog, 'tex2');
			gl.uniform1i(samplerLoc, 1);
			console.log("Second texture set:", img.src);
		} else {
			gl.activeTexture(gl.TEXTURE0); // Bind to texture unit 0
			gl.bindTexture(gl.TEXTURE_2D, texture);
			const samplerLoc = gl.getUniformLocation(this.prog, 'tex');
			gl.uniform1i(samplerLoc, 0);
			console.log("First texture set:", img.src);
		}
	}
	
	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	setBlendFactor(factor) {
		console.log('Passing Blend Factor to Shader:', factor); // Debug log
		gl.useProgram(this.prog);
		gl.uniform1f(this.blendFactorLoc, factor);
	}

	enableLighting(show) {
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		gl.useProgram(this.prog);
		gl.uniform1i(this.enableLightLoc, show ? 1 : 0);
	}
	
	setAmbientLight(ambient) {	
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		gl.useProgram(this.prog);
   		gl.uniform1f(this.ambientLoc, ambient);
	}

	setSpecularLight(intensity) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.specularIntensityLoc, intensity);
    }
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 
			varying vec3 fragPos;

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;
				fragPos = pos;
				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;
			
			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;    // First texture
			uniform sampler2D tex2;   // Second texture
			uniform vec3 lightPos;
			uniform float ambient;
			uniform float specularIntensity;
			uniform float blendFactor; // Blending factor between textures

			varying vec2 v_texCoord;
			varying vec3 v_normal;
			varying vec3 fragPos;

			void main() {
				vec3 baseColor = vec3(1.0); // Default white base color

				if (showTex) {
					// Fetch and blend textures
					vec3 color1 = texture2D(tex, v_texCoord).rgb;
					vec3 color2 = texture2D(tex2, v_texCoord).rgb;
					baseColor = mix(color1, color2, blendFactor); // Blend textures using blendFactor
				}

				if (enableLighting) {
					// Normalize input vectors
					vec3 normal = normalize(v_normal);
					vec3 lightDir = normalize(lightPos);
					vec3 viewDir = vec3(-fragPos); 
					vec3 reflectDir = reflect(-lightDir, normal);

					// Calculate ambient lighting
					vec3 ambientLight = ambient * baseColor;

					// Calculate diffuse lighting
					float diffuse = max(dot(normal, -lightDir), 0.0);
					vec3 diffuseLight = diffuse * baseColor;

					// Calculate specular lighting
					float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0); // Shininess = 32
					vec3 specularLight = specularIntensity * spec * vec3(1.0);

					// Combine lighting components
					vec3 lighting = ambientLight + diffuseLight + specularLight;

					gl_FragColor = vec4(lighting, 1.0);
				} else {
					gl_FragColor = vec4(baseColor, 1.0);
				}
			}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}

window.SetSpecularLight = function(param) {
    const intensity = parseFloat(param.value) / 100.0; // Normalize slider value
    meshDrawer.setSpecularLight(intensity);
    DrawScene(); // Redraw scene with updated lighting
};

window.SetBlendFactor = function(param) {
    const factor = parseFloat(param.value) / 100.0; // Normalize slider value
    console.log('Set Blend Factor:', factor); // Debug log
    meshDrawer.setBlendFactor(factor);
    DrawScene(); // Redraw the scene
};

function LoadTexture2(param) {
    if (param.files && param.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result; // Load the image source
            img.onload = function() {
                // Load the second texture to texture unit 1
                meshDrawer.setTexture(img, true);
                meshDrawer.setBlendFactor(0.5); // Example starting blend factor
                DrawScene(); // Redraw the scene with the updated second texture
            };
        };
        reader.readAsDataURL(param.files[0]); // Read the file as a Data URL
    }
}

///////////////////////////////////////////////////////////////////////////////////