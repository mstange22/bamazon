const connection = require("./Connection");
const inquirer = require("inquirer");

var queryURL = "";
var tempProduct;

var lineBreak = "";

for(i = 0; i < 90; i++) {
    lineBreak += "-";
}

shopBamazon();

function shopBamazon() {

    queryURL = "SELECT * FROM products";

    connection.query(queryURL, function(error, response) {

        if(error) throw error;

        displayProducts(response);

        var choiceArray = [];
        
        for(i = 0; i < response.length; i++) {

            choiceArray.push(response[i].id.toString());
        }
            
        inquirer.prompt([
            {
                message: "Which item would you like to buy?",
                type: "list",
                choices: choiceArray,
                name: "productID"
            },    
            {
                message: "How many would you like to buy?",
                type: "input",
                name: "quantity"
            }     
        ]).then(function(answers){

            for(i = 0; i < response.length; i++) {

                if(parseInt(answers.productID) === response[i].id) {
                    tempProduct = response[i];
                    break;
                }
            }

            // check to see if there's sufficient quantity for order
            if(tempProduct.stock_quantity < answers.quantity) {

                console.log("Insufficient quantity!");
                shopBamazon();
            }
            
            else {

                // update item in database
                queryURL = "UPDATE products SET stock_quantity = stock_quantity - " +
                                    answers.quantity + " WHERE id=" + tempProduct.id.toString();

                connection.query(queryURL, function(error, response) {

                    console.log(lineBreak);
                    console.log("Item purchased: " + answers.quantity + " " + tempProduct.product_name);
                    console.log("Total price: $" + (parseInt(answers.quantity) * tempProduct.price).toFixed(2));
                    console.log(lineBreak);

                    continuePrompt();
                });
            }
        });
    });
}

function displayProducts(response) {
    
   
    var displayNames = [];
    var displayDepartments = [];
    var displayPrices = [];

    console.log("\n ID | Item Name                                | Department      | Price" +
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
        while(displayDepartments[i].length < 15) {
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
            message: "Again?",
            type: "list",
            choices: ["yes", "no"],
            name: "again"
        }
    ]).then(function(answers) {
    
        if(answers.again.toLowerCase() === "yes") {

            shopBamazon();
        }

        else {

            console.log("Thank you for playing. Goodbye.");
            connection.end();
        }
    });
}