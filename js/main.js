;(function(){
    'use strict';
    var json = null,
        currentDate = new Date(),
        xhr = new XMLHttpRequest(),
        activeEvements = {},
        tableOfIssues,
        customers,
        taskTypes,
        body = document.body,
        mainContent = document.querySelector(".main-content"),
        table = mainContent.querySelector("table"),
        tHead = table.querySelector("thead"),
        leftMenu = document.querySelector(".left-menu"),
        rightMenu = document.querySelector(".right-menu"),
        toggleMenu = document.querySelector(".toggle-menu"),
        addNewProject = document.querySelector(".add-new-project"),
        dropdownCustomers = document.querySelector(".dropdown-container[data-element='dropdownCustomer']"),
        dropdownTaskTypes = document.querySelector(".dropdown-container[data-element='dropdownType']"),
        filters = leftMenu.querySelector(".filter-group"),
        searchField = document.querySelector(".search-field"),
        filterDateField = document.getElementById("filterDate");
            
    var filterDate = new Pikaday({
        field: document.getElementById('filterDate'),
        format: 'DD-MM-YYYY'
    });

    var dueDate = new Pikaday({
        field: document.getElementById('dueDate'),
        format: 'DD-MM-YYYY',
        minDate: currentDate
    });

    var createdDate = new Pikaday({
        field: document.getElementById('createdDate'),
        format: 'DD-MM-YYYY',
        maxDate: currentDate,
        minDate: new Date(new Date().setDate(currentDate.getDate() - 2))
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
            writeDataDb(xhr.responseText);
        }
    };
    
    function writeDataDb(request) {
//        if(localStorage.getItem("tableContent")) {
//            tableOfIssues = new Table(localStorage.getItem("JSONDataDb"), tableTemplate);
//        } else {
//            json = JSON.parse(request);
//            localStorage.setItem("tableContent", request);
//            tableOfIssues = new Table(localStorage.getItem("tableContent"), tableTemplate);
        json = JSON.parse(request);
        tableOfIssues = new Table(json.tableContent, tableTemplate);
        customers = new Dropdown(dropdownCustomers, json.customers.sort()); 
        taskTypes = new Dropdown(dropdownTaskTypes, json.taskTypes.sort());
    }
    
/********************** table constructor *************************/
    function Table(tableData, tableTemplate) {
        var tBody = document.createElement("tbody"),
            trCollection = tBody.rows,
            dummyTr = document.createElement("tr"),
            tr = document.createElement("tr"),
            dataContent;
        
        dummyTr.innerHTML = tableTemplate;
        
/********************** table appending *************************/       
        (function fillTable(){
            for(var i = 0; i < tableData.length; i++) {
                tr = dummyTr.cloneNode(true);
                tr.setAttribute("data-id", tableData[i].id);
                var dueDate = new Date(convertDate(tableData[i].dueDate));
                
                for(var j = 0; j < tr.cells.length; j++) {
                    dataContent = tr.cells[j].getAttribute("data-content");
                    if(tableData[i][dataContent]) {
                        tr.cells[j].innerText = tableData[i][dataContent];
                    }
                }
                
                if(currentDate > dueDate.setDate(dueDate.getDate()+1)) {
                    tr.classList.add("overDue");
                }
                tBody.appendChild(tr);
            }
            table.appendChild(tBody);  
        })();
        
/********************** table sorting *************************/        
        this.sortTable = function() {
            var lastTarget = null;
            return function(event){
                var th = event.target.parentElement;
                
                while(th.tagName != "TH") {
                    th = th.parentElement;
                    if(th.tagName == "BODY") {
                        return;
                    }
                }
                
                var tBodyRows = Array.prototype.slice.call(tBody.rows),
                    targetType = th.getAttribute("data-type"),
                    cellIndex = th.cellIndex;
                
                if(lastTarget != th && lastTarget) {
                    lastTarget.className = "";
                }
                
                if(lastTarget == th) {
                    tBodyRows.reverse();
                    th.classList.toggle("sorting-ascending");
                    th.classList.toggle("sorting-descending");
                    appendTableData();
                    return;
                }
                
                if(th.getAttribute("data-sortable") == "no") {
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
                            var dateA = new Date(convertDate(rowA.cells[cellIndex].innerText));
                            var dateB = new Date(convertDate(rowB.cells[cellIndex].innerText));
                            return dateA - dateB;
                        };
                        break;
                    }    
                }
                tBodyRows.sort(compare);
                th.classList.toggle("sorting-ascending");
                lastTarget = th;
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
        
/********************** filtering by type *************************/        
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
                if (event.target.tagName != "INPUT") return;
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
        
/********************** table search *************************/         
        this.search = function(event) {
            var target = event.target,
                targetValue = target.value.toLowerCase().trim();

            if(!targetValue) {
                for(var i = 0; i < trCollection.length; i++) {
                    trCollection[i].hidden = false;
                }
            }
            
            runFilter(targetValue, "data-type", "string");
        }
 
/********************** date filtering *************************/ 
        this.filterDate = function(event) {
            debugger;
            var target = event.target,
                targetValue = target.value.toLowerCase().trim(),
                reg = /(0[1-9]|[1-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-([0-9]{4})/;
            
            if(!targetValue) {
                for(var i = 0; i < trCollection.length; i++) {
                    trCollection[i].hidden = false;
                }
            }
            
            if(!reg.test(targetValue)) return;
            
            runFilter(targetValue, "data-type", "date");
        }
        
/********************** delete data *************************/         
        this.deleteProject = function(event) {
            if(!~event.target.className.indexOf("delete-project")) return;
            var target = event.target,
                tr = target.parentElement,
                id = "";
            
            while(tr.tagName != "TR") {
                tr = tr.parentElement;
                if(tr.tagName == "BODY") {
                    return;
                }
            }
            
            id = tr.getAttribute("data-id");
            
            for(var i = 0; i < tableData.length; i++) {
                if(tableData[i].id == id) {
                    tableData.splice(i, 1);
                    tBody.removeChild(tr);
                    break;
                }
            }
        }

/********************** filtering function ************************/ 
        function runFilter(targetValue, dataAttr, dataValue) {
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
        
        tBody.addEventListener("click", this.deleteProject);
        tHead.addEventListener("click", this.sortTable());
        searchField.addEventListener("keyup", this.search);
        filters.addEventListener("change", this.filterType());
        filterDateField.addEventListener("change", this.filterDate);
        filterDateField.addEventListener("keyup", this.filterDate);
    }
/*********************** end table constructor *********************/    
    
/******************** custom dropdown constructor ******************/     
    function Dropdown(dropdownContainer, list){
        dropdownContainer.addEventListener("click", dropdownOpen());
        var clsName = dropdownContainer.getAttribute("data-element");
    
/********************** dropdown appending *************************/
        (function fillDropdown(){
            var ul = document.createElement("ul");
            ul.classList.add("dropdown-list", "hidden");
            var li = document.createElement("li");
            var dummyLi;
            
            for(var i = 0; i < list.length; i++) {
                dummyLi = li.cloneNode(true);
                dummyLi.innerText = list[i];
                ul.appendChild(dummyLi);
            }
            
            dropdownContainer.appendChild(ul);
            ul.addEventListener("click", selectItem());
        })();
        
/************************* open dropdown *************************/     
        function dropdownOpen() {
            var o = {};
            return function(event) {
                event.stopPropagation();
                if(!activeEvements[clsName]) {
                    o = activeEvements[clsName] = {};
                    o.clsName = clsName;
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
                
                Dropdown.resetDropdown(o);
                o = {};
            };
        }
        
/******************** select item ********************/ 
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
                Dropdown.resetDropdown(o);
            }
        }
        
/*********************** close ***********************/ 
        Dropdown.resetDropdown = function(options) {
            options.dDown.classList.toggle("bordered-bottom");
            options.dDown.classList.toggle("dropdown-reverse");
            options.dList.classList.toggle("hidden");
            delete activeEvements[options.clsName];
        }
        
    }   
/********** end custom dropdown constructor **********/   
    
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
    
    function rightMenuListener(event) {
        event.stopPropagation();
        
        for(var o in activeEvements) {
            if(~o.toLowerCase().indexOf("dropdown")) {
                Dropdown.resetDropdown(activeEvements[o]);
            }
        }
    }
    
    function hideMenu(options) {
        options.elem.classList.toggle("hide-right-menu");
        delete activeEvements[options.clsName];
    }
    
    function convertDate(date){
        return date.split("-").reverse().join("-");
    }
    
    function resetActiveEvements() {
        for(var o in activeEvements) {
            if(~o.toLowerCase().indexOf("menu")) {
                hideMenu(activeEvements[o]);
            }
            if(~o.toLowerCase().indexOf("dropdown")) {
                Dropdown.resetDropdown(activeEvements[o]);
            }
        }
    }
    
})();