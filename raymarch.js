var scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(
    -1, // left
     1, // right
     1, // top
    -1, // bottom
    -1, // near,
     1, // far
  );

var renderer = new THREE.WebGLRenderer();

renderer.setClearColor("#000000");

renderer.setSize( window.innerWidth, window.innerHeight);

document.getElementsByClassName("background")[0].appendChild(renderer.domElement);



const uniforms = {
  iTime: { value: 0 },
  iResolution:  { value: new THREE.Vector3() },
  camPos : {value : new THREE.Vector3()},
  mousePos : {value : new THREE.Vector2()},
  camAngleX : {value : 0},
  camAngleY : {value : 0}
};

// SHADER CODE //


const fragmentShader = `

#include <common>
 

// CONSTANTES //

uniform vec3 iResolution;
uniform float iTime;
uniform vec3 camPos;
uniform float camAngleX;
uniform float camAngleY;
uniform vec2 mousePos;

#define EPS 0.01
#define MAX_STEPS 90
#define MAX_DIST 10.0
#define DEFAULT_COL vec3(0, 0.36, 0.54)
#define DEFAULT_COL_2 vec3(0,0.24,0.36)
#define LIGHT_DIR vec3(0.0,1.0,0.0)

#define LIGHT_POS vec3 (10.0, -10.0, 0.0)

//////////////



float sphereSDF(vec3 p, vec3 pos, float r)
{
    return length(p - pos) - r;
}

float planeSDF(vec3 p, float z)
{
  return p.y + z;
}

float boxSDF(vec3 p, vec3 b)
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}


vec4 minC(vec4 a, vec4 b)
{
  if (a.x < b.x)
  {
    return a;
  }
  else
  {
    return b;
  }
}


vec2 smoothMin( float a, float b, float k )
{
    float h = max( k - abs(a-b), 0.0 )/k;
    float m = h * h * 0.5;
    float s = m * k * 0.5;
    return (a<b) ? vec2(a - s,m) : vec2(b - s,1.0 - m);
}

vec4 smoothMinC(vec4 a, vec4 b, float k)
{
    vec2 sMinDist = smoothMin(a.x, b.x, k);
    float colorMixRatio = sMinDist.y;
    vec3 smoothCol =  a.yzw * (1.0 - colorMixRatio) + b.yzw * colorMixRatio;
    return vec4(sMinDist.x, smoothCol);
}

vec3 twist(vec3 p, float k)
{
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
    
}

float sceneSDF(vec3 p)
{
    // vec4 s1 = vec4(sphereSDF(  mod(p,2.0)  , vec3(1.0,1.0,1.0), 0.051 ), vec3(0.9,0.9,0.3));
    // vec4 box1 = vec4(  boxSDF(p, vec3(1.0,1.0,1.0)) , vec3(0.8,0.3,0.8)  );
    // vec4 floor = vec4(planeSDF(p, 1.0) , vec3(1.0,0.5, 0.5));
    // return  smoothMinC( smoothMinC(s1,floor, abs(cos(iTime)*3.0)) , box1, cos(iTime)*2.0);

    // vec4 box = vec4(  boxSDF(p, vec3(1.0,1.0,1.0)) , vec3(.05,.05,.05)  );

    // vec4 orb1 = vec4(sphereSDF( p , vec3(cos(iTime*2.0),sin(iTime*1.3),cos(iTime*0.5))*2.0, 0.1 + cos(iTime)*cos(iTime) * 0.2), vec3(0.1,0.1,0.1));

    // return smoothMinC(orb1, box, 2.0);


    float displacement = sin(3.0 * p.x) * sin(3.0 * p.y) * sin(3.0 * p.z) * 0.25;

    float sphereRadiusBase = 0.2;
    float sphereRadiusVar = 0.1;

    float maxRadiusPosBase = 0.6;
    float maxRadiusPosVar = 0.3; 

    // float mainScene = sphereSDF( p , vec3(mousePos.x * 6.0 - 1.0, mousePos.y * 3.0, 0.0) * maxRadiusPosBase, sphereRadiusBase);
    
    float mainScene = sphereSDF( p , vec3(cos(iTime), cos(iTime), cos(iTime)) * maxRadiusPosBase, sphereRadiusBase);

    float bFact = 0.8;

    const int n = 5;

    for (int i = 1; i < n; i++)
    {
        // float d = 2.0;
        float d = sphereSDF( p , vec3(cos(iTime * sin(float(i)) + float(i) ), cos(iTime * sin(cos(float(i))) * 1.5  + cos(float(i)) ), cos(iTime + float(i) + cos(float(i)) )) * (maxRadiusPosBase + cos(float(i)) * maxRadiusPosVar), sphereRadiusBase + sphereRadiusVar * cos(float(i)));
        mainScene = smoothMin(mainScene, d, bFact).x;
    }

    // float orb1 = 
    // float orb2 = sphereSDF( p , vec3(cos(iTime + 10.0), cos(iTime + 1.0), cos(iTime + 3.0)) * 0.6, 0.3);
    // float orb3 = sphereSDF( p , vec3(cos(iTime * 0.5 + 8.0), cos(iTime + 4.0), cos(iTime * 1.3 + 1.0)) * 0.5, 0.3);
    // // float orb4 = sphereSDF( p , vec3(cos(iTime + 1.0), cos(iTime * 2.0 + 0.0), cos(iTime * 0.1 + 3.5)) * 0.4, 0.3);
    // float orb4 = sphereSDF(p, vec3(mousePos.x * 4.0, mousePos.y * 2.0, 0.0), 0.2);
    // float orb5 = sphereSDF( p , vec3(cos(iTime + 10.0), cos(iTime + 1.0), cos(iTime + 3.0)) * 0.1, 0.3);


    // float mainScene = smoothMin(smoothMin(smoothMin(orb1, orb2, bFact).x,orb3,bFact).x, orb4, bFact).x;


    // return smoothMin(orb1, orb2, .1) + displacement;
    return mainScene + displacement;
    // return orb4;
}


vec3 calculateNormal(vec3 p)
{
    vec2 e = vec2(EPS,-EPS);
    return normalize(
              e.xxx * sceneSDF(p+e.xxx)
            + e.xyy * sceneSDF(p + e.xyy)
            + e.yxy * sceneSDF(p + e.yxy)
            + e.yyx * sceneSDF(p + e.yyx)
    );
}



vec3 march(vec3 eye, vec3 marchDir, vec2 fragCoord)
{
    float lerpF = fragCoord.y / 360.0;

    float closest = float(MAX_DIST);

    float depth = 0.;
    for (int i = 0; i < MAX_STEPS; i++)
    {
        float res = sceneSDF(eye + depth * marchDir);

        if(res < closest)
        {
            closest = res;
        }

        if (res < EPS)
        {
          vec3 r = eye + depth * marchDir;
          vec3 n = calculateNormal(r);

          vec3 dirToLight = normalize(r - LIGHT_POS);
          vec3 dirToEye = normalize(r - eye);
          vec3 lightReflection = reflect(dirToLight ,n);

          float diffuse_intensity = 0.6*pow(max(0.0, dot(n, dirToLight)),5.0);            
          float ambient_intensity = 0.2;            
          float specular_intensity = 1.15* pow(clamp(dot(dirToEye, lightReflection), 0.0,1.0), 50.0);
          float backlight_specular_intensity = 0.2* pow(clamp(dot(dirToLight, lightReflection),0.0,1.0), 3.0); 
          float fresnel_base = 1.0 + dot(dirToEye, n);
          float fresnel_intensity = 0.10*pow(fresnel_base, 0.3);
          float fresnel_shadowing = pow(fresnel_base, 5.0);            
          float fresnel_supershadowing = pow(fresnel_base, 50.0);
          float attenuation =  pow(depth,2.0)/180.0;

                
          vec3 colFromLight = vec3(0.0, 0.0, 0.0);
          colFromLight += vec3(0.1, 0.1, 0.1) * diffuse_intensity;
          colFromLight += vec3(0.1, 0.1, 0.1) * ambient_intensity;
          colFromLight += vec3(1.0) * specular_intensity;            
          colFromLight += vec3(0.5,0.5,0.5) * backlight_specular_intensity;            
          colFromLight += vec3(0.1, 0.1, 0.1) * fresnel_intensity;
          colFromLight -= vec3(1.0, 1.0, 1.0) * fresnel_shadowing ;
          colFromLight += vec3(.2, 0.2, 0.3) - attenuation ; 
          colFromLight /= 1.2;

          // c *= 0.5 + dot(n , LIGHT_DIR) * 0.5;
          return colFromLight;
        }
        depth += res;
        if (depth >= MAX_DIST)
        {
            return (DEFAULT_COL * lerpF + DEFAULT_COL_2 * (1.0-lerpF) ) * clamp(pow(closest,0.3), 0.0, 1.0);
        }
    }

    return DEFAULT_COL * lerpF + DEFAULT_COL_2 * (1.0-lerpF) * 0.0;
}



vec3 rayDir(float fov, vec2 size, vec2 fragCoord)
{
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fov) / 2.0);
    return normalize(vec3(xy, -z));
}

mat3 rotateX(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}


mat3 rotateY(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}


mat3 rotateZ(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec3 dir = rayDir(45.0, iResolution.xy, fragCoord);
    // dir *= rotateX(camAngleX);
    // dir *= rotateY(camAngleY);
    vec3 col = march(camPos, dir, fragCoord);
    fragColor = vec4(col, 1.0);

}
 
void main()
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}



`;



