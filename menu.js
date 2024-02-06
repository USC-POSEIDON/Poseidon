document.querySelectorAll('#topMenuBar > ul > li').forEach(item => {
    item.addEventListener('click', function() {
        var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
        if (dropdownContent.style.display === "block") {
            dropdownContent.style.display = "none";
        } else {
            // Hide any already open dropdowns
            var openDropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < openDropdowns.length; i++) {
                openDropdowns[i].style.display = "none";
            }
            // Show the clicked dropdown
            dropdownContent.style.display = "block";
        }
    });
});

// Optional: Click outside to close
window.onclick = function(event) {
  if (!event.target.matches('#topMenuBar > ul > li')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.style.display === "block") {
        openDropdown.style.display = "none";
      }
    }
  }
};
