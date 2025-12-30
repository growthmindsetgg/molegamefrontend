/* ---------- SPRITES ---------- */

function tex(svg) {
  return new THREE.TextureLoader().load(
    "data:image/svg+xml;base64," + btoa(svg)
  );
}

const moleTex = tex(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
<ellipse cx="64" cy="80" rx="36" ry="40" fill="#8b5a2b"/>
<circle cx="52" cy="72" r="4"/>
<circle cx="76" cy="72" r="4"/>
<ellipse cx="64" cy="86" rx="6" ry="4"/>
</svg>`);

const hitTex = tex(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
<ellipse cx="64" cy="80" rx="36" ry="40" fill="#8b5a2b"/>
<line x1="50" y1="70" x2="58" y2="76" stroke="black" stroke-width="3"/>
<line x1="58" y1="70" x2="50" y2="76" stroke="black" stroke-width="3"/>
<line x1="70" y1="70" x2="78" y2="76" stroke="black" stroke-width="3"/>
<line x1="78" y1="70" x2="70" y2="76" stroke="black" stroke-width="3"/>
<circle cx="64" cy="92" r="6"/>
</svg>`);

const hammerTex = tex(`
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
<rect x="30" y="20" width="60" height="30" fill="#e53935"/>
<rect x="58" y="50" width="12" height="60" fill="#ffccbc"/>
</svg>`);

/* ---------- SCENE ---------- */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0,6,8);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff,0.6));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,5);
scene.add(light);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(12,12),
  new THREE.MeshStandardMaterial({color:0x4caf50})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

/* ---------- MOLES ---------- */

const moles = [];
[-3,0,3].forEach(x=>{
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(1,1,0.2,32),
    new THREE.MeshStandardMaterial({color:0x000000})
  );
  hole.position.set(x,0.1,0);
  scene.add(hole);

  const m = new THREE.Sprite(new THREE.SpriteMaterial({map:moleTex}));
  m.scale.set(1.8,1.8,1);
  m.position.set(x,-0.6,0);
  m.userData = { hidden:-0.6, shown:0.5, vy:0 };
  scene.add(m);
  moles.push(m);
});

/* ---------- HAMMER ---------- */

const hammer = new THREE.Sprite(new THREE.SpriteMaterial({map:hammerTex}));
hammer.scale.set(1.4,1.4,1);
hammer.visible = false;
scene.add(hammer);

/* ---------- GAME STATE ---------- */

let active=null, score=0, time=30, running=false;
let moleLoop, timeLoop;

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

/* ---------- GAME FLOW ---------- */

function startGame(){
  document.getElementById("menu").style.display="none";
  score=0; time=30; running=true;
  scoreEl.textContent="score: 0";
  timeEl.textContent="time: 30";

  moleLoop=setInterval(showMole,1000);
  timeLoop=setInterval(()=>{
    time--;
    timeEl.textContent="time: "+time;
    if(time<=0) endGame();
  },1000);
}

function endGame(){
  running=false;
  clearInterval(moleLoop);
  clearInterval(timeLoop);
  hideMoles();
  document.getElementById("finalScore").textContent="score: "+score;
  document.getElementById("end").style.display="flex";
}

function restartGame(){
  document.getElementById("end").style.display="none";
  startGame();
}

function showRules(){
  document.getElementById("rules").style.display="flex";
}
function hideRules(){
  document.getElementById("rules").style.display="none";
}

/* ---------- MOLE MOTION ---------- */

function hideMoles(){
  moles.forEach(m=>{m.userData.vy=-0.02; m.material.map=moleTex;});
  active=null;
}

function showMole(){
  if(!running) return;
  hideMoles();
  active=moles[Math.floor(Math.random()*3)];
  active.userData.vy=0.04;
}

function updateMoles(){
  moles.forEach(m=>{
    if(m.userData.vy!==0){
      m.position.y+=m.userData.vy;
      if(m.position.y>=m.userData.shown||m.position.y<=m.userData.hidden){
        m.position.y=Math.max(Math.min(m.position.y,m.userData.shown),m.userData.hidden);
        m.userData.vy=0;
      }
    }
  });
}

/* ---------- SCREEN → WORLD ---------- */

function screenToWorld(x, y) {
  const v = new THREE.Vector3(
    (x / innerWidth) * 2 - 1,
    -(y / innerHeight) * 2 + 1,
    0.5
  );
  v.unproject(camera);
  const dir = v.sub(camera.position).normalize();
  const dist = -camera.position.y / dir.y;
  return camera.position.clone().add(dir.multiplyScalar(dist));
}

/* ---------- INPUT ---------- */

window.addEventListener("pointerdown",(e)=>{
  if(!running||!active) return;

  const p = screenToWorld(e.clientX, e.clientY);

  hammer.position.set(p.x, 1.2, p.z);
  hammer.rotation.z = -Math.PI/3;
  hammer.visible = true;

  setTimeout(()=>hammer.rotation.z = 0, 40);
  setTimeout(()=>hammer.visible = false, 120);

  score++;
  scoreEl.textContent="score: "+score;
  active.material.map = hitTex;
  active.scale.set(1.6,1.4,1);
  setTimeout(()=>{active.scale.set(1.8,1.8,1); hideMoles();},180);
});

/* ---------- LOOP ---------- */

function animate(){
  requestAnimationFrame(animate);
  updateMoles();
  renderer.render(scene,camera);
}
animate();

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
