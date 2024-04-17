// import 'tippy.js/dist/tippy.css'; // optional for styling
const tippy = require('tippy.js');

// Refresh the preset list display
function updatePresetListDisplay(){
    console.log("REFRESH")
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
        //console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));
        var ul = document.getElementById("presetList"); // Get the div element
        ul.innerHTML = '';        // Clear existing content
        ul.style.overflowY = 'auto'; 
        ul.style.maxHeight = '150px'; 
        var options = data.satellites;// Define the options
        options.sort((a, b) => a[1].localeCompare(b[1]));// Sort by name alphabetically
        options.forEach(function(satellite) { // Populate list with satellite names
            var catnr = satellite[0];
            var name = satellite[1];
            var line1 = satellite[2];
            var line2 = satellite[3];
            var li = document.createElement("li");
            li.classList.add("list-item");
            // Set on-hover for each list item
            li.addEventListener('mouseenter', function() {
                handleSatelliteHover(li, catnr); 
            });
            var label = document.createElement("label");
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.addEventListener('change', handleCheckboxChange);
            checkbox.BasicSatellite = new BasicSatellite(name, catnr, line1, line2);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + name)); // Add space before name
            // Associate catnr + listname with li
            li.dataset.catnr = catnr;
            li.dataset.listname = listname;
            li.appendChild(label);
            addXButton(li);
            ul.appendChild(li);
        }); 
        document.getElementById("selectAll").style.display = 'block';
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}

// Shows last update time on hover in the preset list
function handleSatelliteHover(item, catnr){
    fetch(`http://127.0.0.1:5000/satellites/get/updatetime/${catnr}`, { 
        method: 'GET'
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        //console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));
        var updateInfo = "Last updated: " + data.time;
        tippy.default(item, {
            delay: 500,
            content: updateInfo,
            placement: 'left'
        });
    })
    .catch(function (error) {
        console.log(error);
    });
}

// Add delete button to each satellite in the preset list
function addXButton(li) {
    var closeButton = document.createElement("button");
    closeButton.classList.add("x-button");
    closeButton.innerText = "x";
    closeButton.addEventListener("click", function(event) {
        // Remove satellite
        li.remove();
        removeSatelliteFromPreset(li.dataset.catnr, li.dataset.listname);
    });

    li.appendChild(closeButton);
}

// Remove satellite from preset list and update in backend
function removeSatelliteFromPreset(catnr, listname){
    fetch(`http://127.0.0.1:5000/satellites/delete/satellite/${catnr}/${listname}`, { 
        method: 'DELETE'
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (data) {
        //console.log(data);
    })
    .catch(function (error) {
        console.log(error);
    });
}

// if only one checkbox is checked, perform update orbit and telemetry
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
        updateTelemetryTLE(satellite.line1, satellite.line2);
        updateSatelliteTLE(satellite.line1, satellite.line2);
        updateTelemetryTableLable(satellite.name);
    }
}

// Show all available presets in dropdowns
function populatePresetDropdowns(onStartup=false) {
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
        const presets = data.names;

        const deleteDropdown = document.getElementById("deletePresetDropdown");
        const renameDropdown = document.getElementById("renamePresetDropdown");

        deleteDropdown.innerHTML = '';
        renameDropdown.innerHTML = '';

        populateDynamicOptions(presets, deleteDropdown);
        populateDynamicOptions(presets, renameDropdown);

        const presetDisplayDropdown = document.getElementById("selectPresetDropdown");
        const presetDisplayValue = presetDisplayDropdown.value;
        presetDisplayDropdown.innerHTML = '';

        let selectOpt = new Option("Change Preset", "");
        selectOpt.disabled = true;
        presetDisplayDropdown.add(selectOpt);

        populateDynamicOptions(presets, presetDisplayDropdown, presetDisplayValue);

        const presetSearchDropdown = document.getElementById("presetDropdown");
        const presetSearchValue = presetSearchDropdown.value;
        presetSearchDropdown.innerHTML = '';
        
        let presetOpt = new Option("Select preset to add to", "");
        presetOpt.disabled = true;
        presetSearchDropdown.add(presetOpt);

        populateDynamicOptions(presets, presetSearchDropdown, presetSearchValue);
        
        // Set dropdowns to default options on startup
        if(onStartup){
            var selectOptionToDisable = presetDisplayDropdown.querySelector("option[value='']");
            var presetOptionToDisable = presetSearchDropdown.querySelector("option[value='']");

            selectOptionToDisable.selected = true;
            presetOptionToDisable.selected = true;
        }
    })
    .catch(function (error) {
        // Handle errors here
        showPopupNotification(error, "error");
        console.log(error);
    });
}

function populateDynamicOptions(presets, dropdownElement, selectedValue = ""){
    let matchFound = false;
    presets.forEach(preset => {
        const optionElement = new Option(preset, preset);
        dropdownElement.appendChild(optionElement);
        if (preset == selectedValue) {
            //console.log("match at " + preset + selectedValue);
            matchFound = true;
            optionElement.setAttribute('selected', 'selected');
        }
    });
    if(!matchFound){
        var selectOptionToDisable = dropdownElement.querySelector("option[value='']");
        if(selectOptionToDisable !== null){
            selectOptionToDisable.selected = true;
        }
    }
}

document.getElementById("managePresets").onclick = function() {
    document.getElementById("managePresetModal").style.display = "block";
    populatePresetDropdowns(); 
}

document.getElementById("closePresetModal").onclick = function() {
    document.getElementById("managePresetModal").style.display = "none";
}

document.getElementById("selectAll").onclick = function() {
    //if any checkboxes are checked, uncheck all
    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    var anyChecked = false;
    checkboxes.forEach(checkbox => {
        if(checkbox.checked){
            anyChecked = true;
        }
    });
    if(anyChecked){
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    else{
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
}

document.getElementById("addPresetBtn").onclick = function() {
    const newName = document.getElementById("addPresetInput").value;
    fetch(`http://127.0.0.1:5000//satellites/post/preset/${newName}`, {
        method: "POST"
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Handle the response data here
        //console.log(responseData);
        showPopupNotification("Preset List Created", "pass");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Handle errors here
        showPopupNotification(error, "error");
        console.log(error);
    });
}

document.getElementById("deletePresetBtn").onclick = function() {
    const selectedPreset = document.getElementById("deletePresetDropdown").value;
    fetch(`http://127.0.0.1:5000//satellites/delete/preset/${selectedPreset}`, {
        method: "DELETE"
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
        showPopupNotification("Preset List Deleted", "pass");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Handle errors here
        showPopupNotification(error, "error");
        console.log(error);
    });
}

document.getElementById("renamePresetBtn").onclick = function() {
    const selectedPreset = document.getElementById("renamePresetDropdown").value;
    const newName = document.getElementById("renamePresetInput").value;
    fetch(`http://127.0.0.1:5000/satellites/rename/preset/${selectedPreset}/${newName}`, {
        method: "POST"
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
        showPopupNotification("Preset List Renamed", "pass");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Rename unsuccessful
        showPopupNotification(error, "error");
        console.log(error);
        
    });
}

document.addEventListener("DOMContentLoaded", function() {
    populatePresetDropdowns(onStartup=true);
});

const interval = setInterval(updatePresetListDisplay, 6000);
