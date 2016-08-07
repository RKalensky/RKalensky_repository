;(function(){
    
    var json = null,
        xhr = new XMLHttpRequest(),
        activeEvements = {},
        tableOfIssues,
        body = document.body,
        mainContent = document.querySelector(".main-content"),
        table = mainContent.querySelector("table"),
        tHead = table.querySelector("thead"),
        leftMenu = document.querySelector(".left-menu"),
        rightMenu = document.querySelector(".right-menu"),
        toggleMenu = document.querySelector(".toggle-menu"),
        addNewProject = document.querySelector(".add-new-project"),
        dropdownContainer = document.querySelectorAll(".dropdown-container"),
        dropdownList = document.querySelectorAll(".dropdown-list"),
        filters = leftMenu.querySelectorAll(".filter-group input[type='checkbox']");
            
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
    
    body.addEventListener("click", resetActiveEvements);
    toggleMenu.addEventListener("click", leftMenuAction);
    addNewProject.addEventListener("click", rightMenuAction);
    rightMenu.addEventListener("click", rightMenuListener);
    addGroupEventListeners(dropdownContainer, "click", dropdownAction());
    addGroupEventListeners(dropdownList, "click", selectItem());
    addGroupEventListeners(filters, "change", function(){console.log("!")});
    
    
    getDataDb("GET", "/src/JSONData.json", true);
    
    function getDataDb(method, src, async) {
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
            tHead.addEventListener("click", tableOfIssues.sortTable());
        }
    };
    
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
        
        this.sortTable = function() {
            var lastTarget = null;
            return function(event){
                
                var curTarget = event.target.parentElement;
                
                while(curTarget.tagName != "TH") {
                    curTarget = curTarget.parentElement;
                    if(curTarget.tagName == "BODY") {
                        return;
                    }
                }
                
                var tBodyRows = Array.prototype.slice.call(tBody.rows),
                    targetType = curTarget.getAttribute("data-type"),
                    cellIndex = curTarget.cellIndex;
                
                if(lastTarget == curTarget) {
                    tBodyRows.reverse();
                    appendTableData();
                    return;
                }
                
                if(curTarget.getAttribute("data-sortable") == "no") {
                    return; 
                }
                
                switch(targetType) {
                    case "number" : {
                        var compare = function(rowA, rowB) {
                            var cellA = rowA.cells[cellIndex].innerText;
                            var cellB = rowB.cells[cellIndex].innerText;
                            return cellA - cellB;
                        };
                        break;
                    }   
                    case "string" : {  
                        var compare = function(rowA, rowB) {
                            var cellA = rowA.cells[cellIndex].innerText.toLocaleLowerCase();
                            var cellB = rowB.cells[cellIndex].innerText.toLocaleLowerCase();
                            return cellA > cellB ? 1 : -1;
                        };
                        break;
                    }  
                    case "date" : {
                        var compare = function(rowA, rowB) {
                            var dateA = new Date(rowA.cells[cellIndex].innerText.split("-").reverse().join("."));
                            var dateB = new Date(rowB.cells[cellIndex].innerText.split("-").reverse().join("."));
                            return dateA - dateB;
                        };
                        break;
                    }    
                }
                tBodyRows.sort(compare);
                lastTarget = curTarget;
                appendTableData();
                
                function appendTableData(){
                    table.removeChild(tBody);

                    for (var i = 0; i < tBodyRows.length; i++) {
                        tBody.appendChild(tBodyRows[i]);
                    }

                    table.appendChild(tBody);
                }
            }
        }
    }
    
    function leftMenuAction(event) {
        leftMenu.classList.toggle("hide-left-menu");
        mainContent.classList.toggle("main-content-full-width");
        tHead.classList.toggle("thead-full-width");
    }

    function rightMenuAction(event) {
        event.stopPropagation();
        var dataName = rightMenu.getAttribute("data-element");
        activeEvements[dataName] = {
            elem: rightMenu,
            isVisible: true, 
            clsName: dataName
        };
        rightMenu.classList.toggle("hide-right-menu");
    }
    
    function rightMenuListener(event){
        event.stopPropagation();
        
        for(var o in activeEvements) {
            if(~o.toLowerCase().indexOf("dropdown")) {
                resetDropdown(activeEvements[o]);
            }
        }
    }
    
    function hideMenu(options) {
        options.elem.classList.toggle("hide-right-menu");
        delete activeEvements[options.clsName];
    }

    function dropdownAction(event) {
        var o = {};
        
        return function(event) {
            event.stopPropagation();
            
            if(!activeEvements[o.clsName]) {
                o = activeEvements[this.getAttribute("data-element")] = {}
                o.clsName = this.getAttribute("data-element");
                o.context = this;
                o.dList = this.querySelector(".dropdown-list");
                o.dDown = this.querySelector(".dropdown");
                o.isVisible = false;
            }
            
            if(!o.isVisible) {
                o.dList.classList.toggle("hidden");
                o.dDown.classList.toggle("bordered-bottom");
                o.dDown.classList.toggle("dropdown-reverse");
                o.isVisible = true;
                return;
            }
            
            resetDropdown(o);
            o = {};
        };
    }

    function selectItem() {
        var o = {};
        
        return function(event) {
            event.stopPropagation();
            
            if (!Object.keys(o).length) {
                o.clsName = this.parentElement.getAttribute("data-element");
                o.dList = this;
                o.dDown = this.parentElement.querySelector(".dropdown");
                o.dValue = this.parentElement.querySelector(".dropdown-value");
            }

            var target = event.target;
            o.dValue.innerText = target.innerText;
            resetDropdown(o);
        }
    }

    function resetDropdown(options) {
        options.dDown.classList.toggle("bordered-bottom");
        options.dDown.classList.toggle("dropdown-reverse");
        options.dList.classList.toggle("hidden");
        delete activeEvements[options.clsName];
    }
    
    function resetActiveEvements() {
        for(var o in activeEvements) {
            if(~o.toLowerCase().indexOf("menu")) {
                hideMenu(activeEvements[o]);
            }
        }
    }
    
    function addGroupEventListeners(elements, event, listener) {
        for(var i = 0; i < elements.length; i++){
            elements[i].addEventListener(event, listener);
        }
    }
  
})();