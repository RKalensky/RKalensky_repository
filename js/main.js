;(function(){
    
    var json = null,
        xhr = new XMLHttpRequest(),
        tableOfIssues,
        mainContent = document.querySelector(".main-content"),
        table = mainContent.querySelector("table"),
        tHead = table.querySelector("thead");
            
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
    
    var tableTemplate = "\
        <tr>\
            <td data-content='projectName'></td>\
            <td class='separator'></td>\
            <td data-content='dueDate'></td>\
            <td data-content='createdDate'></td>\
            <td data-content='members'></td>\
            <td data-content='type'></td>\
            <td data-content='status'></td>\
            <td data-content='customer'></td>\
            <td><button class='delete-project'></button></td>\
        </tr>\
    ";
    
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
            tableOfIssues = new Table(table, json.tableContent, tableTemplate);
        }
    };
    
    getDataDb("GET", "/src/JSONData.json", true);
    
    function Table(table, tableData, tableTemplate) {
        var tBody = document.createElement("tbody"),
            dummyTr = document.createElement("tr"),
            tr = document.createElement("tr"),
            dataContent;
        
        dummyTr.innerHTML = tableTemplate;
        
        (function fillTable(){
            for(var i = 0; i < tableData.length; i++) {
                tr = dummyTr.cloneNode(true);
                
                for(var j = 0; j < tr.cells.length; j++) {
                    dataContent = tr.cells[j].getAttribute("data-content");
                    if(tableData[i][dataContent]) {
                        tr.cells[j].innerText = tableData[i][dataContent];
                    }
                }
                tBody.appendChild(tr);
            }
            table.appendChild(tBody);  
        })();
    }
    
})();