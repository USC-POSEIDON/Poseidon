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

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-10, 0, 20000000), 
    orientation: {
        heading: Cesium.Math.toRadians(0),   
        pitch: Cesium.Math.toRadians(-90),   
        roll: 0.0
    },
    duration: 2  
});