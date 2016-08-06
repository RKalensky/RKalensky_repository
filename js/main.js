;(function(){
    
    var json = null,
        xhr = new XMLHttpRequest();
            
    var filterDate = new Pikaday({
        field: document.getElementById('filterDate'),
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
    
    function getDataDb(method, src, async) {
        debugger;
        xhr.open(method, src, async);
        xhr.send();
        xhr.onreadystatechange = function() {
            if(this.readyState != 4) return;
            if(this.status != 200) {
                alert( 'ошибка: ' + (this.status ? this.statusText : 'запрос не удался') );
                return;
            }
            json = JSON.parse(xhr.responseText);
        }
    };
    
    getDataDb("GET", "/src/JSONData.json", true);
    
})();