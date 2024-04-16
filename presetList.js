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

document.addEventListener("DOMContentLoaded", function() {
    populatePresetDropdowns(onStartup=true);
});
