// function populatePresetDropdowns() {
//     const deleteDropdown = document.getElementById("deletePresetDropdown");
//     const renameDropdown = document.getElementById("renamePresetDropdown");

//     deleteDropdown.innerHTML = '';
//     renameDropdown.innerHTML = '';

//     // TODO: replace with actual data
//     const presets = ['Preset 1', 'Preset 2', 'Preset 3']; // Mock data right now
//     presets.forEach(preset => {
//         let deleteOption = new Option(preset, preset);
//         let renameOption = new Option(preset, preset);
//         deleteDropdown.add(deleteOption);
//         renameDropdown.add(renameOption);
//     });
// }

// document.getElementById("managePresets").onclick = function() {
//     document.getElementById("managePresetModal").style.display = "block";
//     populatePresetDropdowns(); 
// }

// document.getElementById("closePresetModal").onclick = function() {
//     document.getElementById("managePresetModal").style.display = "none";
// }

// document.getElementById("addPresetBtn").onclick = function() {
//     const newName = document.getElementById("addPresetInput").value;
//     // TODO
// }

// document.getElementById("deletePresetBtn").onclick = function() {
//     const selectedPreset = document.getElementById("deletePresetDropdown").value;
//     // TODO
// }

// document.getElementById("renamePresetBtn").onclick = function() {
//     const selectedPreset = document.getElementById("renamePresetDropdown").value;
//     const newName = document.getElementById("renamePresetInput").value;
//     // TODO
// }
