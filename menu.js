const { ipcRenderer } = require('electron');

document.querySelectorAll('#topMenuBar > ul > li').forEach(item => {
  item.addEventListener('click', function() {
      var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
      if (dropdownContent.style.display === "block") {
          dropdownContent.style.display = "none";
      } else {
          var openDropdowns = document.getElementsByClassName("dropdown-content");
          for (var i = 0; i < openDropdowns.length; i++) {
              openDropdowns[i].style.display = "none";
          }
          // Show the clicked dropdown
          dropdownContent.style.display = "block";
      }
  });
});


document.getElementById('groundStationLink').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('groundStationModal').style.display = 'block';
});

document.getElementById('debugWindow').addEventListener('click', function(event) {
    event.preventDefault();
    ipcRenderer.send('open-devtools', 'please');
  });

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
  if (event.target == document.getElementById('groundStationModal')) {
      document.getElementById('groundStationModal').style.display = "none";
  }
};

