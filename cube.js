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

    this.initMouse();
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

  addCube(x, y, z, size) {
    this.cubes.push({ x, y, z, size });
  }

  rotate([x, y, z]) {
    let y1 = y * Math.cos(this.rotX) - z * Math.sin(this.rotX);
    let z1 = y * Math.sin(this.rotX) + z * Math.cos(this.rotX);

    let x2 = x * Math.cos(this.rotY) + z1 * Math.sin(this.rotY);
    let z2 = -x * Math.sin(this.rotY) + z1 * Math.cos(this.rotY);

    return [x2, y1, z2];
  }

  project([x, y, z]) {
    const f = 250;
    const scale = f / (z + 8);

    return [
      x * scale + this.canvas.width / 2,
      y * scale + this.canvas.height / 2,
      z
    ];
  }

  getCubePoints(cube) {
    const base = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
    ];

    return base.map(p => {
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

  drawCubeFaces(pts) {
    const faces = [
      [0,1,2,3],
      [4,5,6,7],
      [0,1,5,4],
      [2,3,7,6],
      [1,2,6,5],
      [0,3,7,4]
    ];

    let faceList = [];

    for (let f of faces) {
      let avgZ = 0;
      for (let i of f) avgZ += pts[i][2];
      avgZ /= 4;

      faceList.push({ f, avgZ });
    }

    faceList.sort((a,b) => b.avgZ - a.avgZ);

    for (let item of faceList) {
      const f = item.f;

      this.ctx.beginPath();
      this.ctx.moveTo(pts[f[0]][0], pts[f[0]][1]);

      for (let i=1;i<f.length;i++) {
        this.ctx.lineTo(pts[f[i]][0], pts[f[i]][1]);
      }

      this.ctx.closePath();

      this.ctx.fillStyle = "rgba(0,200,255,0.4)";
      this.ctx.fill();

      this.ctx.strokeStyle = "cyan";
      this.ctx.stroke();
    }
  }

  render() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    for (let cube of this.cubes) {
      let pts = this.getCubePoints(cube)
        .map(p => this.rotate(p))
        .map(p => this.project(p));

      this.drawCubeFaces(pts);
    }

    requestAnimationFrame(() => this.render());
  }
}
