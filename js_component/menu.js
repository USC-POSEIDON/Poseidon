const { ipcRenderer } = require('electron');

function jsonToCSV(jsonArray) {
    // Check if the data is not empty and is an array
    if (!jsonArray.length) {
        return "";
    }

    const csvRows = [];
    // Define CSV headers
    const headers = 'CatNr,Name,Event,Date,Azimuth,Elevation,Slant Range';
    csvRows.push(headers);
    console.log(jsonArray);

    jsonArray.forEach(function(pass) {
        var name = pass["satname"];
        var az = pass["az"];
        var el = pass["el"];
        var range = pass["range"];
        var date = pass["date"];
        var label = pass["label"];
        console.log(name);
        csvRows.push(`${pass.catnr},${name},${label},${date},${az},${el},${range}`);
    });

    return csvRows.join('\n');
}

// Function to toggle the visibility of a Top Menu Bar component
function updateWindowsDropdown() {
    const dropdownContent = $('#windowsDropdownContent');
    dropdownContent.empty();

    const allComponents = [
        { id: 'cesium_component', title: 'Cesium' },
        { id: 'calendar_component', title: 'Calendar' },
        { id: 'PassTime_component', title: 'PassTime' },
        { id: 'Telemetry_component', title: 'TelemetryData' },
        { id: 'Command_Generation_component', title: 'CommandGeneration' },
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

// Helper function to update the individual Windows dropdown
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#topMenuBar > ul > li').forEach(item => {
        item.addEventListener('mouseenter', function() {
            var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
            dropdownContent.style.display = "block";
        });
        item.addEventListener('mouseleave', function() {
            var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
            dropdownContent.style.display = "none";
        });
    });

    // Show ground station popup modal
    document.getElementById('groundStationLink').addEventListener('click', function(event) {
      event.preventDefault();
      document.getElementById('groundStationModal').style.display = 'block';
    });

    // Show manage preset popup modal
    document.getElementById('preference').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('preferenceModal').style.display = 'block';
    });

    // Show manage preset popup modal
    document.getElementById('debugWindow').addEventListener('click', function(event) {
        event.preventDefault();
        ipcRenderer.send('open-devtools', 'devtools');
    });

    // Hide the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
        if (!event.target.matches('#topMenuBar > ul > li')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.style.display === "block") {
                    openDropdown.style.display = "none";
                }
            }
        }
      };
      
      // Close the modal when the user use the escape key
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') { 
              document.getElementById('groundStationModal').style.display = 'none';
              document.getElementById('managePresetModal').style.display = 'none';
              document.getElementById('preferenceModal').style.display = 'none';
            }
        });
      
      // Close the modal when the user click on the close button
        document.getElementById('closeModal').addEventListener('click', function() {
          document.getElementById('groundStationModal').style.display = "none";
         });
  
        // Close the modal when the user click on the close button
        document.getElementById('closePref').addEventListener('click', function() {
          document.getElementById('preferenceModal').style.display = "none";
         });

    // Save pass time data to a CSV file and export
    document.getElementById('passTimeLink').addEventListener('click', function(event) {
        event.preventDefault();
        
        var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]:checked');
        var tz = document.getElementById('timeFormat').value;
        const promises = [];
        
        checkboxes.forEach(checkbox => {
            const satellite = checkbox.BasicSatellite;
            
            const params = new URLSearchParams({
                s: satellite.line1,
                t: satellite.line2,
                catnr: satellite.catnr,
                name: satellite.name,
                timezone: tz,
                days: 5 
            });
            
            promises.push(fetch(`http://127.0.0.1:5000/calculations/passes?${params}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("HTTP error, status = " + response.status);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error("Fetch error:", error);
                }));
        });
        
        // Call ipc from main.js to save the file
        Promise.all(promises)
        .then(results => {
            // Do something with the results after all requests have returned successfully
            const data = JSON.parse(JSON.stringify(results));

            let combinedList = [];
            data.forEach(function(passList){
                combinedList = [...combinedList, ...passList];
            });

            combinedList.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
            const csvData = jsonToCSV(combinedList);
            ipcRenderer.invoke('save-file-dialog', 'pass_times.csv', csvData);

        })
            .catch(error => {
                showPopupNotification(error, "error")
                console.error("An error occurred with the fetch requests:", error);
            });
    });
    // Initialize or update the Windows dropdown
    updateWindowsDropdown();
});

document.getElementById('uploadAPI').addEventListener('click', function(event) {
    // Retrieve the API key from the input element
    var apiKey = document.getElementById('cesiumAPI').value;

    try {
        // Save the API key in localStorage
        localStorage.setItem('cesiumApiKey', apiKey);
        Cesium.Ion.defaultAccessToken = apiKey;
        // reload the page to apply the changes
        location.reload();
        console.log('API Key saved successfully');
    } catch (error) {
        console.error('Failed to save API Key', error);
    }
});

