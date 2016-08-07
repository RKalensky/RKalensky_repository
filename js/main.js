;(function(){
    'use strict';
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
        filters = leftMenu.querySelectorAll(".filter-group input[type='checkbox']"),
        searchField = document.querySelector(".search-field"),
        filterDateField = document.getElementById("filterDate");
            
    var filterDate = new Pikaday({
        field: document.getElementById('filterDate'),
        format: 'DD-MM-YYYY'
    });

    var dueDate = new Pikaday({
        field: document.getElementById('dueDate'),
        format: 'DD-MM-YYYY',
        minDate: new Date()
    });

    var createdDate = new Pikaday({
        field: document.getElementById('createdDate'),
        format: 'DD-MM-YYYY',
        maxDate: new Date()
    });
    
    var tableTemplate = "\
        <tr>\
            <td data-content='projectName' data-type='string'></td>\
            <td class='separator'></td>\
            <td data-content='dueDate' data-type='date'></td>\
            <td data-content='createdDate' data-type='date'></td>\
            <td data-content='members' data-type='number'></td>\
            <td data-content='type' data-type='string'></td>\
            <td data-content='status' data-type='string'></td>\
            <td data-content='customer' data-type='string'></td>\
            <td><button class='delete-project'></button></td>\
        </tr>\
    ";
    
    body.addEventListener("click", resetActiveEvements);
    toggleMenu.addEventListener("click", leftMenuAction);
    addNewProject.addEventListener("click", rightMenuAction);
    rightMenu.addEventListener("click", rightMenuListener);

    for(var i = 0; i < dropdownContainer.length; i++){
        dropdownContainer[i].addEventListener("click", dropdownAction());
    }
    
    for(var i = 0; i < dropdownList.length; i++){
        dropdownList[i].addEventListener("click", selectItem());
    }
    
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
            searchField.addEventListener("keyup", tableOfIssues.search);
            filterDateField.addEventListener("change", tableOfIssues.filterDate);
            filterDateField.addEventListener("keyup", tableOfIssues.filterDate);
            for(var i = 0; i < filters.length; i++){
                filters[i].addEventListener("change", tableOfIssues.filterType());
            }
        }
    };
    
    function Table(table, tableData, tableTemplate) {
        var tBody = document.createElement("tbody"),
            trCollection = tBody.rows,
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
        
        this.filterType = function() {
            var filteredCells = [];
            for(var i = 0; i < trCollection.length; i++) {
                var tr = trCollection[i];
                for(var j = 0; j < tr.cells.length; j++) {
                    if(tr.cells[j].getAttribute("data-content") == "type") {
                        filteredCells.push(tr.cells[j]);
                    }
                }
            }
            
            return function(event) {
                var target = event.target,
                    filterEntry = target.name.toLowerCase().replace("chkbox", "");
                for(var i = 0; i < filteredCells.length; i++) {
                    if(filterEntry == filteredCells[i].innerText.toLowerCase()) {
                        if(target.checked) {
                            filteredCells[i].parentElement.hidden = false;
                        } else {
                            filteredCells[i].parentElement.hidden = true;
                        }
                    }
                }
            }
        }
        
        
        this.search = function() {
            var target = event.target,
                targetValue = target.value.toLowerCase().trim();

            if(!targetValue) {
                for(var i = 0; i < trCollection.length; i++) {
                    trCollection[i].hidden = false;
                }
            }
            
            filterRows(targetValue, "data-type", "string")
        }
        
        this.filterDate = function(event) {
            var target = event.target,
                targetValue = target.value.toLowerCase().trim(),
                reg = /^(0[1-9]|[1-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-([0-9]{4})$/;
            
            if(!targetValue) {
                for(var i = 0; i < trCollection.length; i++) {
                    trCollection[i].hidden = false;
                }
            }
            
            if(!reg.test(targetValue)) return;
            
            filterRows(targetValue, "data-type", "date");
        }
        
        function filterRows(targetValue, dataAttr, dataValue) {
            for(var i = 0; i < trCollection.length; i++) {
                var tr = trCollection[i],
                    isEqual = false;

                for(var j = 0; j < tr.cells.length; j++) {
                    var tdDataType = tr.cells[j].getAttribute(dataAttr),
                        innerText = tr.cells[j].innerText.toLowerCase();
                    if(~innerText.indexOf(targetValue) && tdDataType == dataValue) {
                        isEqual = true;
                        break;
                    }
                }
                if(!isEqual) {
                    tr.hidden = true;
                } else {
                    tr.hidden = false;
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

    function dropdownAction() {
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
            if(~o.toLowerCase().indexOf("dropdown")) {
                resetDropdown(activeEvements[o]);
            }
        }
    }
    
})();