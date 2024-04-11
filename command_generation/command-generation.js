// Point of Contact: 
// Genia Druzhinina 
// (druzhini@usc.edu)

// MAVERIC CubeSat - University of Southern California

// ###################################################################################################
// this file converts inputted strings to valid command strings to send to the satellite and exports 
// them to a text file

// main function that does the generation : generateCommands(inputString, data)
// input:
//       inputStrings: an array of strings that we receive from the frontend
//       data: the data from the JSON file we will be using to convert our strings to command strings 
// ###################################################################################################

document.addEventListener('DOMContentLoaded', function () {
    const commandDropdown = document.getElementById('commandDropdown');
    const parameterInputs = document.getElementById('parameterInputs');
    const commandList = document.getElementById('commandList');
    const commandStringArray = [];
    let data;

    // Function to populate the command dropdown with alphabetized families and commands
    fetch(`command_generation/CubeSatCommandLibrary.json`)
        .then(response => response.json())
        .then(dataResponse => {
            data = dataResponse;
            data.sort((a, b) => a.Family.localeCompare(b.Family));
            const groupedCommands = {};

            data.forEach(command => {
                if (!groupedCommands[command.Family]) {
                    groupedCommands[command.Family] = [];
                }
                groupedCommands[command.Family].push(command);
            });

            const dropdown = document.getElementById('commandDropdown');
            for (const family in groupedCommands) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = family;
                groupedCommands[family].sort((a, b) => a.Name.localeCompare(b.Name));

                groupedCommands[family].forEach(command => {
                    const option = document.createElement('option');
                    option.value = command.ID;
                    option.textContent = command.Name;
                    optgroup.appendChild(option);
                });

                dropdown.appendChild(optgroup);
            }
        })
        .catch(error => console.error('Error fetching commands:', error));

    // Function to populate parameters based on selected command
    window.populateParameters = function () {
        const selectedCommandID = commandDropdown.value;
        const selectedCommandData = data.find(command => command.ID === selectedCommandID);
        
        parameterInputs.innerHTML = '';

        if (selectedCommandData) {
            if (selectedCommandData.Example) {
                const exampleLabel = document.createElement('label');
                exampleLabel.textContent = 'Example: ' + selectedCommandData.Example;
                parameterInputs.appendChild(exampleLabel);
            }

            if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
                selectedCommandData.Parameters.forEach(param => {
                    const label = document.createElement('label');
                    label.textContent = param.Name + ':';

                    if (param.Type === 'Dropdown' && param.Options && param.Options.length > 0) {
                        const select = document.createElement('select');
                        select.name = param.Name;

                        param.Options.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.Command;
                            optionElement.textContent = option.Name;
                            optionElement.title = option.Description;
                            select.appendChild(optionElement);
                        });

                        // Add change event listener to populate nested parameters
                        select.addEventListener('change', function() {
                            const selectedOptionValue = select.value;
                            const selectedOption = param.Options.find(option => option.Command === selectedOptionValue);
                            
                            if (selectedOption && selectedOption.Parameters && selectedOption.Parameters.length > 0) {
                                clearNestedParameters(parameterInputs);

                                selectedOption.Parameters.forEach(nestedParam => {
                                    const nestedLabel = document.createElement('label');
                                    nestedLabel.textContent = nestedParam.Name + ':';
                                    nestedLabel.classList.add('nested-label');
                                            
                                    let nestedInput;

                                    if (nestedParam.Type === 'Dropdown') {
                                        nestedInput = document.createElement('select');
                                        nestedInput.name = nestedParam.Name;
                                        nestedInput.title = nestedParam.Description;

                                        nestedParam.Options.forEach(option => {
                                            const nestedOption = document.createElement('option');
                                            nestedOption.value = option.Command;
                                            nestedOption.textContent = option.Name;
                                            nestedInput.appendChild(nestedOption);
                                        });
                                    } else {
                                        nestedInput = document.createElement('input');
                                        nestedInput.type = nestedParam.Type ? nestedParam.Type.toLowerCase() : '';
                                        nestedInput.name = nestedParam.Name;
                                        nestedInput.title = nestedParam.Description;
                                    }

                                    nestedInput.classList.add('nested-parameter');
                                    parameterInputs.appendChild(nestedLabel);
                                    parameterInputs.appendChild(nestedInput);
                                    parameterInputs.appendChild(document.createElement('br'));
                                });
                            } else {
                                clearNestedParameters(parameterInputs);
                            }
                        });
                        
                        parameterInputs.appendChild(label);
                        parameterInputs.appendChild(select);
                    } else {
                        const input = document.createElement('input');
                        input.type = param.Type ? param.Type.toLowerCase() : '';
                        input.name = param.Name;
                        input.title = param.Description;
                        
                        parameterInputs.appendChild(label);
                        parameterInputs.appendChild(input);
                    }
                    
                    parameterInputs.appendChild(document.createElement('br'));
                });
            }
        }
    };
    
    // Event listener for dropdown change event
    commandDropdown.addEventListener('change', function() {
        populateParameters();
    });

    // Function to clear existing nested parameters, labels, and <br> elements
    function clearNestedParameters(container) {
        const existingNestedParams = container.querySelectorAll('.nested-parameter');
        existingNestedParams.forEach(param => param.remove());

        const existingLabels = container.querySelectorAll('.nested-label');
        existingLabels.forEach(label => label.remove());

        const existingBr = container.querySelectorAll('br');
        existingBr.forEach(br => br.remove());
    }

    // Function to generate the command string
    function generateString() {
        const selectedCommandID = commandDropdown.value;
        const selectedCommandData = data.find(command => command.ID === selectedCommandID);

        if (!selectedCommandData) {
            console.error('No command data available.');
            return '';
        }

        let commandString = selectedCommandID;

        function generateParamString(params) {
            let paramString = '';
            params.forEach(param => {
                if (param.Type === "Dropdown") {
                    const selectElement = document.querySelector(`select[name="${param.Name}"]`);
                    const selectedOption = selectElement ? selectElement.value : '';
                    paramString += ` ${selectedOption}`;
                    const nestedOption = param.Options.find(option => option.Command === selectedOption);
                    if (nestedOption && nestedOption.Parameters) {
                        paramString += generateParamString(nestedOption.Parameters);
                    }
                } else {
                    const inputValue = document.querySelector(`input[name="${param.Name}"]`).value.trim();
                    const enclosure = param.Enclosure ? param.Enclosure : '';
                    const modifiedInputValue = enclosure ? `${enclosure}${inputValue}${enclosure}` : inputValue;
                    paramString += ` ${modifiedInputValue}`;
                }
            });
            return paramString;
        }

        if (selectedCommandData.Parameters && selectedCommandData.Parameters.length > 0) {
            commandString += generateParamString(selectedCommandData.Parameters);
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
        const commandID = commandParts[0];

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
    
    // Event listener for the "save" button
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
            commandDropdown.selectedIndex = 0;
        } else {
            console.error('Error adding commands.');
        }
    });

    // Event listener for the "generate" button
    const generateButton = document.getElementById('generateButton');
    generateButton.addEventListener('click', function () {
        if (commandStringArray.length > 0) {
            console.log(commandStringArray);
            generateCommands(commandStringArray, data);
        } else {
            console.error('Error generating commands.');
        }
    });

    // Event listener for the "clear" button
    const clearButton = document.getElementById('clearButton');
    clearButton.addEventListener('click', function () {
        commandList.innerHTML = '';
        commandStringArray.length = 0;
    });

    // Event listener for the "export" button
    const exportButton = document.getElementById('exportButton');
    exportButton.addEventListener('click', function() {
        exportCommands();

        // Listen for response from main process after attempting to save commands
        ipcRenderer.on('save-commands-response', (event, response) => {
            if (response.success) {
                console.log('Commands saved successfully:', response.filePath);
            } else {
                console.error('Error saving commands:', response.error);
            }
        });
    });
});

