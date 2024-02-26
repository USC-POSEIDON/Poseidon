const $ = window.$ = window.jQuery =  require('jquery')

const GoldenLayout = require('golden-layout');
let closedComponents = [];

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
                id: 'cesium_component',
                width: 70,
                componentName: 'cesium_component',
                title: 'Cesium'
              },
              {
                type: 'stack',
                content: [{
                    type: 'component',
                    id: 'chat_component',
                    componentName: 'chat_component',
                    title: 'Chat'
                  },
                  {
                    type: 'component',
                    id: 'calendar_component',
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
                id: 'PassTime_component',
                componentName: 'PassTime_component',
                title: 'PassTime'
              },
              {
                type: 'component',
                id: 'Motor_component',
                componentName: 'Motor_component',
                title: 'Motor'
              },
              {
                type: 'component',
                id: 'Telemetry_component',
                componentName: 'Telemetry_component',
                title: 'TelemetryData' 
              },
              {
                type: 'component',
                id: 'Control_component',
                componentName: 'Control_component',
                title: 'Control'
              }]
          }]
    }]
});


goldenLayout.registerComponent('cesium_component', function(container, state) {
  // Assuming $('#cesiumContainer') is the content for this component
  const cesiumContainer = $('#cesiumContainer').detach(); // Detach but keep reference
  container.getElement().append(cesiumContainer);
  container.on('destroy', function() {
      cesiumContainer.detach(); // Detach on destroy
      trackComponentState('cesium_component', false);
      updateWindowsDropdown();
  });
});

goldenLayout.registerComponent('Control_component', function(container, state) {
  container.getElement().append($('#satelliteControlPanel'));
  container.on('destroy', function() {
    trackComponentState('Control_component', false);
    updateWindowsDropdown();
  });
});

goldenLayout.registerComponent('calendar_component', function(container, state) {
    container.getElement().append($('#calendarModal'));
    container.on('destroy', function() {
      trackComponentState('calendar_component', false);
      updateWindowsDropdown();
    });
});

goldenLayout.registerComponent('chat_component', function(container, state) {
    container.getElement().append($('#chatBox'));
    container.on('destroy', function() {
      trackComponentState('chat_component', false);
      updateWindowsDropdown();
    });
});

goldenLayout.registerComponent('PassTime_component', function(container, state) {
    container.getElement().append($('#PassTime'));
    container.on('destroy', function() {
      trackComponentState('PassTime_component', false);
      updateWindowsDropdown();
    });
});

goldenLayout.registerComponent('Motor_component', function(container, state) {
    container.getElement().append($('#MotorContainer'));
    container.on('destroy', function() {
      trackComponentState('Motor_component', false);
      updateWindowsDropdown();
    });
});

goldenLayout.registerComponent('Telemetry_component', function(container, state) {
  container.getElement().append($('#TelemetryContainer'));
  container.on('destroy', function() {
    trackComponentState('Telemetry_component', false);
    updateWindowsDropdown();
  });
});

let componentStates = {};

function trackComponentState(id, isOpen = true) {
  componentStates[id] = isOpen;
  updateWindowsDropdown(); // Ensure dropdown updates immediately after state changes
}

function updateWindowsDropdown() {
    const dropdownContent = $('#windowsDropdownContent');
    dropdownContent.empty();

    const allComponents = [
        { id: 'cesium_component', title: 'Cesium' },
        { id: 'chat_component', title: 'Chat' },
        { id: 'calendar_component', title: 'Calendar' },
        { id: 'PassTime_component', title: 'PassTime' },
        { id: 'Motor_component', title: 'Motor' },
        { id: 'Telemetry_component', title: 'TelemetryData' },
        { id: 'Control_component', title: 'Control' },
    ];

    allComponents.forEach(component => {
        const exists = componentStates[component.id];
        let menuItem = $(`
          <div class="menu-item">
            <span class="menu-title">${component.title}</span>
            <span class="menu-action">${exists ? '&#10003;' : ''}</span>
          </div>
        `);

        menuItem.on('click', () => {
            const shouldShow = !exists;
            toggleComponentVisibility(component.id, component.title, shouldShow);
        });

        dropdownContent.append(menuItem);
    });
}
function toggleComponentVisibility(id, title, shouldShow) {
  const items = goldenLayout.root.getItemsById(id);
  console.log(goldenLayout.root.getItemsById(id));
  if (shouldShow && items.length === 0) {
      addComponentToLayout(id);
  } else if (!shouldShow && items.length > 0) {
      removeComponentFromLayout(id);
  }
}


function addComponentToLayout(id) {
  const componentConfig = getComponentConfig(id);
  console.log(componentConfig);

  if (componentConfig) {
      let targetContainer = goldenLayout.root.contentItems[0];
    
      if (targetContainer.type !== 'stack') {
          const existingStack = targetContainer.contentItems.find(item => item.type === 'stack');
          if (existingStack) {
              targetContainer = existingStack;
          } else {
              const stackConfig = {
                  type: 'stack',
                  content: []
              };
              targetContainer.addChild(stackConfig);
              targetContainer = targetContainer.contentItems[targetContainer.contentItems.length - 1];
          }
      }
    
      targetContainer.addChild(componentConfig);
      
      trackComponentState(id, true);
  } else {
      console.error(`Component config not found for id: ${id}`);
  }
}

function getComponentConfig(id) {
  const configMap = {
      'cesium_component': {
        type: 'component',
        id: 'cesium_component',
        width: 70,
        componentName: 'cesium_component',
        title: 'Cesium'
      },
      'chat_component': {
          type: 'component',
          componentName: 'chat_component',
          title: 'Chat',
          id: 'chat_component',
          componentState: {} 
      },
      'calendar_component': {
          type: 'component',
          componentName: 'calendar_component',
          title: 'Calendar',
          id: 'calendar_component',
          componentState: {} 
      },
      'PassTime_component': {
          type: 'component',
          componentName: 'PassTime_component',
          title: 'PassTime',
          id: 'PassTime_component',
          componentState: {} 
      },
      'Motor_component': {
          type: 'component',
          componentName: 'Motor_component',
          title: 'Motor',
          id: 'Motor_component',
          componentState: {} 
      },
      'Telemetry_component': {
          type: 'component',
          componentName: 'Telemetry_component',
          title: 'TelemetryData',
          id: 'Telemetry_component',
          componentState: {} 
      },
      'Control_component': {
          type: 'component',
          componentName: 'Control_component',
          title: 'Control',
          id: 'Control_component',
          componentState: {} 
      }
  };

  return configMap[id] || null;
}


function removeComponentFromLayout(componentId) {
  const items = goldenLayout.root.getItemsById(componentId);
  if (items.length) {
      items.forEach(item => item.remove());
  } else {
      console.log(`Component with ID ${componentId} not found.`);
  }
  trackComponentState(componentId, false);
  updateWindowsDropdown();
}


goldenLayout.on('itemDestroyed', function(component) {
  const componentId = component.config.id;
  if (componentId) {
      trackComponentState(componentId, false);
  }
});

goldenLayout.on('initialised', function() {
    ['cesium_component', 'chat_component', 'calendar_component', 'PassTime_component', 'Motor_component', 'Telemetry_component', 'Control_component'].forEach(id => {
        trackComponentState(id, true);
    });
    updateWindowsDropdown();
});

goldenLayout.init();
