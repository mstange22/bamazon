const connection = require("./Connection");
const inquirer = require("inquirer");

var queryString = "";
var lineBreak = "";

for(i = 0; i < 80; i++) {
    lineBreak += "-";
}


process.stdout.write('\x1B[2J\x1B[0f');
console.log("=========================================");
console.log("Welcome to the Bamazon Supervisor Utility");
console.log("=========================================");
manageBamazon();

function manageBamazon() {


    var choiceArray = ["View Product Sales by Department", "Create New Department", "Quit"];
                
    inquirer.prompt([
        {
            message: "Select an option",
            type: "list",
            choices: choiceArray,
            name: "action"
        }  
    ]).then(function(answers){

        if(answers.action === "View Product Sales by Department") {

            viewProductSalesByDepartment();
        }

        else if(answers.action === "Create New Department") {

            createNewDepartment();
        }

        // quit
        else {
            connection.end();
        }
    });
}

function viewProductSalesByDepartment() {

    queryString = "SELECT departments.department_id, departments.department_name, " +
    "departments.overhead_costs, SUM(product_sales) AS 'sales_per_department' " +
    "FROM departments LEFT JOIN products ON departments.department_name = " +
    "products.department_name GROUP BY departments.department_id";
    
    connection.query(queryString, function(error, response) {
    
        if(error) throw error;
        
        displaySalesByDepartment(response);
        manageBamazon();
    });
}

function createNewDepartment() {

    inquirer.prompt([
        {
            message: "Enter new department name",
            name: "newDepartmentName"
        }
    ]).then(function(newDepartment){

        // check to see if department exists before continuing
        connection.query("SELECT * FROM departments", function(error, results) {

            var departmentExistsflag = false;
            
            for(var i = 0; i < results.length && !departmentExistsflag; i++) {
    
                if(results[i].department_name === newDepartment.newDepartmentName) {
    
                    console.log("================================");
                    console.log("Error: Department already exists");
                    console.log("================================");
                    departmentExistsflag = true;
                }
            }
    
            if(departmentExistsflag) {
    
                createNewDepartment();
            }
    
            else {
                getNewDepartmentOverhead(newDepartment);
            }

        });
    });
}

function getNewDepartmentOverhead(newDepartment) {
    
    inquirer.prompt([
        {
            message: "Enter overhead percentage (decimal between 0 & 1)",
            name: "overhead"
        }
        ]).then(function(newOverhead){
    
            // check to see if overhead is a valid decimal value
            if(parseFloat(newOverhead.overhead) < 0 || parseFloat(newOverhead.overhead) > 1) {

                console.log("==============================");
                console.log("Error: Invalid overhead amount");
                console.log("==============================");
                getNewDepartmentOverhead(newDepartment);
            }
            
            else {

                addDepartment(newDepartment, newOverhead);
            }
        });
}

function addDepartment(answers1, answers2) {

    queryString = "INSERT into departments (department_name, overhead_costs) " +
                  "VALUES ('" + answers1.newDepartmentName + "', '" + answers2.overhead + "')";
    
    var messageString;
    var addLineBreak = ""
    
    connection.query(queryString, function(error, result) {

        if(!error) {
            
            messageString = "Department added: " + answers1.newDepartmentName +
                        " @ " + (parseFloat(answers2.overhead) * 100).toString() + "% overhead";

            for(var i = 0; i < messageString.length; i++) {

                addLineBreak += "=";
            }

            console.log("\n" + addLineBreak);
            console.log(messageString);
            console.log(addLineBreak);        
        }

        manageBamazon();
    });
}

function displaySalesByDepartment(response) {

    var displayDepartments = [];
    var displayOverhead = [];
    var displaySales = [];
    var displayProfit = [];

    
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log("\n ID | Department Name           | Overhead    | Product Sales | Total Profit");
    console.log(lineBreak);

    for(var i = 0; i < response.length; i++) {

        var profit = response[i].sales_per_department -
                            (response[i].sales_per_department * response[i].overhead_costs);

        displayDepartments.push(response[i].department_name);
        displayOverhead.push((response[i].overhead_costs * response[i].sales_per_department).toFixed(2).toString());

        // handle null entries in products.product_sales
        if(response[i].sales_per_department) {

            displaySales.push(response[i].sales_per_department.toFixed(2).toString());
        }

        else {
            displaySales.push("0");
        }

        displayProfit.push(profit.toFixed(2).toString());
        
        // add space to department name for display
        while(displayDepartments[i].length < 25) {
            displayDepartments[i] += " ";
        }
        
        // overhead
        while(displayOverhead[i].length < 10) {
            displayOverhead[i] += " ";
        }

        // product sales
        while(displaySales[i].length < 12) {
            displaySales[i] += " ";
        }

        if(response[i].department_id < 10) {
            console.log("  " + response[i].department_id + " | " + displayDepartments[i] + " | $" +
            displayOverhead[i] + " | $" + displaySales[i] + " | $" +
            displayProfit[i]);
        }
        else {
            console.log(" " + response[i].department_id + " | " + displayDepartments[i] + " | $" +
            displayOverhead[i] + " | $" + displaySales[i] + " | $" +
            displayProfit[i]);
        }

    }

    console.log(lineBreak);
}