const connection = require("./Connection");
const inquirer = require("inquirer");

var queryString = "";

var lineBreak = "";

for(i = 0; i < 100; i++) {
    lineBreak += "-";
}

process.stdout.write('\x1B[2J\x1B[0f');
console.log("===========================");
console.log("Welcome to Bamazon Shopping")
console.log("===========================");

shopBamazon();

function shopBamazon() {

    var tempProduct;
    queryString = "SELECT * FROM products";

    connection.query(queryString, function(error, response) {

        if(error) throw error;

        displayProducts(response);

        console.log("What would you like to buy?");

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

                process.stdout.write('\x1B[2J\x1B[0f');
                console.log(lineBreak);
                console.log("Invalid input.  Try Again.");
                console.log(lineBreak);
                shopBamazon();
            }

            else {

                inquirer.prompt([
                    {
                        message: "How many would you like to buy?",
                        type: "input",
                        name: "quantity"
                    }     
                ]).then(function(answers){

                    if(!parseInt(answers.quantity)) {

                        process.stdout.write('\x1B[2J\x1B[0f');
                        console.log("====================");
                        console.log("Error: Invalid Input");
                        console.log("====================");
                        shopBamazon();
                    }

                    // check to see if there's sufficient quantity for order
                    else if(tempProduct.stock_quantity < answers.quantity) {

                        process.stdout.write('\x1B[2J\x1B[0f');
                        console.log("/======================");
                        console.log("Insufficient quantity!");
                        console.log("======================");
                        shopBamazon();
                    }
                
                    else {

                        // update item in database
                        queryString = "UPDATE products SET stock_quantity = stock_quantity - " +
                                            answers.quantity + " WHERE id=" + tempProduct.id.toString();

                        var totalSale = (parseInt(answers.quantity) * tempProduct.price);
                        connection.query(queryString, function(error, response) {

                            console.log(lineBreak);
                            console.log("Item purchased: " + answers.quantity + " " + tempProduct.product_name);
                            console.log("Total price: $" + totalSale.toFixed(2));
                            console.log(lineBreak);

                            
                            queryString = "UPDATE products SET product_sales = product_sales + " +
                            totalSale.toFixed() + " WHERE id=" + tempProduct.id.toString();

                            connection.query(queryString, function(error, response) {

                                if(error) console.log(error);
                                
                                continuePrompt();
                            });
                        });
                    }
                });             
            }
        });
    });
}

function displayProducts(response) {
    
   
    var displayNames = [];
    var displayDepartments = [];
    var displayPrices = [];

    console.log("\n ID | Item Name                                | Department           | Price" +
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
        while(displayDepartments[i].length < 20) {
            displayDepartments[i] += " ";
        }
        // add space to product_name for display
        while(displayPrices[i].length < 10) {
            displayPrices[i] += " ";
        }

        // add a space before display for single digit IDs
        if(i < 9) {
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

function continuePrompt() {
    
    inquirer.prompt([
        {
            message: "Continue shopping?",
            type: "list",
            choices: ["yes", "no"],
            name: "again"
        }
    ]).then(function(answers) {
    
        if(answers.again.toLowerCase() === "yes") {

            process.stdout.write('\x1B[2J\x1B[0f');
            shopBamazon();
        }

        else {

            console.log("Thank you for shopping at Bamazon! Goodbye.");
            connection.end();
        }
    });
}