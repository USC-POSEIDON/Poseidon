var viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,      
    baseLayerPicker: false, 
    fullscreenButton: false, 
    vrButton: false,        
    geocoder: false,        
    homeButton: false,      
    infoBox: false,         
    sceneModePicker: false, 
    selectionIndicator: false, 
    timeline: false,        
    navigationHelpButton: false, 
    navigationInstructionsInitiallyVisible: false,
    creditContainer: document.createElement('div') 
  });
  viewer.scene.globe.enableLighting = true;
  viewer.clock.shouldAnimate = true;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-10, 0, 30000000), 
    orientation: {
        heading: Cesium.Math.toRadians(0),   
        pitch: Cesium.Math.toRadians(-90),   
        roll: 0.0
    },
    duration: 2  
});

document.getElementById('demensionBtn').addEventListener('click', function() {
  var scene = viewer.scene;
  
  if (scene.mode !== Cesium.SceneMode.SCENE2D) {
      viewer.scene.morphTo2D(0.5); 
      this.textContent = 'Switch to 3D';
  } else {
      viewer.scene.morphTo3D(0.5); 
      this.textContent = 'Switch to 2D';
  }
});
