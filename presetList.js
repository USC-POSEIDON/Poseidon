function populatePresetDropdowns() {
    const deleteDropdown = document.getElementById("deletePresetDropdown");
    const renameDropdown = document.getElementById("renamePresetDropdown");

    deleteDropdown.innerHTML = '';
    renameDropdown.innerHTML = '';

    populateDynamicOptions(deleteDropdown);
    populateDynamicOptions(renameDropdown);
}

function populateDynamicOptions(dropdownElement){
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
            let opt = new Option(preset, preset);
            dropdownElement.add(opt);
        });
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}



document.getElementById("selectPresetDropdown").onclick = function() {
    const selectDropdown = document.getElementById("selectPresetDropdown");
    selectDropdown.innerHTML = '';

    let opt = new Option("Change Preset", "");
    opt.disabled = true;
    selectDropdown.add(opt);

    populateDynamicOptions(selectDropdown);
}

document.getElementById("presetDropdown").onclick = function() {
    const presetDropdown = document.getElementById("presetDropdown");
    presetDropdown.innerHTML = '';
    
    let opt = new Option("Select preset to add to", "");
    opt.disabled = true;
    presetDropdown.add(opt);

    populateDynamicOptions(presetDropdown);
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
