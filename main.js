var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var Vec3 = require('pex-geom').Vec3;
var Quat = require('pex-geom').Quat;
var Mat4 = require('pex-geom').Mat4;
var GUI  = require('pex-gui').GUI;
var gm = require('gm');

var random = require('pex-random');
var R = require('ramda');

var Cube = gen.Cube;
var Mesh = glu.Mesh;
var Diffuse = materials.Diffuse;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;
var Time = sys.Time;
var floor = Math.floor;
var tan = Math.tan;
var PI = Math.PI;

// this frustum(l, r, b, t, n, f)
//
// Multiply by a frustum matrix computed from left, right, bottom, top,
// near, and far.
Mat4.prototype.frustum = function(l, r, b, t, n, f) {
  this.mul4x4r(
      (n+n)/(r-l),           0, (r+l)/(r-l),             0,
                0, (n+n)/(t-b), (t+b)/(t-b),             0,
                0,           0, (f+n)/(n-f), (2*f*n)/(n-f),
                0,           0,          -1,             0);

  return this;
};

sys.Window.create({
  settings: {
    width: 256,
    height: 256,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false
  },
  tiled: true,
  needsRender: false,
  frame: 0,
  init: function() {
    this.gui = new GUI(this);
    this.gui.addParam('Tiled', this, 'tiled');


    this.on('keyDown', function(e) {
      if (e.str == ' ') {
        this.frame = 0;
        this.needsRender = true;
      }
    }.bind(this));

    var cube = new Cube(1);

    this.camera = new PerspectiveCamera(60, this.width / this.height, 0.1, 10);
    this.tiledCamera = new PerspectiveCamera(60, this.width / this.height, 0.1, 10);

    var mesh1 = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.Red }));
    var mesh2 = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.Green }));
    var mesh3 = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.Blue }));
    var mesh4 = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.Orange }));
    var mesh5 = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.White }));

    mesh1.position = new Vec3(-1.5, 1.5, 0.0);
    mesh2.position = new Vec3( 1.5, 1.5, 0.0);
    mesh3.position = new Vec3( 0.0, 0.0, 0.0);
    mesh4.position = new Vec3( 1.5,-1.5, 0.0);
    mesh5.position = new Vec3(-1.5,-1.5, 0.0);

    var fov = this.camera.getFov();
    var near = this.camera.getNear();
    var aspect = this.camera.getAspectRatio();

    this.scene = [ mesh1, mesh2, mesh3, mesh4, mesh5 ];

    random.seed(0);

    R.range(0, 100).map(function() {
      var m = new Mesh(cube, new Diffuse({ wrap: 1, diffuseColor: Color.Grey }));
      m.position.x = random.float(-8, 8);
      m.position.y = random.float(-5, 5);
      m.position.z = random.float(-1, -4);
      m.rotation.setDirection(random.vec3());
      this.scene.push(m);
    }.bind(this))
  },
  //Based on
  //http://stackoverflow.com/a/6491939/287842
  renderTile: function(i, n) {
    var w = this.width;
    var h = this.height;
    var tw = w / n;
    var th = h / n;
    var ix = i % n;
    var iy = floor(i / n);
    var x = ix * tw;
    var y = iy * th;

    var gl = this.gl;

    if (!this.needsRender) {
      gl.viewport(x, y, tw, th);
    }

    var near = this.tiledCamera.getNear();
    var far = this.tiledCamera.getFar();
    var fovy = this.tiledCamera.getFov() / 180 * PI;
    var aspect = this.tiledCamera.getAspectRatio();
    var top = tan(fovy / 2) * near;
    var bottom = -top;
    var left = -top * aspect;
    var right = -left;
    var shift_X = (right - left)/n;
    var shift_Y = (top - bottom)/n;

    this.tiledCamera.projectionMatrix.identity();
    this.tiledCamera.projectionMatrix.frustum(
      left + shift_X * ix,
      left + shift_X * (ix+1),
      bottom + shift_Y * iy,
      bottom + shift_Y * (iy+1),
      near, far
    );

    this.renderScene(this.tiledCamera);

    gl.viewport(0, 0, w, h);
  },
  renderScene: function(camera) {
    this.scene.forEach(function(mesh) {
      mesh.draw(camera);
    }.bind(this));
  },
  draw: function() {
    var n = 2;
    var numTiles = n * n;
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    if (this.tiled) {
      var numTiles = n * n;
      var tile = this.frame % numTiles;
      for(var i=0; i<=tile; i++) {
        if (this.needsRender) {
          glu.clearColorAndDepth(Color.Black);
          glu.enableDepthReadAndWrite(true);
        }
        this.renderTile(i, n);
        if (this.needsRender) {
          this.gl.writeImage('png', 'tiles/' + i + '.png');
        }
      }
      if (tile == numTiles - 1 && this.needsRender) {
        this.needsRender = false;

        gm()
          .in('-page', '+0+0')  // Custom place for each of the images
          .in('tiles/0.png')
          .in('-page', '+256+0')
          .in('tiles/1.png')
          .in('-page', '+0+256')
          .in('tiles/2.png')
          .in('-page', '+256+256')
          .in('tiles/3.png')
          .minify()  // Halves the size, 512x512 -> 256x256
          .mosaic()  // Merges the images as a matrix
          .write('tiles/output.jpg', function (err) {
              if (err) console.log(err);
          });
      }
    }
    else {
      this.renderScene(this.camera);
    }

    this.gui.draw();
    this.frame++;
  }
});
