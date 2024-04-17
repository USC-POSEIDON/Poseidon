const tippy = require('tippy.js');
// import 'tippy.js/dist/tippy.css'; // optional for styling

function showPresetSelectOptions(){
    //console.log("showing preset options");
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
        //console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));

        // Get the div element
        var ul = document.getElementById("presetList");

        // Clear existing content
        ul.innerHTML = '';
        ul.style.overflowY = 'auto'; 
        ul.style.maxHeight = '150px'; 

        // Define the options
        var options = data.satellites;

        // Sort by name alphabetically
        options.sort((a, b) => a[1].localeCompare(b[1]));

        // Populate list with satellite names
        options.forEach(function(satellite) {
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
        showPopupList("unexpected");
        console.log(error);
    });
}

function populateDynamicOptions(presets, dropdownElement, selectedValue = ""){
    let matchFound = false;
    presets.forEach(preset => {
        const optionElement = new Option(preset, preset);
        dropdownElement.appendChild(optionElement);
        if (preset == selectedValue) {
            console.log("match at " + preset + selectedValue);
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


function showPopupList(code) {
    console.log("Popping up");
    // Show the popup
    var popCreate = document.getElementById("listCreate");
    var popRename = document.getElementById("listRename");
    var popDelete = document.getElementById("listDelete");
    var unexpected = document.getElementById("unexpected");
    if(code == "popCreate"){
        popCreate.classList.add("show");
        setTimeout(function() {
            popCreate.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popCreate.classList.remove("show");
                popCreate.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
    }
    else if(code == "popRename"){
        popRename.classList.add("show");
        setTimeout(function() {
            popRename.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popRename.classList.remove("show");
                popRename.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
    }
    else if(code == "popDelete"){
        popDelete.classList.add("show");
        setTimeout(function() {
            popDelete.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popDelete.classList.remove("show");
                popDelete.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
    }
    else{
        unexpected.classList.add("show");
        setTimeout(function() {
            unexpected.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                unexpected.classList.remove("show");
                unexpected.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
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
        console.log(responseData);
        showPopupList("popCreate");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Handle errors here
        showPopupList("unexpected");
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
        showPopupList("popDelete");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Handle errors here
        showPopupList("unexpected");
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
        showPopupList("popRename");
        populatePresetDropdowns();
    })
    .catch(function (error) {
        // Rename unsuccessful
        showPopupList("unexpected");
        console.log(error);
        
    });
}

document.addEventListener("DOMContentLoaded", function() {
    populatePresetDropdowns(onStartup=true);
});
