function populatePresetDropdowns() {
    const deleteDropdown = document.getElementById("deletePresetDropdown");
    const renameDropdown = document.getElementById("renamePresetDropdown");

    deleteDropdown.innerHTML = '';
    renameDropdown.innerHTML = '';

    populateDynamicOptions(deleteDropdown);
    populateDynamicOptions(renameDropdown);

    const selectDropdown = document.getElementById("selectPresetDropdown");
    const selectedValue = selectDropdown.value;
    selectDropdown.innerHTML = '';

    let selectOpt = new Option("Change Preset", "");
    selectOpt.disabled = true;
    selectDropdown.add(selectOpt);

    populateDynamicOptions(selectDropdown, selectedValue);

    const presetDropdown = document.getElementById("presetDropdown");
    const presetValue = selectDropdown.value;
    presetDropdown.innerHTML = '';
    
    let presetOpt = new Option("Select preset to add to", "");
    presetOpt.disabled = true;
    presetDropdown.add(presetOpt);

    populateDynamicOptions(presetDropdown, presetValue);
}

function populateDynamicOptions(dropdownElement, selectedValue = ""){

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
        presets.forEach(preset => {
            const optionElement = new Option(preset, preset);
            dropdownElement.appendChild(optionElement);
            if (preset === selectedValue) {
                optionElement.setAttribute('selected', 'selected');
            }
        });
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
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
    populatePresetDropdowns();
});
