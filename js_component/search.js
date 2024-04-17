let selectedSearchType = 'name'; // Default value
const searchResults = document.getElementById('searchResults');
const catnrMap = {};

// Search function for user to search satellites by name or catalog number
function performSearch(){
    console.log("Performing Search.")
    const searchValue = document.getElementById('satelliteSearchInput').value;
    if (selectedSearchType === 'name') {
        getNameSearchResults(searchValue);
    } else if (selectedSearchType === 'catalog') {
        addTLEByCatnr(searchValue);
    } else if (selectedSearchType === 'manual') {
        document.getElementById('tle-error').textContent = '';
        const line1 = document.getElementById('tleLine1Input').value;
        const line2 = document.getElementById('tleLine2Input').value;
        const name = document.getElementById('satelliteNameInput').value;
        if(name == "" || line1 == "" || line2 == ""){
            document.getElementById('tle-error').textContent = "Please fill out all fields";
        }
        else if(isValidTLE(line1, line2)){
            addManualTLE(line1, line2, name);
            document.getElementById('tleLine1Input').value = 'Enter TLE Line 1';
            document.getElementById('tleLine2Input').value = 'Enter TLE Line 2';
            document.getElementById('satelliteNameInput').value = 'Enter Satellite Name';
        }
        else{
            document.getElementById('tle-error').textContent = "Invalid TLE";
            document.getElementById('tleLine1Input').value = '';
            document.getElementById('tleLine2Input').value = '';
        }
    }
}

// Get search results based on name
function getNameSearchResults(name){
    var type = document.getElementById("presetDropdown").value;
    var formData = new FormData();
    formData.append('listname', type);

    console.log(`Searching for satellites with name ${name}`);

    fetch(`http://127.0.0.1:5000/satellites/get/names/${name}`)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Handle the response data here
        //console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));
        const names = data.satellites;

        // Display search results
        if (names.length > 20) {
            showPopupNotification("Please Refine your search. Too many results.", "error");
            return;
        }
        displayResults(names);
    })
    .catch(function (error) {
        // Handle errors here
        showPopupNotification(error, "error");
        console.log(error);
    });
}

// Display search results for search by Name
function displayResults(results) {
    // Clear previous results
    searchResults.innerHTML = '';
    searchResults.style.overflowY = 'auto'; 
    searchResults.style.maxHeight = '70px'; 
    searchResults.style.marginLeft = '0px';

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const name = result[0];
        const catnr = result[1];
        const listItem = document.createElement('li');
        let formattedCatnr = String(catnr).padStart(5, '0');
        listItem.textContent = name + " (" + formattedCatnr + ")";
        listItem.catnr = catnr;
        // Style for hover tooltip and cursor pointer
        listItem.style.cursor = 'pointer';
        listItem.title = 'Click to add';
        // Adding event listener for click
        listItem.addEventListener('click', function() {
            satelliteSearchInput.value = "";
            searchResults.style.display = 'none';
            console.log("clicked on " + listItem.textContent + " with catnr " + listItem.catnr);
            addTLEByCatnr(listItem.catnr);
        });
        // Append the item and add a divider
        searchResults.appendChild(listItem);
        listItem.style.borderBottom = '1px solid #ccc'; // Adding a divider line
    }
    // Show search results container
    searchResults.style.display = results.length > 0 ? 'block' : 'none';
}

// Add the satellite to the selected list by catalog number
function addTLEByCatnr(catnr){
    console.log(`Adding satellite with catnr ${catnr}`)
    var type = document.getElementById("presetDropdown").value;
    var formData = new FormData();
    formData.append('listname', type);

    console.log(`Adding sat ${catnr} to list ${type}`);

    fetch(`http://127.0.0.1:5000//satellites/post/catnr/${catnr}`, {
        method: "POST",
        body: formData
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
            // TODO: figure out how to get response message
        }
        return response.json();
    })
    .then(function (responseData) {
        // Satellite successfully added to list
        //console.log(responseData);
        showPopupNotification("Satellite successfully added to list", "pass");
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopupNotification(error, "error");
    });
}

// Add satellite with user input TLE
function addManualTLE(line1, line2, name){
    var type = document.getElementById("presetDropdown").value;
    var formData = new FormData();
    formData.append('s', line1);
    formData.append('t', line2);
    formData.append('name', name);
    formData.append('listname', type);

    fetch(`http://127.0.0.1:5000/satellites/post/manual/tle`, {
        method: "POST",
        body: formData
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
    })
    .then(function (responseData) {
        // Satellite successfully added to list
        console.log(responseData);
        showPopupNotification("Satellite successfully added to list", "pass");
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopupNotification(error, "error");
    });
}

document.getElementById('searchOptions').addEventListener('change', function(event) {
    var presetSelection = document.getElementById('presetSelection');
    var searchDropdown = document.getElementsByClassName('search-dropdown')[0];
    var tleInputContainer = document.getElementById('tleInputContainer');
    var searchButton = document.getElementById('searchButton');
    var satelliteSearchInput = document.getElementById('satelliteSearchInput');
    // Check if the changed element is a radio button
    if (event.target.type === 'radio') {
        selectedSearchType = event.target.value;
        
        presetSelection.style.display = 'none';
        searchDropdown.style.display = 'none';
        tleInputContainer.style.display = 'none';

        if (event.target.value === 'name') {
            // Show elements for 'By Name' search
            presetSelection.style.display = 'block';
            searchDropdown.style.display = 'block';
            searchButton.textContent = "Search";
            satelliteSearchInput.placeholder = "Enter your search query";
        } else if (event.target.value === 'catalog') {
            // Show elements for 'By Catalog #' search
            presetSelection.style.display = 'block';
            searchDropdown.style.display = 'block';
            searchButton.textContent = "Add";
            satelliteSearchInput.placeholder = "Enter a catalog number";
        } else if (event.target.value === 'manual') {
            // Show elements for 'Manual' entry
            presetSelection.style.display = 'block';
            tleInputContainer.style.display = 'block';
            searchButton.textContent = "Add";
            satelliteSearchInput.placeholder = "Enter Satellite Name"; 
        }
    }
});

document.getElementById('searchButton').addEventListener('click', performSearch);

document.getElementById('addTleButton').addEventListener('click', performSearch);

// Handle enter when search
document.getElementById('satelliteSearchInput').addEventListener('keypress', function(event) {
    // Check if Enter key is pressed (key code 13)
    if (event.keyCode === 13) {
      // Prevent the default action (e.g., form submission)
      event.preventDefault();
      // Perform the search
      performSearch();
    }
});

document.addEventListener('click', function(event) {
    if (!searchResults.contains(event.target)) {
        searchResults.style.display = 'none';
    }
});