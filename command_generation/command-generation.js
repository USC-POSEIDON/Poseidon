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

    let data = JSON.parse(localStorage.getItem('jsonData')); // Retrieve the JSON data from local storage

    // Function to handle file upload and parse JSON
    document.getElementById('commandFile').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                data = JSON.parse(e.target.result); // Assign the parsed JSON data to the data variable
                console.log('Parsed JSON data:', data); // Log the parsed data for debugging
                localStorage.setItem('jsonData', JSON.stringify(data)); // Save the JSON data to local storage
                console.log('Data saved to local storage:', data); // Log the saved data for debugging
                document.getElementById('noJsonMessage').textContent = ''; // Clear any error message
                // Call functions that depend on the data variable
                populateCommandDropdown(data);
            } catch (error) {
                document.getElementById('noJsonMessage').textContent = 'Error parsing JSON file';
                document.getElementById('noJsonMessage').style.color = 'red';
                console.error('Error parsing JSON file:', error);
            }
        };
        reader.readAsText(file);
    });

    // Function to populate the command dropdown with data from JSON
    function populateCommandDropdown(data) {
        const noJsonMessage = document.getElementById('noJsonMessage');
        if (data) {
            noJsonMessage.style.display = 'none';

            data.sort((a, b) => a.Family.localeCompare(b.Family));
            const groupedCommands = {};

            data.forEach(command => {
                if (!groupedCommands[command.Family]) {
                    groupedCommands[command.Family] = [];
                }
                groupedCommands[command.Family].push(command);
            });

            const dropdown = document.getElementById('commandDropdown');
            dropdown.innerHTML = '';

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select command';
            dropdown.appendChild(emptyOption);

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
        } else {
            noJsonMessage.style.display = 'block';
            console.error('No JSON data found in local storage.');
        }
    }

    populateCommandDropdown(data);

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
                                        const nestedSelect = document.createElement('select');
                                        nestedSelect.name = `${param.Name}_nested`;

                                        nestedParam.Options.forEach(option => {
                                            const nestedOption = document.createElement('option');
                                            nestedOption.value = option.Command;
                                            nestedOption.textContent = option.Name;
                                            nestedSelect.appendChild(nestedOption);
                                        });

                                        nestedInput = nestedSelect;
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
    
        function generateParamString(params, nestedDropdownProcessed = false) {
            let paramString = '';
            params.forEach(param => {
                if (param.Type === "Dropdown") {
                    const selectElement = document.querySelector(`select[name="${param.Name}"]`);
                    const selectedOption = selectElement ? selectElement.value : '';
    
                    if (!nestedDropdownProcessed) {
                        paramString += ` ${selectedOption}`;
                    }
    
                    const nestedOption = param.Options.find(option => option.Command === selectedOption);
                    if (nestedOption && nestedOption.Parameters && !nestedDropdownProcessed) {
                        paramString += generateParamString(nestedOption.Parameters, true);
                    }
                } else {
                    const inputValue = document.querySelector(`input[name="${param.Name}"]`).value.trim();
                    const enclosure = param.Enclosure ? param.Enclosure : '';
                    const modifiedInputValue = enclosure ? `${enclosure}${inputValue}${enclosure}` : inputValue;
                    paramString += ` ${modifiedInputValue}`;
                }
    
                const nestedSelectElement = document.querySelector(`select[name="${param.Name}_nested"]`);
                if (nestedSelectElement && !nestedDropdownProcessed) {
                    const nestedSelectedOption = nestedSelectElement.value;
                    paramString += ` ${nestedSelectedOption}`;
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
