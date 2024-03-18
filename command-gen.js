const { app } = require('electron').remote;

document.addEventListener('DOMContentLoaded', function () {
    const commandDropdown = document.getElementById('commandDropdown');
    const parameterInputs = document.getElementById('parameterInputs');

    // Fetch commands from external JSON file
    fetch(`CubeSatCommandLibrary.json`)
        .then(response => response.json())
        .then(data => {
            // Populate command dropdown with every command
            data.forEach(command => {
                const option = document.createElement('option');
                option.value = command.ID;
                option.textContent = command.Name;
                commandDropdown.appendChild(option);
            });

            // Function to populate parameters based on selected command
            window.populateParameters = function () {
                const selectedCommandID = commandDropdown.value;
                const selectedCommandData = data.find(command => command.ID === selectedCommandID);

                // Clear existing parameter inputs
                parameterInputs.innerHTML = '';

                // Populate parameter inputs
                selectedCommandData.Parameters.forEach(param => {
                    const label = document.createElement('label');
                    label.textContent = param.Name + ':';

                    const input = document.createElement('input');
                    input.type = param.Type.toLowerCase();
                    input.name = param.Name;

                    parameterInputs.appendChild(label);
                    parameterInputs.appendChild(input);
                    parameterInputs.appendChild(document.createElement('br'));
                });
            };
        })
        .catch(error => console.error('Error fetching commands:', error));
});
