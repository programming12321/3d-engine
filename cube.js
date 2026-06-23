class CubeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;

    this.cubes = [];

    this.rotX = 0;
    this.rotY = 0;

    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;

    this.cam = { x: 0, y: 0, z: -5 };
    this.yaw = 0;
    this.pitch = 0;

    this.keys = {};

    this.initMouse();
    this.initFPS();
  }

  initMouse() {
    this.canvas.onmousedown = (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };

    this.canvas.onmouseup = () => this.dragging = false;

    this.canvas.onmousemove = (e) => {
      if (!this.dragging) return;

      this.rotY += (e.clientX - this.lastX) * 0.01;
      this.rotX += (e.clientY - this.lastY) * 0.01;

      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };
  }

  initFPS() {
    window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);

    this.canvas.addEventListener("click", () => {
        this.canvas.requestPointerLock();
    });

    document.addEventListener("mousemove", (e) => {
        if (document.pointerLockElement !== this.canvas) return;

        this.yaw   += e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;

        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    });
  }

  addCube(x, y, z, size, color = "cyan") {
    this.cubes.push({
      x,
      y,
      z,
      size,
      color
    });
  }

  rotate([x, y, z]) {
    let y1 = y * Math.cos(this.rotX) - z * Math.sin(this.rotX);
    let z1 = y * Math.sin(this.rotX) + z * Math.cos(this.rotX);

    let x2 = x * Math.cos(this.rotY) + z1 * Math.sin(this.rotY);
    let z2 = -x * Math.sin(this.rotY) + z1 * Math.cos(this.rotY);

    return [x2, y1, z2];
  }

  project([x, y, z]) {
    const f = 1000;
    const scale = f / (z + 8);

    return [
      x * scale + this.canvas.width / 2,
      y * scale + this.canvas.height / 2,
      z
    ];
  }

  getCubePoints(cube) {
    const bas = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
    ];

    return bas.map(p => {
      let [x,y,z] = p;

      x *= cube.size;
      y *= cube.size;
      z *= cube.size;

      x += cube.x;
      y += cube.y;
      z += cube.z;

      return [x,y,z];
    });
  }

  drawCubeFaces(pts, cube) {

    const faces = [
        [0,1,2,3],
        [4,5,6,7],
        [0,1,5,4],
        [2,3,7,6],
        [1,2,6,5],
        [0,3,7,4]
    ];

    const light = this.normalize([0.5, 0.8, -1]);

    let faceList = [];

    for (let f of faces) {

        let p0 = pts[f[0]];
        let p1 = pts[f[1]];
        let p2 = pts[f[2]];

        let u = [
            p1[0]-p0[0],
            p1[1]-p0[1],
            p1[2]-p0[2]
        ];

        let v = [
            p2[0]-p0[0],
            p2[1]-p0[1],
            p2[2]-p0[2]
        ];

        let n = this.normalize(this.cross(u, v));

        let brightness = this.dot(n, light);
        if (!isFinite(brightness)) brightness = 0;
        if (brightness < 0) brightness = 0;

        let avgZ = 0;
        for (let i of f) avgZ += pts[i][2];
        avgZ /= 4;

        faceList.push({ f, avgZ, brightness });
    }

    faceList.sort((a,b)=>b.avgZ - a.avgZ);

    const colors = {
        red: [255,0,0],
        green: [0,255,0],
        blue: [0,0,255],
        yellow: [255,255,0],
        orange: [255,128,0],
        purple: [180,0,255],
        white: [255,255,255],
        cyan: [0,255,255]
    };

    const base = colors[cube.color] || [0,255,255];

    for (let item of faceList) {

        const f = item.f;

        let shade = 80 + item.brightness * 175;

        this.ctx.beginPath(); // 🔥 CLAVE

        this.ctx.moveTo(pts[f[0]][0], pts[f[0]][1]);

        for (let i = 1; i < f.length; i++) {
            this.ctx.lineTo(pts[f[i]][0], pts[f[i]][1]);
        }

        this.ctx.closePath();

        const factor = Math.min(1, Math.max(0, shade / 255));

        const r = Math.floor(base[0] * factor);
        const g = Math.floor(base[1] * factor);
        const b = Math.floor(base[2] * factor);

        this.ctx.fillStyle = `rgb(${r},${g},${b})`;
        this.ctx.fill();

        this.ctx.strokeStyle = "rgba(0,255,255,0.4)";
        this.ctx.stroke();
    }
}

  updateCamera() {
    let speed = 0.1;

    let forward = [
        Math.sin(this.yaw),
        0,
        Math.cos(this.yaw)
    ];

    let right = [
        Math.cos(this.yaw),
        0,
        -Math.sin(this.yaw)
    ];

    if (this.keys["w"]) {
        this.cam.x += forward[0] * speed;
        this.cam.z += forward[2] * speed;
    }
    if (this.keys["s"]) {
        this.cam.x -= forward[0] * speed;
        this.cam.z -= forward[2] * speed;
    }
    if (this.keys["a"]) {
        this.cam.x -= right[0] * speed;
        this.cam.z -= right[2] * speed;
    }
    if (this.keys["d"]) {
        this.cam.x += right[0] * speed;
        this.cam.z += right[2] * speed;
    }
  }

  project([x,y,z]) {

    x -= this.cam.x;
    y -= this.cam.y;
    z -= this.cam.z;

    let cx = Math.cos(this.yaw);
    let sx = Math.sin(this.yaw);

    let cz = Math.cos(this.pitch);
    let sz = Math.sin(this.pitch);

    let x1 = x * cx + z * sx;
    let z1 = -x * sx + z * cx;

    let y2 = y * cz - z1 * sz;
    let z2 = y * sz + z1 * cz;

    const f = 250;
    const zSafe = Math.max(0.1, z2 + 8);
    const scale = f / zSafe;

    return [
        x1 * scale + this.canvas.width / 2,
        y2 * scale + this.canvas.height / 2,
        z2
    ];
  }
  dot(a,b){
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  }

  cross(a,b){
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
  }

  normalize(v){
    let len = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return len === 0 ? [0,0,0] : [v[0]/len, v[1]/len, v[2]/len];
  }

  render() {
    this.updateCamera();

    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    for (let cube of this.cubes) {

        let pts3D = this.getCubePoints(cube);

        let pts2D = pts3D.map(p => this.project(p));

        this.drawCubeFaces(pts2D, cube);
    }

    requestAnimationFrame(() => this.render());
  }
}
