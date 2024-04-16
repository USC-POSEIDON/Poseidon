let selectedSearchType = 'name'; // Default value

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

/* ======================= Search Functions ======================= */

function performSearch(){
    console.log("Performing Search.")
    const searchValue = document.getElementById('satelliteSearchInput').value;
    if (selectedSearchType === 'name') {
        getNameSearchResults(searchValue);
    } else if (selectedSearchType === 'catalog') {
        addTLEByCatnr(searchValue);
    } else if (selectedSearchType === 'manual') {
        const line1 = document.getElementById('tleLine1Input').value;
        const line2 = document.getElementById('tleLine2Input').value;
        const name = document.getElementById('satelliteNameInput').value;
        addManualTLE(line1, line2, name);
    }
}

document.getElementById('searchButton').addEventListener('click', performSearch);

document.getElementById('addTleButton').addEventListener('click', performSearch);

document.getElementById('satelliteSearchInput').addEventListener('keypress', function(event) {
    // Check if Enter key is pressed (key code 13)
    if (event.keyCode === 13) {
      // Prevent the default action (e.g., form submission)
      event.preventDefault();
      // Perform the search
      performSearch();
    }
  });

/* ======================= Name Input Functions ======================= */

const searchResults = document.getElementById('searchResults');

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
        console.log(responseData);
        const data = JSON.parse(JSON.stringify(responseData));
        const names = data.satellites;

        // Display search results
        if (names.length > 20) {
            showPopupSearch("popResultOverflow");
            return;
        }
        displayResults(names);
    })
    .catch(function (error) {
        // Handle errors here
        showPopupList("unexpected");
        console.log(error);
    });
}

const catnrMap = {};

function displayResults(results) {
    // Clear previous results
    searchResults.innerHTML = '';
    searchResults.style.overflowY = 'auto'; 
    searchResults.style.maxHeight = '50px'; 

    // Display the first 5 results
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const name = result[0];
        const catnr = result[1];
        const listItem = document.createElement('li');
        let formattedCatnr = String(catnr).padStart(5, '0');
        listItem.textContent = name + " (" + formattedCatnr + ")";
        listItem.catnr = catnr;
        listItem.addEventListener('click', function() {
            satelliteSearchInput.value = ""; // Set the input value to the clicked result
            searchResults.style.display = 'none'; // Hide the search results
            console.log("clicked on " + listItem.textContent + " with catnr " + listItem.catnr);
            addTLEByCatnr(listItem.catnr);
        });
        searchResults.appendChild(listItem);
    }

    // Show search results container
    searchResults.style.display = results.length > 0 ? 'block' : 'none';
}

document.addEventListener('click', function(event) {
    if (!searchResults.contains(event.target)) {
        searchResults.style.display = 'none';
    }
});

/* ======================= Add By TLE ======================= */

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
        console.log(responseData);
        showPopupSearch("popSucc");
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopupSearch("popFail");
    });
}

function addManualTLE(line1, line2, name){
    if(line1 == "" || line2 == "" || name == ""){
        showPopup("popFail");
    }

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
        showPopupSearch("popSucc");
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopupSearch("popFail");
    });
}

function addManualTLE(line1, line2, name){
    if(line1 == "" || line2 == "" || name == ""){
        showPopup("popFail");
    }

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
        showPopupSearch("popSucc");
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopupSearch("popFail");
    });
}

function showPopupSearch(code) {
    console.log("Popping up");

    // Show the popup
    var popFail = document.getElementById("searchPopupError");
    var popSucc = document.getElementById("searchPopupSucc");
    var popResultOverflow = document.getElementById("searchPopupOverflow");
    var unexpected = document.getElementById("unexpected");
    if(code == "popSucc"){
        popSucc.classList.add("show");
        setTimeout(function() {
            popSucc.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popSucc.classList.remove("show");
                popSucc.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
    }
    else if(code == "popResultOverflow"){
        popResultOverflow.classList.add("show");
        setTimeout(function() {
            popResultOverflow.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popResultOverflow.classList.remove("show");
                popResultOverflow.style.opacity = ""; // Reset opacity after transition
            }, 500); // Wait for the transition to complete (0.5s)
        }, 1000);
    }
    else if(code == "popFail"){
        popFail.classList.add("show");
        setTimeout(function() {
            popFail.style.opacity = "0"; // Change opacity
            setTimeout(function() {
                popFail.classList.remove("show");
                popFail.style.opacity = ""; // Reset opacity after transition
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