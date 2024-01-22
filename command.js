document.getElementById('sendButton').addEventListener('click', function() {
    var input = document.getElementById('chatInput');
    var message = input.value;
    input.value = '';

    if (message.trim() !== '') {
        var messagesDiv = document.getElementById('messages');
        var newMessage = document.createElement('div');
        newMessage.textContent = message;
        messagesDiv.appendChild(newMessage);
    }
});
