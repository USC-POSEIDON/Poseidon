// Point of Contact: 
// Genia Druzhinina 
// (druzhini@usc.edu)

// MAVERIC CubeSat - University of Southern California

// ################################################################################################
// this file converts inputted strings to valid command strings to send to the satellite

// main function that does the generation : generate_command(string_array, json_commands)
// input:
//       string_array: an array of strings that we receive from the frontend
//       json_commands: the JSON file we will be using to convert our strings to command strings 
// ################################################################################################

document.addEventListener('DOMContentLoaded', function () {
    const commandDropdown = document.getElementById('commandDropdown');
    const parameterInputs = document.getElementById('parameterInputs');
    const commandList = document.getElementById('commandList');
    const commandStringArray = [];
    let data;

    // Fetch commands from external JSON file
    fetch(`command_generation/CubeSatCommandLibrary.json`)
        .then(response => response.json())
        .then(dataResponse => {
            data = dataResponse; // Store command data
            // Populate command dropdown with every command
            data.forEach(command => {
                const option = document.createElement('option');
                option.value = command.ID;
                option.textContent = command.Name;
                commandDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching commands:', error));

    // Function to populate parameters based on selected command
    window.populateParameters = function () {
        const selectedCommandID = commandDropdown.value;
        const selectedCommandData = data.find(command => command.ID === selectedCommandID);

        // Clear existing parameter inputs
        parameterInputs.innerHTML = '';

        // Check if the command has parameters
        if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
            // Populate parameter inputs
            selectedCommandData.Parameters.forEach(param => {
                const label = document.createElement('label');
                label.textContent = param.Name + ':';

                const input = document.createElement('input');
                input.type = param.Type ? param.Type.toLowerCase() : ''; // Check if param.Type is defined before accessing toLowerCase()

                // Ensure input name is set
                if (param.Name) {
                    input.name = param.Name;
                } else {
                    console.error('Parameter name is not defined.');
                    return;
                }

                parameterInputs.appendChild(label);
                parameterInputs.appendChild(input);
                parameterInputs.appendChild(document.createElement('br'));
            });
        }
    };

    // Function to generate the array of command strings
    function generateString() {
        const selectedCommandID = commandDropdown.value;
        
        const selectedCommandData = data.find(command => command.ID === selectedCommandID);

        // Check if command data is available
        if (!selectedCommandData) {
            console.error('No command data available.');
            return [];
        }

        // Initialize with command ID
        let commandString = 'f ' + selectedCommandID;
        
        // Check if the command has parameters
        if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
            // Loop through parameter inputs and append their values to the commandString
            selectedCommandData.Parameters.forEach(param => {
                const inputValue = document.querySelector(`input[name="${param.Name}"]`).value.trim();
                commandString += ` ${inputValue}`; // Concatenate parameter values to the commandString
            });
        }

        return commandString;
    }

    // Function to add a command to the list or update existing command
    function addCommandToList(commandString, index = -1) {
        let listItem;
        if (index === -1) {
            // If index is -1, add a new command
            listItem = document.createElement('li');
            listItem.textContent = commandString;

            // Event listener to populate parameter inputs when clicking on the command
            listItem.addEventListener('click', function() {
                const index = Array.from(commandList.children).indexOf(listItem);
                selectedIndex = index; // Update the selectedIndex
                const command = commandStringArray[index];
                populateDropdownAndParameters(command);
                
                // Show the save button
                saveButton.style.display = 'inline-block';
            });

            commandList.appendChild(listItem);
        } else {
            // If index is provided, update the existing command
            listItem = commandList.children[index];
            listItem.textContent = commandString;
        }
        
        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'x';
        deleteButton.addEventListener('click', function() {
            const index = Array.from(commandList.children).indexOf(listItem);
            commandStringArray.splice(index, 1); // Remove the command from the array
            commandList.removeChild(listItem); // Remove the list item from the list
            selectedIndex = -1; // Reset selectedIndex
        });
        listItem.appendChild(deleteButton);
    }

    // Function to populate dropdown and parameters from a command string
    function populateDropdownAndParameters(commandString) {
        const commandParts = commandString.split(' ');
        const commandID = commandParts[1]; // Extract the command ID from the command string

        const selectedCommand = data.find(command => command.ID === commandID);

        if (selectedCommand) {
            // Loop through each option in the dropdown
            for (let i = 0; i < commandDropdown.options.length; i++) {
                // Check if the option's text matches the selected command's name
                if (commandDropdown.options[i].textContent === selectedCommand.Name) {
                    // Set the selectedIndex of the dropdown to this option
                    commandDropdown.selectedIndex = i;
                    break; // Exit the loop once the correct option is found
                }
            }

            // Check if the command has parameters
            if (selectedCommand.Parameters && selectedCommand.Parameters.length > 0) {
                // Trigger the populateParameters function
                populateParameters();
            }
            
        } else {
            console.error(`Command with ID '${commandID}' not found.`);
        }
    }
    
    // Event listener for the save button
    saveButton.addEventListener('click', function() {
        // Update the command in the commandStringArray with the new parameters
        const updatedCommand = generateString();
        commandStringArray[selectedIndex] = updatedCommand;
        console.log('Command updated:', updatedCommand);

        // Update the corresponding list item with the updated command
        addCommandToList(updatedCommand, selectedIndex);

        // Clear parameter inputs and reset dropdown
        parameterInputs.innerHTML = '';
        commandDropdown.selectedIndex = 0;
        console.log('Parameter inputs cleared.');

        // Hide the save button
        saveButton.style.display = 'none';
    });

    // Event listener for the "add" button
    const addButton = document.getElementById('addButton');
    addButton.addEventListener('click', function () {
        const commandString = generateString();
        if (commandString.length > 0) {
            commandStringArray.push(commandString);
            addCommandToList(commandString);
            console.log('Commands added:', commandString);
            // Clear existing parameter inputs
            parameterInputs.innerHTML = '';
        } else {
            console.error('Error adding commands.');
        }
    });

    // Event listener for the "generate" button
    const generateButton = document.getElementById('generateCommand');
    generateButton.addEventListener('click', function () {
        if (commandStringArray.length > 0) {
            console.log(commandStringArray);
            // Call the function to execute the Python script with the generated commands
            generateCommands(commandStringArray, data);
        } else {
            console.error('Error generating commands.');
        }
    });
});

// Function to generate commands from input strings
function generateCommands(inputStrings, data) {
    const result = [];

    // Iterate over each input string
    inputStrings.forEach(inputString => {
        const [forward, commandID, ...values] = inputString.split(' ');

        // Find the corresponding command from data
        const command = data.find(command => command.ID === commandID);

        if (command) {
            // If command found, generate the command string using commandInt
            const generatedCommand = `${forward} ${command.Int} ${values.join(' ')}`;
            result.push(generatedCommand);
        } else {
            console.error(`Command '${commandID}' not found in data.`);
        }
    });

    console.log(result);
    return result;
}