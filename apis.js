function getNameSearchResults(){
    var name = document.getElementById('satelliteSearchInput').value;

    var type = document.getElementById("presetDropdown").value;
    var formData = new FormData();
    formData.append('listname', type);

    fetch(`http://127.0.0.1:5000//satellites/post/catnr/${name}`, {
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
    // Handle the response data here
    console.log(responseData);
    })
    .catch(function (error) {
    // Handle errors here
    console.log(error);
    });

    // Get names
    
    // fetch(`http://127.0.0.1:5000/satellites/get/names/${name}`)
    // .then(function (response) {
    //     if (!response.ok) {
    //     throw new Error("HTTP error, status = " + response.status);
    //     }
    //     return response.text();
    // })
    // .then(function (data) {
    //     // Handle the data here
    //     alert("get" + data);
    // })
    // .catch(function (error) {
    //     // Handle errors here
    //     alert(error);
    // });

}