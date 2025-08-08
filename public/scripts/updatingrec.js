document.getElementById('addExpenseButton').addEventListener('click', function() {
            const expenseContainer = document.getElementById('expenseContainer');
            const expenseCount = expenseContainer.getElementsByClassName('expenseItem').length;

            const expenseDiv = document.createElement('div');
            expenseDiv.classList.add('expenseItem');

            expenseDiv.innerHTML = `
                <label for="expenseName${expenseCount}">Expense Name:</label>
                <input type="text" name="expenses[${expenseCount}][description]" required>

                <label for="expenseAmount${expenseCount}">Expense Amount:</label>
                <input type="number" name="expenses[${expenseCount}][amount]" required>
            `;

            expenseContainer.appendChild(expenseDiv);
        });

        document.getElementById('addRevenueButton').addEventListener('click', function() {
            const revenueContainer = document.getElementById('revenueContainer');
            const revenueCount = revenueContainer.getElementsByClassName('revenueItem').length;

            const revenueDiv = document.createElement('div');
            revenueDiv.classList.add('revenueItem');

            revenueDiv.innerHTML = `
                <label for="revenueSource${revenueCount}">Revenue Source:</label>
                <input type="text" name="revenues[${revenueCount}][description]" required>

                <label for="revenueAmount${revenueCount}">Revenue Amount:</label>
                <input type="number" name="revenues[${revenueCount}][amount]" required>
            `;

            revenueContainer.appendChild(revenueDiv);
        });