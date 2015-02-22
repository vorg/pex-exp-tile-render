var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var Vec3 = require('pex-geom').Vec3;
var Quat = require('pex-geom').Quat;
var Mat4 = require('pex-geom').Mat4;
var GUI  = require('pex-gui').GUI;

var random = require('pex-random');
var R = require('ramda');
var TileRender = require('./TileRender');

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

sys.Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false
  },
  tiled: true,
  needsRender: false,
  frame: 0,
  init: function() {
    this.initGUI();
    this.initScene();
  },

  initGUI: function() {
    this.gui = new GUI(this);
    this.gui.addParam('Tiled', this, 'tiled');

    this.on('keyDown', function(e) {
      if (e.str == ' ') {
        this.frame = 0;
        this.needsRender = true;
      }
    }.bind(this));
  },
  initScene: function() {
    this.camera = new PerspectiveCamera(60, this.width / this.height, 0.1, 10);
    this.arcball = new Arcball(this, this.camera, 3);
    var cube = new Cube(1);

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
  drawScene: function(camera) {
    this.scene.forEach(function(mesh) {
      mesh.draw(camera);
    }.bind(this));
  },
  draw: function() {
    glu.clearColorAndDepth(Color.Black);
    glu.enableDepthReadAndWrite(true);

    if (this.needsRender) {
      this.needsRender = false;
      var tileRender = new TileRender({
        viewport: [0, 0, this.width, this.height],
        n: 2,
        camera: this.camera,
        path: 'tiles'
      });
      var i = 0;
      while(tileRender.nextTile()) {
        glu.clearColorAndDepth(Color.Black);
        glu.enableDepthReadAndWrite(true);
        var tileCamera = tileRender.getCamera();
        var tileViewport = tileRender.getViewport();
        this.gl.viewport(tileViewport[0], tileViewport[1], tileViewport[2], tileViewport[3]);
        this.drawScene(tileCamera);
        tileRender.capture();
      }
      this.gl.viewport(0, 0, this.width, this.height);
    }
    else {
      this.drawScene(this.camera);
    }
    this.gui.draw();
  }
});
