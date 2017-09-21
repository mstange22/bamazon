const connection = require("./Connection");
const inquirer = require("inquirer");

var queryString = "";
var lineBreak = "";

for(i = 0; i < 80; i++) {
    lineBreak += "-";
}

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

            queryString = "SELECT departments.department_id, products.department_name, " +
                            "departments.overhead_costs, SUM(product_sales) AS 'sales_per_department' " +
                            "FROM products INNER JOIN departments ON departments.department_name = " +
                            "products.department_name GROUP BY departments.department_id";
            
            connection.query(queryString, function(error, response) {
        
                if(error) throw error;
                
                displaySalesByDepartment(response);
                manageBamazon();
            });
        }

        else if(answers.action === "Create New Department") {

            inquirer.prompt([
                {
                    message: "Enter new department name",
                    name: "newDepartmentName"
                },
                {
                    message: "Enter overhead percentage (decimal between 0 & 1)",
                    name: "newOverhead"
                }  
            ]).then(function(answers){

                addDepartment(answers);
            });
        }

        // quit
        else {
            connection.end();
        }
    });
}

function addDepartment(answers) {

    queryString = "INSERT into departments (department_name, overhead_costs) " +
                  "VALUES ('" + answers.newDepartmentName + "', '" + answers.newOverhead + "')";

    connection.query(queryString, function(error, result) {

        if(!error) {
            console.log("Department added: " + answers.newDepartmentName +
                        " @ " + (parseFloat(answers.newOverhead) * 100).toString() + "% overhead");        
        }

        manageBamazon();
    });
}

function displaySalesByDepartment(response) {

    var displayDepartments = [];
    var displayOverhead = [];
    var displaySales = [];
    var displayProfit = [];

    console.log("\n ID | Department Name           | Overhead    | Product Sales | Total Profit");
    console.log(lineBreak);

    for(var i = 0; i < response.length; i++) {

        var profit = response[i].sales_per_department -
                            (response[i].sales_per_department * response[i].overhead_costs);

        displayDepartments.push(response[i].department_name);
        displayOverhead.push((response[i].overhead_costs * response[i].sales_per_department).toFixed(2).toString());
        displaySales.push(response[i].sales_per_department.toFixed(2).toString());
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