const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/';
const customerCollection = 'users'; // Assuming your customer data is stored in the 'users' collection

// Fetch customer data and populate the table
async function fetchCustomers() {
    try {
        const response = await fetch(`${apiUrl}${customerCollection}`);
        const data = await response.json();
        const customerTableBody = document.querySelector('#customerCreditTable tbody');
        customerTableBody.innerHTML = ''; // Clear existing content

        if (data.documents) {
            data.documents.forEach(doc => {
                const customer = doc.fields;
                const customerId = doc.name.split('/').pop(); // Extract document ID (customer ID)

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.name.stringValue}</td>
                    <td>${customer.email.stringValue}</td>
                    <td><input type="number" id="credit_${customerId}" value="${customer.credit ? customer.credit.integerValue : 1000}" /></td>
                    <td><button onclick="updateCustomerCredit('${customerId}')">Update Credit</button></td>
                `;
                customerTableBody.appendChild(row);
            });
        } else {
            customerTableBody.innerHTML = `<tr><td colspan="4">No customers found.</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching customers:', error);
        alert(`Error fetching customers: ${error.message}`);
    }
}

// Update customer's credit limit in Firestore
async function updateCustomerCredit(customerId) {
    const newCredit = parseInt(document.getElementById(`credit_${customerId}`).value, 10);
    const customerData = {
        fields: {
            credit: { integerValue: newCredit }
        }
    };

    try {
        const response = await fetch(`${apiUrl}${customerCollection}/${customerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error updating credit:', error);
            throw new Error(error.error?.message || 'Unknown error');
        }

        alert('Customer credit updated successfully!');
    } catch (error) {
        console.error('Error in updateCustomerCredit function:', error);
        alert(`Error updating customer credit: ${error.message}`);
    }
}

// Initialize customer credit section when the tab is clicked
document.getElementById('customerTab').addEventListener('click', () => {
    document.getElementById('inventorySection').style.display = 'none';
    document.getElementById('customerCreditSection').style.display = 'block';

    fetchCustomers(); // Load customer data when this section is activated
});
