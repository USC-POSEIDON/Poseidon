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

    jsonArray.forEach(entry => {
        entry.forEach(pass => {
            const baseData = `${pass.catnr},${pass.name}`;
            ['rise', 'culminate', 'set'].forEach(eventType => {
                const event = pass[eventType];
                const row = `${baseData},${eventType},${event.date},${event.az},${event.el},${event.range}`;
                csvRows.push(row);
            });
        });
    });

    return csvRows.join('\n');
}


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

    document.getElementById('groundStationLink').addEventListener('click', function(event) {
      event.preventDefault();
      document.getElementById('groundStationModal').style.display = 'block';
    });

    document.getElementById('debugWindow').addEventListener('click', function(event) {
        event.preventDefault();
        ipcRenderer.send('open-devtools', 'devtools');
    });

    document.getElementById('passTimeLink').addEventListener('click', function(event) {
        event.preventDefault();
        
        var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]:checked');
        const promises = [];
        
        checkboxes.forEach(checkbox => {
            const satellite = checkbox.BasicSatellite;
            
            const params = new URLSearchParams({
                s: satellite.line1,
                t: satellite.line2,
                catnr: satellite.catnr,
                name: satellite.name,
                days: 1 
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
        
        Promise.all(promises)
            .then(data => {
                // Convert fetched JSON data to CSV format
                const csvData = jsonToCSV(data);
                // Invoke saving function with converted CSV data
                ipcRenderer.invoke('save-file-dialog', 'AllSatellitesPassTime.csv', csvData)
                    .then(filePath => {
                        console.log('File saved to:', filePath);
                    })
                    .catch(err => {
                        console.error('Failed to save file:', err);
                    });
            })
            .catch(error => {
                console.error("An error occurred with the fetch requests:", error);
            });
    });

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
      if (event.target == document.getElementById('groundStationModal')) {
          document.getElementById('groundStationModal').style.display = "none";
      }
    };

    // Initialize or update the Windows dropdown
    updateWindowsDropdown();
});

