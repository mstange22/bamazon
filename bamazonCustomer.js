const inquirer = require('inquirer');
const mysql = require('mysql');

console.log('here?');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'dthera22sql',
  database: 'dthera_test',
});

let queryString = '';
let lineBreak = '';

for (let i = 0; i < 100; i += 1) {
  lineBreak += '-';
}

process.stdout.write('\x1B[2J\x1B[0f');
console.log('===========================');
console.log('Welcome to Bamazon Shopping');
console.log('===========================');

shopBamazon();

function shopBamazon() {
  let tempProduct;
  queryString = 'SELECT * FROM products';

  connection.query(queryString, (error, response) => {
    if (error) throw error;
    displayProducts(response);

    console.log('What would you like to buy?');

    inquirer.prompt([{
      message: 'Select an item by ID (q to quit)',
      name: 'updateID',
    }])
      .then((answer1) => {
        if (answer1.updateID.toLowerCase() === 'q') {
          connection.end();
          return;
        }

        // loop through response array, searching for a match on ID
        for (let i = 0; i < response.length; i += 1) {
          if (response[i].id === parseInt(answer1.updateID, 10)) {
            tempProduct = response[i];
            break;
          }
        }

        // if tempProduct was not assigned, invalid input
        if (!tempProduct) {
          process.stdout.write('\x1B[2J\x1B[0f');
          console.log(lineBreak);
          console.log('Invalid input.  Try Again.');
          console.log(lineBreak);
          shopBamazon();
        } else {
          inquirer.prompt([{
            message: 'How many would you like to buy?',
            type: 'input',
            name: 'quantity',
          }])
            .then((answers) => {
              if (!parseInt(answers.quantity, 10)) {
                process.stdout.write('\x1B[2J\x1B[0f');
                console.log('====================');
                console.log('Error: Invalid Input');
                console.log('====================');
                shopBamazon();
              } else if (tempProduct.stock_quantity < answers.quantity) {
                process.stdout.write('\x1B[2J\x1B[0f');
                console.log('/======================');
                console.log('Insufficient quantity!');
                console.log('======================');
                shopBamazon();
              } else {
                queryString = `UPDATE products SET stock_quantity = stock_quantity - ${answers.quantity} WHERE id=${tempProduct.id.toString()}`;

                const totalSale = (parseInt(answers.quantity, 10) * tempProduct.price);

                connection.query(queryString, () => {
                  console.log(lineBreak);
                  console.log(`Item purchased: ${answers.quantity} ${tempProduct.product_name}`);
                  console.log(`Total price: $${totalSale.toFixed(2)}`);
                  console.log(lineBreak);

                  queryString = `UPDATE products SET product_sales = product_sales + ${totalSale.toFixed()} WHERE id=${tempProduct.id.toString()}`;

                  connection.query(queryString, (err) => {
                    if (err) console.log(err);
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
  const displayNames = [];
  const displayDepartments = [];
  const displayPrices = [];

  console.log('\n ID | Item Name                                | Department           | Price       | Stock');
  console.log(lineBreak);

  for (let i = 0; i < response.length; i += 1) {
    displayNames.push(response[i].product_name);
    displayDepartments.push(response[i].department_name);
    displayPrices.push(response[i].price.toFixed(2).toString());

    // add space to product_name for display
    while (displayNames[i].length < 40) {
      displayNames[i] += ' ';
    }
    // add space to product_name for display
    while (displayDepartments[i].length < 20) {
      displayDepartments[i] += ' ';
    }
    // add space to product_name for display
    while (displayPrices[i].length < 10) {
      displayPrices[i] += ' ';
    }

    // add a space before display for single digit IDs
    if (i < 9) {
      console.log(`  ${response[i].id} | ${displayNames[i]} | ${displayDepartments[i]} | $${displayPrices[i]} | ${response[i].stock_quantity}`);
    } else {
      console.log(` ${response[i].id} | ${displayNames[i]} | ${displayDepartments[i]} | $${displayPrices[i]} | ${response[i].stock_quantity}`);
    }
  }
  console.log(lineBreak);
}

function continuePrompt() {
  inquirer.prompt([{
    message: 'Continue shopping?',
    type: 'list',
    choices: ['yes', 'no'],
    name: 'again',
  }])
    .then((answers) => {
      if (answers.again.toLowerCase() === 'yes') {
        process.stdout.write('\x1B[2J\x1B[0f');
        shopBamazon();
      } else {
        console.log('Thank you for shopping at Bamazon! Goodbye.');
        connection.end();
      }
    });
}
