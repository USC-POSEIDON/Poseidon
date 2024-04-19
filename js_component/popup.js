// Popup notification for search
function showPopupNotification(Message, type) {
    //console.log("Popping up");
    // Show the popup
    var popNotifcation = document.getElementById("popNotifcation");
    popNotifcation.style.backgroundColor = "#333";
    if(type === "error"){
        popNotifcation.style.backgroundColor = "#f44336";
    }
    popNotifcation.textContent = Message;
    popNotifcation.classList.add("show");
    setTimeout(function() {
        popNotifcation.style.opacity = "0"; // Change opacity
        setTimeout(function() {
            popNotifcation.classList.remove("show");
            popNotifcation.style.opacity = ""; // Reset opacity after transition
        }, 500); // Wait for the transition to complete (0.5s)
    }, 1500);
}