# Tile Render

RFC: Tile renderer for [pex](http://vorg.github.io/pex/)

Will render your current sene at N x N windows size resolution, save it into tiles and stitch them together. I sucessfuly rendered 40K images with it.

This will become pex-tilerender at some point.

![](assets/tile-render.gif)

# Usage

Currently you need to create folder to save tiles yourself. In this example it's `./tiles`;

Run the code in Plask and pres `space` to see rendering preview. Disable the prevew checkbox and press `space` again for actual rendering.


# Code

```javascript
var tileRender = new TileRender({
  viewport: [0, 0, this.width, this.height],
  n: 4, //image will be 4x bigger
  camera: this.camera, //perspective camera
  path: 'tiles', //folder to save tiles to
});
 
while (tileRender.nextTile()) {
  var tileCamera = tileRender.getCamera();
  var tileViewport = tileRender.getViewport();
  this.gl.viewport(tileViewport[0], tileViewport[1], tileViewport[2], tileViewport[3]);
  this.drawScene(tileCamera);
  tileRender.capture(); //saves image 01.png, 02.png... to 'path'
}
```

# Dependencies

It requires [graphicsmagics](http://graphicsmagick.org) installed.

# ToDo

- OrthographicCamera support
- make sure we don't miss any pixels due to rounding errors, i get black line in the middle of the sketch preview sometimes