const material = new THREE.ShaderMaterial({
  fragmentShader,
  uniforms,
});

const plane = new THREE.PlaneBufferGeometry(2, 2);

var xMove = 0.0;
var yMove = 0.0;
var zMove = 0.0;

var xCam = -0.7;
var yCam = 0.0;
var zCam = 5.0;

// document.addEventListener("keydown", onDocumentKeyDown, false);

// function onDocumentKeyDown(event) {
//     var keyCode = event.which;
//     if (keyCode == 90)
//     {
//         zMove -= 0.2;
//     }
//     else if (keyCode == 83)
//     {
//         zMove += 0.2;
//     }
//     else if (keyCode == 81)
//     {
//         xMove -= 0.1;
//         // alert(uniforms.camAngle.value)
//     }
//     else if (keyCode == 68)
//     {
//         xMove += 0.1;
//     }
//     else if (keyCode == 32)
//     {
//         yMove += 0.1;
//     }
//     else if (keyCode == 9)
//     {
//         yMove -= 0.1;
//     } 
// };

scene.add(new THREE.Mesh(plane, material));

var mouseX = 0.0;
var mouseY = 0.0;

document.onmousemove = function(e){
    mouseX = e.pageX;
    mouseY = e.pageY;
}



function render(time) {

   time *= 0.001;
  
  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = time;

  uniforms.mousePos.value.set(  (mouseX - canvas.width/2.0) / canvas.width , -(mouseY - canvas.height/2.0) / canvas.height  );

  // var angleY = -((mouseX - canvas.width/2.0) / canvas.width) * Math.PI * 1.1;
  // var angleX = -((mouseY - canvas.height/2.0) / canvas.height)* Math.PI * 1.1;

  // var posX = ;
  // var posY = ;
  

  // xCam += xMove*Math.cos(angleX) + yMove*Math.sin(angleY);
  // yCam += xMove*Math.sin(angleX) + yMove*Math.cos(angleY);
  // xCam += xMove
  // yCam += yMove
  // zCam += zMove;
  xMove = 0.0;
  yMove = 0.0;
  zMove = 0.0;
  uniforms.camPos.value.set(xCam, yCam, zCam);
      // uniforms.camAngleY.value = angleY;
      // uniforms.camAngleX.value = angleX;



  // Render the scene
  renderer.render(scene, camera);

  requestAnimationFrame( render );
};

render();
