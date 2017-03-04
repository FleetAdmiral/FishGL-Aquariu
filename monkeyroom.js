app.monkeyPositionTimer = 0;

function floatMonkey(){
  app.monkeyPositionTimer = app.monkeyPositionTimer > Math.PI * 2 ? 0 : app.monkeyPositionTimer + 0.05;
  app.monkey.position[Y] = Math.sin( app.monkeyPositionTimer )/5+1.3;
  app.monkey.position[X] = Math.cos(app.monkeyPositionTimer)/5;
}
app.monkeyRoomCollision = 6;
function roomCollisionCheck(){
  if( app.camera.position[X] > app.monkeyRoomCollision ){
    app.camera.position[X] = app.monkeyRoomCollision
  }
  if( app.camera.position[X] < -app.monkeyRoomCollision ){
    app.camera.position[X] = -app.monkeyRoomCollision
  }
  if( app.camera.position[Z] > app.monkeyRoomCollision ){
    app.camera.position[Z] = app.monkeyRoomCollision
  }
  if( app.camera.position[Z] < -app.monkeyRoomCollision ){
    app.camera.position[Z] = -app.monkeyRoomCollision
  }
}

function createParticles( num, min, max, maxVector, maxTTL, particles ){
  var rangeX = max[X] - min[X];
  var halfRangeX = rangeX/2;
  var rangeY = max[Y] - min[Y];
  var halfRangeY = rangeY/2;
  var rangeZ = max[Z] - min[Z];
  var halfRangeZ = rangeZ/2;

  var halfMaxVector = maxVector / 2;

  // holds single dimension array of x,y,z coords
  particles.locations = [];
  // holds single dimension array of vector direction using x,y,z coords
  particles.vectors = [];
  // holds a single float for the particle's time to live
  particles.ttl = [];
  for(i=0;i<num;i+=1){
    // push x
    particles.locations.push( (Math.random() *  rangeX) - halfRangeX );
    // push y
    particles.locations.push( (Math.random() *  rangeY) - halfRangeY );
    // push z
    particles.locations.push( (Math.random() *  rangeZ) - halfRangeZ );
    // vectors
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector );
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector );
    particles.vectors.push( (Math.random() *  maxVector) - halfMaxVector + 3);
    // TTL
    particles.ttl.push( Math.random() * maxTTL );
  }

  particles.locationsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.locationsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.locations ), gl.STATIC_DRAW);
  particles.locationsBuffer.itemSize = 3;
  particles.locationsBuffer.numItems = particles.locations.length / 3;

  particles.vectorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.vectorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.vectors ), gl.STATIC_DRAW);
  particles.vectorsBuffer.itemSize = 3;
  particles.vectorsBuffer.numItems = particles.vectors.length / 3;

  particles.ttlBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, particles.ttlBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array( particles.ttl ), gl.STATIC_DRAW);
  particles.ttlBuffer.itemSize = 1;
  particles.ttlBuffer.numItems = particles.ttl.length;

}

