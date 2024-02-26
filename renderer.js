const $ = window.$ = window.jQuery =  require('jquery')

const GoldenLayout = require('golden-layout');

let goldenLayout = new GoldenLayout({
    settings: {
        //showPopoutIcon: false 
    },
    content: [{
        type: 'column',
        content: [{
            type: 'row',
            content: [{
                type: 'component',
                width: 70,
                componentName: 'cesium_component',
                title: 'Cesium'
              },
              {
                type: 'stack',
                content: [{
                    type: 'component',
                    componentName: 'chat_component',
                    title: 'Chat'
                  },
                  {
                    type: 'component',
                    componentName: 'calendar_component',
                    title: 'Calendar'
                  }]
            }]
          },
          {
            type: 'row',
            height: 30,
            content: [
              {
                type: 'component',
                componentName: 'PassTime_component',
                title: 'PassTime'
              },
              {
                type: 'component',
                componentName: 'Motor_component',
                title: 'Motor'
              },
              {
                type: 'component',
                componentName: 'Telemetry_component',
                title: 'TelemetryData' 
              },
              {
                type: 'component',
                componentName: 'Control_component',
                title: 'Control'
              }]
          }]
    }]
});

goldenLayout.registerComponent('cesium_component', function(container, state) {
    container.getElement().append($('#cesiumContainer'));
});

goldenLayout.registerComponent('Control_component', function(container, state) {
  container.getElement().append($('#satelliteControlPanel'));
});

goldenLayout.registerComponent('calendar_component', function(container, state) {
    container.getElement().append($('#calendarModal'));
});

goldenLayout.registerComponent('chat_component', function(container, state) {
    container.getElement().append($('#chatBox'));
});

goldenLayout.registerComponent('PassTime_component', function(container, state) {
    container.getElement().append($('#PassTime'));
});

goldenLayout.registerComponent('Motor_component', function(container, state) {
    container.getElement().append($('#MotorContainer'));
});

goldenLayout.registerComponent('Telemetry_component', function(container, state) {
  container.getElement().append($('#TelemetryContainer'));
});

goldenLayout.init();


