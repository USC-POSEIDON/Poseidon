//Predicts passes for selected satellites
function predictPasses(){
    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    var satellite;
    const promises = [];
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            satellite = checkbox.BasicSatellite;
            promises.push(fetch(`http://127.0.0.1:5000//calculations/passes?` + new URLSearchParams({
                s: satellite.line1,
                t: satellite.line2,
                catnr: satellite.catnr,
                name: satellite.name,
                days: 5
            }))
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP error, status = " + response.status + ", response = " + response.statusText);
                }
                return response.json();
            })
            .catch(function (error) {
                // Handle errors here
                console.log(error);
            }));
        }
    });
    // Wait for all promises to resolve
    Promise.all(promises)
        .then(results => {
            // Do something with the results after all requests have returned successfully
            const data = JSON.parse(JSON.stringify(results));
            //console.log(data)

            let combinedList = [];
            data.forEach(function(passList){
                combinedList = [...combinedList, ...passList];
            });

            combinedList.sort((a, b) => parseDateString(a.rise.date) - parseDateString(b.rise.date));
            updatePassTimeDisplay(combinedList);
        })
        .catch(error => console.error('Error:', error));
}

//Updates the pass time table with the pass data
function updatePassTimeDisplay(data){
    var tableBody = document.querySelector('#PassTimeTable tbody');
    tableBody.innerHTML = '';
    data.forEach(function(pass) {
        var rise = pass["rise"]
        var set = pass["set"];
        var culminate = pass["culminate"];
        var name = pass["name"]
        var passlines = [rise, culminate, set];
        var count = 0;
        passlines.forEach(function(passline) {
            var row = tableBody.insertRow();
            var dateCell = row.insertCell(0);
            var nameCell = row.insertCell(1);
            var azCell = row.insertCell(2);
            var elCell = row.insertCell(3);
            var rangeCell = row.insertCell(4);
            //case 0: rise, case 1: culminate, case 2: set
            switch(count){
                case 0:
                    dateCell.textContent = passline["date"] + ' ' + "(Rise)";
                    break;
                case 1:
                    dateCell.textContent = passline["date"] + ' ' + "(Closest Pt)";
                    break;
                case 2:
                    dateCell.textContent = passline["date"] + ' ' + "(Set)";
                    break;
            }
            nameCell.textContent = name;
            azCell.textContent = passline["az"].toFixed(2) + '°';
            elCell.textContent = passline["el"].toFixed(2) + '°';
            rangeCell.textContent = passline["range"].toFixed(2) + ' km';
            count++;
        });
    }); 
}

//Beauty print the date string
function parseDateString(dateString) {
    // Split the date string by space
    const parts = dateString.split(" ");
    
    // Map month names to their numeric values
    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    
    // Parse the date components
    const year = parseInt(parts[0]);
    const month = months[parts[1]];
    const day = parseInt(parts[2]);
    const timeParts = parts[3].split(":");
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const second = parseInt(timeParts[2]);
    
    // Create and return the Date object
    return new Date(year, month, day, hour, minute, second);
}
