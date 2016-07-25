var currentDate = new Pikaday({
    field: document.getElementById('currentDate'),
    format: 'DD-MM-YYYY'
});

var dueDate = new Pikaday({
    field: document.getElementById('dueDate'),
    format: 'DD-MM-YYYY'
});

var createdDate = new Pikaday({
    field: document.getElementById('createdDate'),
    format: 'DD-MM-YYYY'
});