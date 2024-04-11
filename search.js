let selectedSearchType = 'name'; // Default value

document.getElementById('searchOptions').addEventListener('change', function(event) {
    // Check if the changed element is a radio button
    if (event.target.type === 'radio') {
        // Access the value of the selected radio button
        selectedSearchType = event.target.value;
        
        if (selectedSearchType === 'name') {
            searchButton.textContent = "Search";
            satelliteSearchInput.placeholder = "Enter your search query";
        } else if (selectedSearchType === 'catalog') {
            searchButton.textContent = "Add";
            satelliteSearchInput.placeholder = "Enter a catalog number";
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
    }
}

document.getElementById('searchButton').addEventListener('click', performSearch);

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
        displayResults(names);
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
    });
}

const catnrMap = {};

function displayResults(results) {
    // Clear previous results
    searchResults.innerHTML = '';

    // Display the first 5 results
    for (let i = 0; i < Math.min(results.length, 5); i++) {
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
        updatePresetListDisplay();
    })
    .catch(function (error) {
        // Handle errors here
        console.log(error);
        showPopup();
    });
}

function showPopup() {
    console.log("Popping up");

    // Show the popup
    var popup = document.getElementById("searchPopup");
    popup.classList.add("show");
  
    // Fade out after 3 seconds
    setTimeout(function() {
        popup.style.opacity = "0"; // Change opacity
        setTimeout(function() {
            popup.classList.remove("show");
            popup.style.opacity = ""; // Reset opacity after transition
        }, 500); // Wait for the transition to complete (0.5s)
    }, 1000);
}