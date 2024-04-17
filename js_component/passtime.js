//Predicts passes for selected satellites
function predictPasses(){
    var checkboxes = document.querySelectorAll('#presetList input[type="checkbox"]');
    var satellite;
    var tz = document.getElementById('timeFormat').value;
    const promises = [];
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            satellite = checkbox.BasicSatellite;
            promises.push(fetch(`http://127.0.0.1:5000//calculations/passes?` + new URLSearchParams({
                s: satellite.line1,
                t: satellite.line2,
                catnr: satellite.catnr,
                name: satellite.name,
                timezone: tz, 
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

            combinedList.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
            // combinedList.sort((a, b) => {
            //     // Parse UTC dates to local dates
            //     const dateA = new Date(a.rise.date);
            //     const dateB = new Date(b.rise.date);
                
            //     // Convert UTC dates to local time
            //     const localDateA = dateA.toLocaleString();
            //     const localDateB = dateB.toLocaleString();
                
            //     // Compare the local dates
            //     return parseDateString(localDateA) - parseDateString(localDateB);
            // });
            
            updatePassTimeDisplay(combinedList);
        })
        .catch(error => console.error('Error:', error));
}

//Updates the pass time table with the pass data
function updatePassTimeDisplay(data){
    var tableBody = document.querySelector('#PassTimeTable tbody');
    tableBody.innerHTML = '';
    data.forEach(function(pass) {
        var name = pass["name"];
        var az = pass["az"];
        var el = pass["el"];
        var range = pass["range"];
        var date = pass["date"];
        var label = pass["label"];

        var row = tableBody.insertRow();
        var dateCell = row.insertCell(0);
        var nameCell = row.insertCell(1);
        var azCell = row.insertCell(2);
        var elCell = row.insertCell(3);
        var rangeCell = row.insertCell(4);
        
        dateCell.textContent = `${date} (${label})`;
        nameCell.textContent = name;
        azCell.textContent = az.toFixed(2) + '°';
        elCell.textContent = el.toFixed(2) + '°';
        rangeCell.textContent = range.toFixed(2) + ' km';
    }); 
}

//Beauty print the date string
function parseDateString(dateString) {
    console.log(dateString);

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
