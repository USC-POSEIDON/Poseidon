class BasicSatellite {
    constructor(name, catnr, line1, line2) {
        this.catnr = catnr;
        this.name = name;
        this.line1 = line1;
        this.line2 = line2;
    }
}


function getNameSearchResults(){
    var name = document.getElementById('satelliteSearchInput').value;

    var type = document.getElementById("presetDropdown").value;
    var formData = new FormData();
    formData.append('listname', type);

    fetch(`http://127.0.0.1:5000//satellites/post/catnr/${name}`, {
        method: "POST",
        body: formData
    })
    .then(function (response) {
    if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
    }
    return response.json();
    })
    .then(function (responseData) {
    // Handle the response data here
    console.log(responseData);
    })
    .catch(function (error) {
    // Handle errors here
    console.log(error);
    });
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
    var listname = document.getElementById("presetSelectionToShowing").value
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
            console.log(typeof satellite);
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
    console.log("Checkboxchanged");

    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    
    // Count the number of checked checkboxes
    var checkedCount = 0;
    var satellite;
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            checkedCount++;
            satellite = checkbox.BasicSatellite;
            updateTelemetryTLE(satellite.line1, satellite.line2);
        }
    });
    
    // Perform action if exactly one checkbox is checked
    if (checkedCount === 1) {
        console.log('Exactly one checkbox is checked!');
        
        fetch(`http://127.0.0.1:5000//calculations/passes?` + new URLSearchParams({
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
        .then(function (responseData) {
            // Handle the response data here
            console.log(responseData);
            const data = JSON.parse(JSON.stringify(responseData));

            var tableBody = document.querySelector('#PassTimeTable tbody');
            tableBody.innerHTML = '';

            data.forEach(function(pass) {
                var rise = pass["rise"]
                var set = pass["set"];
                var culminate = pass["culminate"];
                
                var passlines = [rise, culminate, set];

                console.log(rise);
                console.log(passlines[0]);

                passlines.forEach(function(passline) {
                    console.log(passline);

                    var row = tableBody.insertRow();
                    var dateCell = row.insertCell(0);
                    var azCell = row.insertCell(1);
                    var elCell = row.insertCell(2);
                    var rangeCell = row.insertCell(3);

                    dateCell.textContent = passline["date"];
                    azCell.textContent = passline["az"].toFixed(2) + '°';
                    elCell.textContent = passline["el"].toFixed(2) + '°';
                    rangeCell.textContent = passline["range"].toFixed(2) + ' km';
                });
            }); 
            
        })
        .catch(function (error) {
            // Handle errors here
            console.log(error);
        });
    }
}