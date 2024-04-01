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
            data = dataResponse;
            
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

        parameterInputs.innerHTML = '';

        if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
            selectedCommandData.Parameters.forEach(param => {
                const label = document.createElement('label');
                label.textContent = param.Name + ':';

                const input = document.createElement('input');
                input.type = param.Type ? param.Type.toLowerCase() : '';

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

        if (!selectedCommandData) {
            console.error('No command data available.');
            return [];
        }

        let commandString = 'f ' + selectedCommandID;
        
        if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
            selectedCommandData.Parameters.forEach(param => {
                const inputValue = document.querySelector(`input[name="${param.Name}"]`).value.trim();
                commandString += ` ${inputValue}`;
            });
        }

        return commandString;
    }

    // Function to add a command to the list or update existing command
    function addCommandToList(commandString, index = -1) {
        let listItem;
        if (index === -1) {
            listItem = document.createElement('li');
            listItem.textContent = commandString;

            listItem.addEventListener('click', function() {
                const index = Array.from(commandList.children).indexOf(listItem);
                selectedIndex = index;
                const command = commandStringArray[index];
                if (command) {
                    populateDropdownAndParameters(command);

                    saveButton.style.display = 'inline-block';
                } else {
                    console.error('Command string is undefined.');
                }
            });

            commandList.appendChild(listItem);
        } else {
            listItem = commandList.children[index];
            listItem.textContent = commandString;
        }
        
        // Add delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'x';
        deleteButton.addEventListener('click', function() {
            const index = Array.from(commandList.children).indexOf(listItem);
            commandStringArray.splice(index, 1);
            commandList.removeChild(listItem);
            selectedIndex = -1;
        });
        listItem.appendChild(deleteButton);
    }

    // Function to populate dropdown and parameters from a command string
    function populateDropdownAndParameters(commandString) {
        const commandParts = commandString.split(' ');
        const commandID = commandParts[1];

        const selectedCommand = data.find(command => command.ID === commandID);

        if (selectedCommand) {
            for (let i = 0; i < commandDropdown.options.length; i++) {
                if (commandDropdown.options[i].textContent === selectedCommand.Name) {
                    commandDropdown.selectedIndex = i;
                    break;
                }
            }

            if (selectedCommand.Parameters && selectedCommand.Parameters.length > 0) {
                populateParameters();
            }
            
        } else {
            console.error(`Command with ID '${commandID}' not found.`);
        }
    }
    
    // Event listener for the save button
    saveButton.addEventListener('click', function() {
        const updatedCommand = generateString();
        commandStringArray[selectedIndex] = updatedCommand;
        console.log('Command updated:', updatedCommand);

        addCommandToList(updatedCommand, selectedIndex);

        parameterInputs.innerHTML = '';
        commandDropdown.selectedIndex = 0;
        console.log('Parameter inputs cleared.');

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
            generateCommands(commandStringArray, data);

            commandStringArray.length = 0;
            commandDropdown.selectedIndex = 0;
            commandList.innerHTML = '';
        } else {
            console.error('Error generating commands.');
        }
    });
});

// Function to generate commands from input strings
function generateCommands(inputStrings, data) {
    const result = [];

    inputStrings.forEach(inputString => {
        const [forward, commandID, ...values] = inputString.split(' ');
        const command = data.find(command => command.ID === commandID);

        if (command) {
            const generatedCommand = `${forward} ${command.Int} ${values.join(' ')}`;
            result.push(generatedCommand);
        } else {
            console.error(`Command '${commandID}' not found in data.`);
        }
    });

    saveCommandsToFile(result);
    console.log("Generated commands: ", result);

    return result;
}

// Function to save commands to a file in the specified folder
function saveCommandsToFile(commands) {
    const fs = require('fs');
    const folderPath = 'command_generation/generated_commands';
    const date = new Date();
    const fileName = `${folderPath}/generated_commands_${date.getTime()}.txt`;

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFile(fileName, commands.join('\n'), (err) => {
        if (err) {
            console.error('Error saving commands to file:', err);
        } else {
            console.log('Commands saved to file:', fileName);
        }
    });
}