function drawMonkeyRoom(){
  var viewMatrix = mat4.create();
  mat4.identity(viewMatrix);
  var modelMatrix = mat4.create();
  mat4.identity(modelMatrix);

  floatMonkey();
  roomCollisionCheck();
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0, app.pMatrix);

  vec3.negate( app.camera.position, app.camera.inversePosition )

  mat4.identity( app.mvMatrix )
  // camera position and rotations
  mat4.rotate( viewMatrix, degToRad( app.camera.pitch ), [1,0,0] );
  // account for pitch rotation and light down vector
  mat4.rotate( viewMatrix, degToRad( app.camera.heading ), [0,1,0] );
  mat4.translate( viewMatrix, app.camera.inversePosition );

  gl.useProgram( shaderProgram );

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(viewMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  mat3.multiplyVec3( normalMatrix, app.lightVectorStatic, app.lightVector )
  mat4.multiplyVec3( viewMatrix, app.lightLocationStatic, app.lightLocation )
  gl.uniform3fv( shaderProgram.lightLocation, [0,2,2] );
  gl.uniform3fv( shaderProgram.lightVector, app.lightVector );

  setUniforms();

  mvPushMatrix();
    mvPushMatrix();
    mat4.scale( modelMatrix, [2,2,2] )
    mat4.multiply(viewMatrix, modelMatrix, app.mvMatrix)
    drawObject( app.models.room_walls, 0 );
    mvPopMatrix();
    // if( !app.breakWalls ){
    //   drawObject( app.models.room_wall_unbroken, 0 );
    // }
    drawObject( app.models.room_floor, 0 );
    drawObject( app.models.room_ceiling, 0 );
    //drawObject( app.models.pedestal, 50, [0.75,0.75,0.75,1.0] );

      for (let i of fish) {
        if(i.type != -1)
        {
          mvPushMatrix();
          mat4.identity(modelMatrix);
          mat4.scale( modelMatrix, [2,2,2] )
          // mat4.translate( app.mvMatrix, -app.camera.inversePosition );
          // console.log(app.)
          mat4.scale(modelMatrix,[i.size,i.size,i.size]);
          mat4.translate( modelMatrix, [i.x, i.y, i.z] );
          mat4.rotate( modelMatrix, degToRad( 90-i.theta ), [0,1,0] );
          mat4.rotate( modelMatrix, degToRad( -i.phi ), [1,0,0] );
          // console.log([i.x, i.y, i.z]);
          app.mvMatrix = mat4.identity();
          mat4.multiply(viewMatrix, modelMatrix, app.mvMatrix)
          // mat4.rotate( app.mvMatrix, degToRad( i.phi ), [1,0,0] );
          i.y += i.v*Math.sin(degToRad(i.phi))
          i.x += i.v*Math.cos(degToRad(i.phi))*Math.cos(degToRad(i.theta))
          i.z += i.v*Math.cos(degToRad(i.phi))*Math.sin(degToRad(i.theta))
          if(i.phi > 30){
            i.phi = 30
          }
          if(i.phi < -30){
            i.phi = -30
          }
          var dirchangespeed = 1
          if(Math.abs(i.x) >= 10 || Math.abs(i.z) >= 10)
          {
            i.theta -= dirchangespeed
          }

          if(i.y >= 2.5)
          {
            i.phi -= dirchangespeed/2
          }
          if(i.y < 1.5)
          {
            i.phi += dirchangespeed/2
          }
          if(i.size < 0.1)
          {
            i.size += 0.0001
          }
          // if(Math.random() > 0.90)
          //   i.theta += 3*Math.random()
          // if(Math.random() > 0.90)
          //   i.theta += 6*Math.random() - 3


          console.log([i.x, i.y, i.z])
          console.log(i.phi)
          gl.uniform3fv( shaderProgram.lightSpecularColor, lightIntesity( 0.05, 0.0, 0.0, 0.01 ) );
          drawObject( app.models.suzanne, 100, [0.0,0.0,0.0,0.0] );
          mvPopMatrix();
        }
        // console.log(i); // logs 3, 5, 7
      }


      mvPushMatrix();
        mat4.translate( app.mvMatrix, [0,2,0] );
        gl.uniform3fv( shaderProgram.ambientColorUniform, lightIntesity( 2.0, 1,1,1 ) );
        drawObject( app.models.skylight, 0, [0.53,0.81,0.98,1.0] );
        gl.uniform3fv( shaderProgram.ambientColorUniform, lightIntesity( app.ambientIntensity, 0.3,0.3,0.3 ) );
      mvPopMatrix();

    drawObject( app.models.room_tunnel_ceiling, 0 );
    drawObject( app.models.room_tunnel_walls, 0 );
  mvPopMatrix();

  // use the particle shaders
  if( app.animate ){
    app.animations.currentAnimation();
  }
}

app.drawScene = drawMonkeyRoom;
