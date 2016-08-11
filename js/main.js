;(function(){
    'use strict';
    var json = null,
        currentDate = new Date(),
        xhr = new XMLHttpRequest(),
        activeEvements = {},
        tableOfIssues,
        customers,
        taskTypes,
        submitForm,
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
        filterDateField = document.getElementById("filterDate"),
        rightForm = rightMenu.querySelector("form"),
        rightFormSubmitButton = rightMenu.querySelector("button"),
        popupContainer = document.querySelector(".popup-container"),
        confirmDelete = popupContainer.querySelector(".popup .continue"),
        abortDelete = popupContainer.querySelector(".popup .abort");
            
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
        tableOfIssues = new Table(tableTemplate, json.tableContent);
        customers = new Dropdown(dropdownCustomers, json.customers.sort(), "customer"); 
        taskTypes = new Dropdown(dropdownTaskTypes, json.taskTypes.sort(), "type");
        submitForm = new CheckForm(rightForm, rightFormSubmitButton, tableOfIssues);
    }
    
/********************** table constructor *************************/
    function Table(tableTemplate, tableData) {
        var tBody = document.createElement("tbody"),
            trCollection = tBody.rows,
            dummyTr = document.createElement("tr"),
            tr = document.createElement("tr"),
            dataContent,
            isTableChanged = false;
        this.lastId;
        
        dummyTr.innerHTML = tableTemplate;
        
/********************** table appending *************************/       
        this.fillTable = function(tableData) {
            for(var i = 0; i < tableData.length; i++) {
                tr = dummyTr.cloneNode(true);
                tr.setAttribute("data-id", tableData[i].id);
                var status,
                    dueDate = new Date(convertDate(tableData[i].dueDate)),
                    createdDate = new Date(convertDate(tableData[i].createdDate));
                status = checkStatus(currentDate, createdDate, dueDate);
                for(var j = 0; j < tr.cells.length; j++) {
                    dataContent = tr.cells[j].getAttribute("data-content");
                    if(tableData[i][dataContent]) {
                        tr.cells[j].innerText = tableData[i][dataContent];
                    }
                    if(dataContent == "status") {
                        tr.cells[j].innerText = status;
                    }
                }
                if(status == "overDue") tr.classList.add(status);
                tBody.appendChild(tr);
            }
            if(!this.lastId) this.lastId = tableData[i-1].id;
            table.appendChild(tBody);
            isTableChanged = true;
        };
        this.fillTable(tableData);
          
/********************** table sorting *************************/        
        function sortTable() {
            var lastTarget = null;
            return function(event){
                var th = event.target.parentElement;
                th = getParent(th, "TH");
                if(!th) return;
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
        function filterType() {
            var filteredTdOfTypes = getTdsOfTypes();
            isTableChanged = false;
            return function() {
                if (event.target.tagName != "INPUT") return;
                if (isTableChanged) filteredTdOfTypes = getTdsOfTypes();
                var target = event.target,
                    filterEntry = target.name.toLowerCase().replace("chkbox", "");
                for(var i = 0; i < filteredTdOfTypes.length; i++) {
                    if(filterEntry == filteredTdOfTypes[i].innerText.toLowerCase()) {
                        if(target.checked) {
                            filteredTdOfTypes[i].parentElement.hidden = false;
                        } else {
                            filteredTdOfTypes[i].parentElement.hidden = true;
                        }
                    }
                }
            }
        }
        
        function getTdsOfTypes() {
            var tdCollection = [];
            for(var i = 0; i < trCollection.length; i++) {
                var tr = trCollection[i];
                for(var j = 0; j < tr.cells.length; j++) {
                    if(tr.cells[j].getAttribute("data-content") == "type") {
                        tdCollection.push(tr.cells[j]);
                    }
                }
            }
            return tdCollection;
        }
        
/********************** table search *************************/         
        function search(event) {
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
        function filterDate(event) {
            var target = event.target,
                targetValue = target.value.toLowerCase().trim();
            if(!targetValue) {
                for(var i = 0; i < trCollection.length; i++) {
                    trCollection[i].hidden = false;
                }
            }
            if(!isDate(targetValue)) return;
            runFilter(targetValue, "data-type", "date");
        }
        
/********************** delete data *************************/         
        this.deleteProject = function(event) {
            var target = event.target,
                tr = target.parentElement,
                id = "";
            tr = getParent(tr, "TR");
            if(!tr) return;
            id = tr.getAttribute("data-id");
            for(var i = 0; i < tableData.length; i++) {
                if(tableData[i].id == id) {
                    tableData.splice(i, 1);
                    tBody.removeChild(tr);
                    break;
                }
            }
            isTableChanged = true;
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
        
        function checkStatus(currentDate, createdDate, dueDate) {
            var tempDate = new Date();
            if(currentDate > dueDate.setDate(dueDate.getDate()+1)) {
                return "overDue";
            }
            if(createdDate.setDate(createdDate.getDate()+3) >= currentDate) {
                return "new";
            }
            return "in-progress";
        }
        
        tBody.addEventListener("click", showPopup);
        tHead.addEventListener("click", sortTable());
        searchField.addEventListener("keyup", search);
        filters.addEventListener("change", filterType());
        filterDateField.addEventListener("change", filterDate);
        filterDateField.addEventListener("keyup", filterDate);
    }
/*********************** end table constructor *********************/    
    
/******************** custom dropdown constructor ******************/     
    function Dropdown(dropdownContainer, list, dataType) {
        Dropdown.elements.push(dropdownContainer);
        dropdownContainer.addEventListener("click", dropdownOpen());
        var clsName = dropdownContainer.getAttribute("data-element");
    
/********************** dropdown appending *************************/
        (function fillDropdown(){
            var ul = document.createElement("ul");
            ul.classList.add("dropdown-list");
            ul.classList.add("hidden");
            ul.setAttribute("data-type", dataType);
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
                submitForm.changeCount(event);
            }
        }
        
/*********************** close ***********************/ 
        Dropdown.resetDropdown = function(options) {
            options.dDown.classList.toggle("bordered-bottom");
            options.dDown.classList.toggle("dropdown-reverse");
            options.dList.classList.toggle("hidden");
            delete activeEvements[options.clsName];
        }
        
        Dropdown.resetValues = function() {
            var text;
            for(var i = 0; i < Dropdown.elements.length; i++) {
                text = Dropdown.elements[i].querySelector("span");
                text.innerText = text.getAttribute("data-initial");
            }
        }  
    }   
/********** end custom dropdown constructor **********/  
    
    Dropdown.elements = [];
    
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
    
    function CheckForm(form, button, table) {
        var elements = {},
            elementsCount = form.children.length - 1;
        this.changeCount = function(event) {
            var target = event.target,
                attr = target.getAttribute("data-type") || target.parentElement.getAttribute("data-type"),
                value = target.value || target.innerText;
            if(value) {
                if(~attr.toLocaleLowerCase().indexOf("date")) {
                    if(isDate(value)) {
                        elements[attr] = value;
                    }
                } else if(~attr.toLocaleLowerCase().indexOf("members")) {
                    if(isNaN(value) || value < 1) {
                        if(elements[attr]) delete elements[attr];
                        check();
                        alert("Only numeric and below 0"); 
                        return;
                    }
                    elements[attr] = value;
                } else {
                    elements[attr] = value;
                }
            } else {
                if(elements[attr]) delete elements[attr];
            }
            check();
        }
        
        function check() {
            if(Object.keys(elements).length == elementsCount) {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        }
        
        function submit(event) {
            event.preventDefault();
            elements.id = ++tableOfIssues.lastId;
            table.fillTable([elements]);
            elements = {};
            form.reset();
            Dropdown.resetValues();
            button.disabled = true;
        }
        
        for(var i = 0; i < elementsCount; i++) {
            if(form.children[i].tagName == "DIV") {
                continue;
            }
            form.children[i].addEventListener("keyup", this.changeCount);
            form.children[i].addEventListener("blur", this.changeCount);
        }
        button.addEventListener("click", submit)
    }
    
    function convertDate(date) {
        return date.split("-").reverse().join("-");
    }
    
    function isDate(date) {
        var reg = /(0[1-9]|[1-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-([0-9]{4})/;
        return reg.test(date);
    }
    
    function getParent(elem, tag){
        while(elem.tagName != tag) {
            elem = elem.parentElement;
            if(elem.tagName == "BODY") {
                return false;
            }
        }
        return elem;
    }
    
    function showPopup(event) {
        if(!~event.target.className.indexOf("delete-project")) return;
        event.stopPropagation();
        popupContainer.classList.toggle("show-popup-container");
        setOverflow(body, "hidden");
        abortDelete.onclick = closePopup;
        confirmDelete.onclick = deleteProjectConfirm(event);
    }
    
    function closePopup(event) {
        if(event) event.stopPropagation();
        popupContainer.classList.toggle("show-popup-container");
        setOverflow(body, "visible");
    }
    
    function setOverflow(elem, value) {
        elem.style.overflow = value;
    }
    
    function deleteProjectConfirm(ev) {
        return function(event) {
            event.stopPropagation;
            tableOfIssues.deleteProject(ev);
            closePopup(); 
        }
    }
    
    function resetActiveEvements() {
        rightForm.reset();
        Dropdown.resetValues();
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