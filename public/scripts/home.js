let expenseCount = 0;
let revenueCount = 0;

document.getElementById("addExpenseButton").addEventListener("click", function() {
    const expenseContainer = document.getElementById("expenseContainer");
    expenseContainer.style.display = "block";
    
    const expenseForm = document.getElementById("expenseForm");

    const newExpenseDiv = document.createElement("div");
    newExpenseDiv.classList.add("expense-entry");

    newExpenseDiv.innerHTML = `
        <h4>Expense ${expenseCount + 1}</h4>
        <label for="expenseDescription${expenseCount}">Expense Description:</label>
        <input type="text" id="expenseDescription${expenseCount}" name="expenses[${expenseCount}][description]" required>
        <br>
        <label for="expenseAmount${expenseCount}">Expense Amount:</label>
        <input type="number" id="expenseAmount${expenseCount}" name="expenses[${expenseCount}][amount]" required>
        <br>
    `;
    expenseForm.appendChild(newExpenseDiv);

    expenseCount++; 
});

document.getElementById("addRevenueButton").addEventListener("click", function() {
    const revenueContainer = document.getElementById("revenueContainer");
    revenueContainer.style.display = "block";
    
    const revenueForm = document.getElementById("revenueForm");

    const newRevenueDiv = document.createElement("div");
    newRevenueDiv.classList.add("revenue-entry");

    newRevenueDiv.innerHTML = `
        <h4>Revenue ${revenueCount + 1}</h4>
        <label for="revenueDescription${revenueCount}">Revenue Description:</label>
        <input type="text" id="revenueDescription${revenueCount}" name="revenues[${revenueCount}][description]" required>
        <br>
        <label for="revenueAmount${revenueCount}">Revenue Amount:</label>
        <input type="number" id="revenueAmount${revenueCount}" name="revenues[${revenueCount}][amount]" required>
        <br>
    `;
    revenueForm.appendChild(newRevenueDiv);

    revenueCount++;
});
