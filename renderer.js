const $ = window.$ = window.jQuery =  require('jquery')

const GoldenLayout = require('golden-layout');
let closedComponents = [];

let goldenLayout = new GoldenLayout({
    settings: {
        showPopoutIcon: false,
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
                content: [
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
                id: 'Command_Generation_component',
                componentName: 'Command_Generation_component',
                title: 'CommandGeneration' 
              },
              {
                type: 'component',
                id: 'Telemetry_component',
                componentName: 'Telemetry_component',
                title: 'TelemetryData' 
              }]
          }]
    }]
});

goldenLayout.registerComponent('cesium_component', function(container, state) {
  // Check if the cesiumContainer is already detached and stored
  let cesiumContainer = $('#cesiumContainer');
  if (cesiumContainer.length === 0) { // If not found in DOM, it might have been detached previously
    cesiumContainer = closedComponents['cesium_component']; // Retrieve from stored detached elements
  }

  container.getElement().append(cesiumContainer); // Reattach

  container.on('destroy', function() {
    closedComponents['cesium_component'] = cesiumContainer.detach(); // Detach and store
    trackComponentState('cesium_component', false);
    updateWindowsDropdown();
  });
});


goldenLayout.registerComponent('calendar_component', function(container, state) {
  let calendarModal = $('#calendarModal');
  if (calendarModal.length === 0) {
    calendarModal = closedComponents['calendar_component'];
  }

  container.getElement().append(calendarModal);

  container.on('destroy', function() {
    closedComponents['calendar_component'] = calendarModal.detach();
    trackComponentState('calendar_component', false);
    updateWindowsDropdown();
  });
});


goldenLayout.registerComponent('PassTime_component', function(container, state) {
  let passTime = $('#PassTime');
  if (passTime.length === 0) {
    passTime = closedComponents['PassTime_component'];
  }

  container.getElement().append(passTime);

  container.on('destroy', function() {
    closedComponents['PassTime_component'] = passTime.detach();
    trackComponentState('PassTime_component', false);
    updateWindowsDropdown();
  });
});

goldenLayout.registerComponent('Command_Generation_component', function (container, state) {
  let commandGenerationWindow = $('#commandGeneration');
  if (commandGenerationWindow.length === 0) {
      commandGenerationWindow = closedComponents['Command_Generation_component'];

  }

  container.getElement().append(commandGenerationWindow);

  container.on('destroy', function () {
      closedComponents['Command_Generation_component'] = commandGenerationWindow.detach();
      trackComponentState('Command_Generation_component', false);
      updateWindowsDropdown();
  });
});

goldenLayout.registerComponent('Telemetry_component', function(container, state) {
  let telemetryContainer = $('#TelemetryContainer');
  if (telemetryContainer.length === 0) {
    telemetryContainer = closedComponents['Telemetry_component'];
  }

  container.getElement().append(telemetryContainer);

  container.on('destroy', function() {
    closedComponents['Telemetry_component'] = telemetryContainer.detach();
    trackComponentState('Telemetry_component', false);
    updateWindowsDropdown();
  });
});

goldenLayout.registerComponent('Command_Generation_component', function (container, state) {
  let commandGenerationWindow = $('#commandGeneration');
  if (commandGenerationWindow.length === 0) {
      commandGenerationWindow = closedComponents['Command_Generation_component'];
  }

  container.getElement().append(commandGenerationWindow);

  container.on('destroy', function () {
      closedComponents['Command_Generation_component'] = commandGenerationWindow.detach();
      trackComponentState('Command_Generation_component', false);
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
        { id: 'calendar_component', title: 'Calendar' },
        { id: 'PassTime_component', title: 'PassTime' },
        { id: 'Command_Generation_component', title: 'CommandGeneration' },
        { id: 'Telemetry_component', title: 'TelemetryData' },
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
      'Command_Generation_component': {
          type: 'component',
          componentName: 'Command_Generation_component',
          title: 'CommandGeneration',
          id: 'Command_Generation_component',
          componentState: {} 
      },
      'Telemetry_component': {
          type: 'component',
          componentName: 'Telemetry_component',
          title: 'TelemetryData',
          id: 'Telemetry_component',
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
    ['cesium_component', 'calendar_component', 'PassTime_component', 'Command_Generation_component', 'Telemetry_component'].forEach(id => {
        trackComponentState(id, true);
    });
    updateWindowsDropdown();
});

goldenLayout.init();
