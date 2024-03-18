const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#topMenuBar > ul > li').forEach(item => {
        item.addEventListener('mouseenter', function() {
            var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
            dropdownContent.style.display = "block";
        });
        item.addEventListener('mouseleave', function() {
            var dropdownContent = this.getElementsByClassName('dropdown-content')[0];
            dropdownContent.style.display = "none";
        });
    });

    document.getElementById('groundStationLink').addEventListener('click', function(event) {
      event.preventDefault();
      document.getElementById('groundStationModal').style.display = 'block';
    });

    document.getElementById('commandWindowLink').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('commandWindow').style.display = 'block';
    });

    document.getElementById('debugWindow').addEventListener('click', function(event) {
        event.preventDefault();
        ipcRenderer.send('open-devtools', 'devtools');
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

    // Initialize or update the Windows dropdown
    updateWindowsDropdown();
});
