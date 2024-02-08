const $ = window.$ = window.jQuery =  require('jquery')

const GoldenLayout = require('golden-layout');

let goldenLayout = new GoldenLayout({
    settings: {
        showPopoutIcon: false 
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
                componentName: 'Signal_component',
                title: 'Signal'
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
    container.getElement().html($('#cesiumContainer'));
});

goldenLayout.registerComponent('Control_component', function(container, state) {
  container.getElement().html($('#satelliteControlPanel'));
});

goldenLayout.registerComponent('calendar_component', function(container, state) {
    container.getElement().html($('#calendarModal'));
});

goldenLayout.registerComponent('chat_component', function(container, state) {
    container.getElement().html($('#chatBox'));
});

goldenLayout.registerComponent('PassTime_component', function(container, state) {
    container.getElement().html($('#PassTime'));
});

goldenLayout.registerComponent('Motor_component', function(container, state) {
    container.getElement().html($('#MotorContainer'));
});

goldenLayout.registerComponent('Signal_component', function(container, state) {
  container.getElement().html($('#SignalContainer'));
});

goldenLayout.init();
