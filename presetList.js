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

        const selectDropdown = document.getElementById("selectPresetDropdown");
        const selectedValue = selectDropdown.value;
        selectDropdown.innerHTML = '';

        let selectOpt = new Option("Change Preset", "");
        selectOpt.disabled = true;
        selectDropdown.add(selectOpt);

        populateDynamicOptions(presets, selectDropdown, selectedValue);

        const presetDropdown = document.getElementById("presetDropdown");
        const presetValue = selectDropdown.value;
        presetDropdown.innerHTML = '';
        
        let presetOpt = new Option("Select preset to add to", "");
        presetOpt.disabled = true;
        presetDropdown.add(presetOpt);

        populateDynamicOptions(presets, presetDropdown, presetValue);
        
        // Set dropdowns to default options on startup
        if(onStartup){
            var selectOptionToDisable = selectDropdown.querySelector("option[value='']");
            var presetOptionToDisable = presetDropdown.querySelector("option[value='']");

            selectOptionToDisable.selected = true;
            presetOptionToDisable.selected = true;
        }
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}

function populateDynamicOptions(presets, dropdownElement, selectedValue = ""){
    presets.forEach(preset => {
        const optionElement = new Option(preset, preset);
        dropdownElement.appendChild(optionElement);
        if (preset === selectedValue) {
            optionElement.setAttribute('selected', 'selected');
        }
    });
}

function handleOptionClick(event){
    console.log("otpion click handler");
    event.stopPropagation();
}

document.getElementById("managePresets").onclick = function() {
    document.getElementById("managePresetModal").style.display = "block";
    populatePresetDropdowns(); 
}

document.getElementById("closePresetModal").onclick = function() {
    document.getElementById("managePresetModal").style.display = "none";
    populatePresetDropdowns(); 
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
    })
    .catch(function (error) {
        // Handle errors here
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
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}

document.getElementById("renamePresetBtn").onclick = function() {
    const selectedPreset = document.getElementById("renamePresetDropdown").value;
    const newName = document.getElementById("renamePresetInput").value;
    // TODO
}

document.addEventListener("DOMContentLoaded", function() {
    populatePresetDropdowns(onStartup=true);
});
