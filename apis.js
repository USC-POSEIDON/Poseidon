class BasicSatellite {
    constructor(name, catnr, line1, line2) {
        this.catnr = catnr;
        this.name = name;
        this.line1 = line1;
        this.line2 = line2;
    }
}

function showPresetSelectOptions(){

    console.log("showing preset options");
    fetch(`http://127.0.0.1:5000//satellites/get/allpresets`)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Handle the response data here
        console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));

        // Get the div element
        var select = document.getElementById("presetSelectionToShowing");

        // Clear any existing content
        select.innerHTML = "";

        // Create a select element
        // var select = document.createElement("select");

        // Define the options
        var options = data.names;

        // Add default option
        var option = document.createElement("option");
        option.text = "Change Preset";
        option.value = "";
        option.disabled = true;
        select.add(option);

        // Loop through options and create option elements
        for (var i = 0; i < options.length; i++) {
            var option = document.createElement("option");
            option.text = options[i];
            option.value = options[i];
            select.add(option);
        }
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}

function updatePresetListDisplay(){
    var listname = document.getElementById("selectPresetDropdown").value
    document.getElementById("presetListTitle").textContent = listname;

    fetch(`http://127.0.0.1:5000//satellites/get/preset/${listname}`)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Handle the response data here
        console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));

        // Get the div element
        var ul = document.getElementById("presetList");

        // Clear existing content
        ul.innerHTML = '';

        // Define the options
        var options = data.satellites;

        // Populate list with satellite names
        options.forEach(function(satellite) {
            var catnr = satellite[0];
            var name = satellite[1];
            var line1 = satellite[2];
            var line2 = satellite[3];

            var li = document.createElement("li");
            var label = document.createElement("label");
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.addEventListener('change', handleCheckboxChange);
            checkbox.BasicSatellite = new BasicSatellite(name, catnr, line1, line2);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + name)); // Add space before name
            li.appendChild(label);
            ul.appendChild(li);
        }); 
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });

}

function handleCheckboxChange() {
    // Get all checkboxes within the div
    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    
    // Count the number of checked checkboxes
    var checkedCount = 0;
    var satellite;

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            satellite = checkbox.BasicSatellite;
            checkedCount++;
        }
    });

    // Perform action if exactly one checkbox is checked
    if (checkedCount === 1) {
        console.log('Exactly one checkbox is checked!');
        updateTelemetryTLE(satellite.line1, satellite.line2);
        updateSatelliteTLE(satellite.line1, satellite.line2);
    }
}

function predictPasses(){
    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    var satellite;
    const promises = [];
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            satellite = checkbox.BasicSatellite;
            promises.push(fetch(`http://127.0.0.1:5000//calculations/passes?` + new URLSearchParams({
                s: satellite.line1,
                t: satellite.line2,
                catnr: satellite.catnr,
                name: satellite.name,
                days: 1
            }))
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP error, status = " + response.status + ", response = " + response.statusText);
                }
                return response.json();
            })
            .catch(function (error) {
                // Handle errors here
                console.log(error);
            }));
        }
    });

    // Wait for all promises to resolve
    Promise.all(promises)
        .then(results => {
            // Do something with the results after all requests have returned successfully
            console.log('All requests have returned successfully:', results);
            const data = JSON.parse(JSON.stringify(results));
            console.log(data)

            let combinedList = [];
            data.forEach(function(passList){
                combinedList = [...combinedList, ...passList];
            });

            combinedList.sort((a, b) => parseDateString(a.rise.date) - parseDateString(b.rise.date));
            updatePassTimeDisplay(combinedList);
        })
        .catch(error => console.error('Error:', error));

}

function updatePassTimeDisplay(data){
    var tableBody = document.querySelector('#PassTimeTable tbody');
    tableBody.innerHTML = '';

    data.forEach(function(pass) {
        var rise = pass["rise"]
        var set = pass["set"];
        var culminate = pass["culminate"];
        var name = pass["name"]
        
        var passlines = [rise, culminate, set];
        passlines.forEach(function(passline) {

            var row = tableBody.insertRow();
            var dateCell = row.insertCell(0);
            var nameCell = row.insertCell(1);
            var azCell = row.insertCell(2);
            var elCell = row.insertCell(3);
            var rangeCell = row.insertCell(4);

            dateCell.textContent = passline["date"];
            nameCell.textContent = name;
            azCell.textContent = passline["az"].toFixed(2) + '°';
            elCell.textContent = passline["el"].toFixed(2) + '°';
            rangeCell.textContent = passline["range"].toFixed(2) + ' km';
        });
    }); 
}

function updateGroundStationBackEnd(lat, lon){
    fetch(`http://127.0.0.1:5000/calculations/groundstation`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lat: lat,
            lon: lon
        })
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (data) {
        console.log(data);  // Log the response data
    })
    .catch(function (error) {
        console.log(error);
    });
};


function parseDateString(dateString) {
    // Split the date string by space
    const parts = dateString.split(" ");
    
    // Map month names to their numeric values
    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    // Parse the date components
    const year = parseInt(parts[0]);
    const month = months[parts[1]];
    const day = parseInt(parts[2]);
    const timeParts = parts[3].split(":");
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const second = parseInt(timeParts[2]);
    
    // Create and return the Date object
    return new Date(year, month, day, hour, minute, second);
}