// Function to generate commands from input strings
function generateCommands(inputStrings, data) {
    const result = [];
    let longString = '';

    const generatedCommandsText = document.getElementById('generatedCommandsText');
    generatedCommandsText.value = '';

    inputStrings.forEach((inputString, index) => {
        const [commandID, ...values] = inputString.split(' ');
        const command = data.find(command => command.ID === commandID);

        if (command) {
            if (longString !== '' && !commandID.startsWith('CMD000')) {
                longString += ' ';
            }

            if (commandID.startsWith('CMD000')) {
                if (longString !== '') {
                    result.push(longString);
                    longString = '';
                }
                longString += `${values.join(' ')}`;
            } else {
                const generatedCommand = `${command.Int} ${values.join(' ')}`;
                longString += generatedCommand;
            }
        } else {
            console.error(`Command '${commandID}' not found in data.`);
        }

        if (index === inputStrings.length - 1 && longString !== '') {
            result.push(longString);
        }
    });

    const trimmedResult = result.map(command => command.trim());
    console.log("Generated commands: ", trimmedResult);

    generatedCommandsText.value = trimmedResult;
    generatedCommandsText.style.display = 'block';
}

// Function to export commands
function exportCommands() {
    const generatedCommandsText= document.getElementById('generatedCommandsText');

    if (generatedCommandsText.style.display === 'none') {
        console.error('No commands to export.');
        return;
    }

    const commandsToExport = generatedCommandsText.value.split('\n').filter(command => command.trim() !== '');

    if (commandsToExport.length > 0) {
        console.log(commandsToExport);
        ipcRenderer.send('save-commands', commandsToExport);
    } else {
        console.error('No commands to export.');
    }
}
