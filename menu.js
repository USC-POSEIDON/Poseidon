document.querySelectorAll('#topMenuBar > ul > li').forEach(function(menuItem) {
    menuItem.addEventListener('mouseover', function() {
        this.children[1].style.display = 'block'; // Show dropdown
    });
    menuItem.addEventListener('mouseout', function() {
        this.children[1].style.display = 'none'; // Hide dropdown
    });
});
