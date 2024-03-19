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
    let data; // Variable to hold command data

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

    // Function to generate the array of command strings
    function generateStringArray() {
        const selectedCommandID = commandDropdown.value;
        const selectedCommandData = data.find(command => command.ID === selectedCommandID);

        // Check if command data is available
        if (!selectedCommandData) {
            console.error('No command data available.');
            return [];
        }

        const commandStrings = []; // Array to store command strings

        // Initialize with command ID
        let commandString = 'f ' + selectedCommandID;

        // Loop through parameter inputs and append their values to the commandString
        selectedCommandData.Parameters.forEach(param => {
            const inputValue = document.querySelector(`input[name="${param.Name}"]`).value.trim();
            commandStrings.push(`${commandString} ${inputValue}`); // Push each command string into the array
        });

        console.log(commandStrings);
        return commandStrings;
    }

    // Event listener for the "generate" button
    const generateButton = document.getElementById('generateCommand');
    generateButton.addEventListener('click', function () {
        const commandString = generateStringArray();
        if (commandString) {
            // Call the function to execute the Python script with the generated command string
            generateCommands(commandString, data);
        } else {
            console.error('Error generating command string.');
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
