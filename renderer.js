const $ = window.$ = window.jQuery =  require('jquery')

const GoldenLayout = require('golden-layout');

let goldenLayout = new GoldenLayout({
    content: [{
        type: 'row',
        content: [{
            type: 'component',
            componentName: 'cesium_component'
        }, {
            type: 'component',
            componentName: 'calendar_component'
        }, {
            type: 'component',
            componentName: 'chat_component'
        }]
    }]
});

goldenLayout.registerComponent('cesium_component', function(container, state) {
    container.getElement().html($('#cesiumContainer'));
});

goldenLayout.registerComponent('calendar_component', function(container, state) {
    container.getElement().html($('#calendarModal'));
    $('#calendarModal').show(); 
});

goldenLayout.registerComponent('chat_component', function(container, state) {
    container.getElement().html($('#chatBox'));
});

goldenLayout.init();
