const connection = require("./Connection");
const inquirer = require("inquirer");

var queryString = "";

var lineBreak = "";

for(i = 0; i < 100; i++) {
    lineBreak += "-";
}

console.log("======================================");
console.log("Welcome to the Bamazon Management Tool\n");
console.log("======================================");

manageBamazon();

function manageBamazon() {


    var choiceArray = ["View Products for Sale", "View Low Inventory", "Add to Inventory",
                        "Add New Product", "Quit"];
                
    inquirer.prompt([
        {
            message: "Select an option",
            type: "list",
            choices: choiceArray,
            name: "action"
        }  
    ]).then(function(answers){

        if(answers.action === "View Products for Sale") {

            queryString = "SELECT * FROM products";
            
                connection.query(queryString, function(error, response) {
            
                    if(error) throw error;
                    
                    displayProducts(response);
                    manageBamazon();
            });
        }

        else if(answers.action === "View Low Inventory") {

            queryString = "SELECT * FROM products WHERE stock_quantity < 5";
            
            connection.query(queryString, function(error, response) {

                if(error) throw error;
            
                displayProducts(response);
                manageBamazon();
            });
        }

        else if(answers.action === "Add to Inventory") {

            addToInventory();
        }

        else if(answers.action === "Add New Product") {

            addNewProduct();
        }

        // quit
        else {
            connection.end();
        }
    });
}

function displayProducts(response) {

    var displayNames = [];
    var displayDepartments = [];
    var displayPrices = [];

    console.log("\n ID | Item Name                                | Department                | Price" +
                                                    "       | Stock");
    console.log(lineBreak);

    for(var i = 0; i < response.length; i++) {

        displayNames.push(response[i].product_name);
        displayDepartments.push(response[i].department_name);
        displayPrices.push(response[i].price.toFixed(2).toString());

        // add space to product_name for display
        while(displayNames[i].length < 40) {
            displayNames[i] += " ";
        }
        // add space to product_name for display
        while(displayDepartments[i].length < 25) {
            displayDepartments[i] += " ";
        }
        // add space to product_name for display
        while(displayPrices[i].length < 10) {
            displayPrices[i] += " ";
        }

        // add a space before display for single digit IDs
        if(response[i].id < 10) {
            console.log("  " + response[i].id + " | " + displayNames[i] + " | " +
                            displayDepartments[i] + " | $" + displayPrices[i] +
                             " | " + response[i].stock_quantity);
        } else {
            console.log(" " + response[i].id + " | " + displayNames[i] + " | " +
                            displayDepartments[i] + " | $" + displayPrices[i] +
                            " | " + response[i].stock_quantity);
        }
    }

    console.log(lineBreak);
}

function addToInventory() {
    
    var tempProduct;
    queryString = "SELECT * FROM products";

    connection.query(queryString, function(error, response) {

        displayProducts(response);

        console.log("Add inventory:")

        inquirer.prompt([
            {
                message: "Select an item by ID (q to quit)",
                name: "updateID"
            }
        ]).then(function(answer1) {

            if(answer1.updateID.toLowerCase() === "q") {

                connection.end();
                return;
            }

            // loop through response array, searching for a match on ID
            for(i = 0; i < response.length; i++) {

                if(response[i].id === parseInt(answer1.updateID)) {

                    tempProduct = response[i];
                    break;
                }
            }

            // if tempProduct was not assigned, invalid input
            if(!tempProduct) {

                console.log(lineBreak);
                console.log("Invalid input.  Try Again.");
                console.log(lineBreak);
                addToInventory();
            }

            else {
                inquirer.prompt([
                {
                    message: "Enter quantity to add",
                    type: "input",
                    name: "updateQuantity"
                }
                ]).then(function(answer2) {

                    if(!parseInt(answer2.updateQuantity)) {

                        console.log(lineBreak);
                        console.log("Invalid input.  Try Again.");
                        console.log(lineBreak);
                        addToInventory();
                    }

                    else {

                        queryString = "UPDATE products SET stock_quantity = stock_quantity + " +
                        parseInt(answer2.updateQuantity) + " WHERE id = " + answer1.updateID;

                        connection.query(queryString, function() {

                            console.log(lineBreak);
                            console.log("Added Inventory: " + answer2.updateQuantity + " - " +
                                                                    tempProduct.product_name);
                            console.log(lineBreak);
                            manageBamazon();
                        });
                    }
                });
            }
        });
    });
}

function addNewProduct() {
    inquirer.prompt([
        {
            message: "Enter product name",
            name: "newProductName"
        },
        {
            message: "Enter department",
            name: "newProductDepartment"
        },
        {
            message: "Enter price",
            name: "newProductPrice"
        },
        {
            message: "Enter stock quantity",
            name: "newProductStockQuantity"
        }
    ]).then(function(answers) {

        connection.query("INSERT INTO products SET ?",
        {
            product_name: answers.newProductName,
            department_name: answers.newProductDepartment,
            price: parseFloat(answers.newProductPrice),
            stock_quantity: parseInt(answers.newProductStockQuantity)
        },
        function(error, response) {

            if(error) console.log(error);

            console.log(lineBreak);
            console.log("Product inserted: " + answers.newProductStockQuantity + " - " + answers.newProductName + " (" +
                                                answers.newProductDepartment + ") @ $" + answers.newProductPrice);
            console.log(lineBreak);
            manageBamazon();
        });
    });
}