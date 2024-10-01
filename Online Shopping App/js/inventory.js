// Firebase API Configuration
const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory';
 
// Function to show messages
function showMessage(elementId, text, type = 'success') {
    const messageElement = document.getElementById(elementId);
    messageElement.innerText = text;
    messageElement.className = `alert ${type}`;
    messageElement.classList.remove('hidden');
   
    // Hide the message after 3 seconds
    setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 3000);
}
 
// Add item to inventory
document.getElementById('inventoryForm').addEventListener('submit', async function (event) {
    event.preventDefault();
 
    const id = document.getElementById('id').value.trim();
    const cat_id = document.getElementById('cat_id').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value.trim(), 10);
    const price = parseFloat(document.getElementById('price').value.trim());
    const imageFile = document.getElementById('image').files[0];
 
    if (!id || !cat_id || !title || !description || isNaN(quantity) || isNaN(price) || !imageFile) {
        showMessage('addItemMessage', 'Please fill in all fields correctly.', 'error');
        return;
    }
 
    const reader = new FileReader();
    reader.onloadend = async () => {
        const imageUrl = reader.result;
 
        const record = {
            fields: {
                Cat_id: { integerValue: cat_id },
                Title: { stringValue: title },
                Description: { stringValue: description },
                Quantity: { integerValue: quantity },
                Price: { doubleValue: price },
                ImageUrl: { stringValue: imageUrl },
                Status: { stringValue: 'active' }
            }
        };
 
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(record)
            });
 
            if (!response.ok) {
                const errorDetails = await response.text();
                throw new Error(`Failed to add record: ${response.status} - ${errorDetails}`);
            }
 
            showMessage('addItemMessage', 'Record added successfully!');
            document.getElementById('inventoryForm').reset();
        } catch (error) {
            console.error('Error:', error);
            showMessage('addItemMessage', 'Error adding record: ' + error.message, 'error');
        }
    };
 
    reader.readAsDataURL(imageFile);
});
 
// Update item functionality
document.getElementById('fetchItemBtn').addEventListener('click', async function() {
    const itemId = document.getElementById('updateItemId').value.trim();
    if (!itemId) {
        showMessage('updateItemMessage', 'Please enter an Item ID.', 'error');
        return;
    }
 
    try {
        const response = await fetch(`${apiUrl}/${itemId}`);
        if (!response.ok) throw new Error('Item not found.');
 
        const data = await response.json();
        const fields = data.fields;
 
        document.getElementById('updateCatId').value = fields.Cat_id.integerValue;
        document.getElementById('updateTitle').value = fields.Title.stringValue;
        document.getElementById('updateDescription').value = fields.Description.stringValue;
        document.getElementById('updateQuantity').value = fields.Quantity.integerValue;
        document.getElementById('updatePrice').value = fields.Price.doubleValue;
 
        document.getElementById('itemDetails').classList.remove('hidden');
    } catch (error) {
        showMessage('updateItemMessage', error.message, 'error');
    }
});
 
// Update record button functionality
document.getElementById('updateRecordBtn').addEventListener('click', async function() {
    const id = document.getElementById('updateItemId').value.trim();
    const cat_id = document.getElementById('updateCatId').value.trim();
    const title = document.getElementById('updateTitle').value.trim();
    const description = document.getElementById('updateDescription').value.trim();
    const quantity = parseInt(document.getElementById('updateQuantity').value.trim(), 10);
    const price = parseFloat(document.getElementById('updatePrice').value.trim());
    const imageFile = document.getElementById('updateImage').files[0];
 
    if (!id || !cat_id || !title || !description || isNaN(quantity) || isNaN(price)) {
        showMessage('updateItemMessage', 'Please fill in all fields correctly.', 'error');
        return;
    }
 
    let imageUrl = "";
    if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            imageUrl = reader.result;
            await updateRecord(id, cat_id, title, description, quantity, price, imageUrl);
        };
        reader.readAsDataURL(imageFile);
    } else {
        await updateRecord(id, cat_id, title, description, quantity, price);
    }
});
 
// Function to update record
async function updateRecord(id, cat_id, title, description, quantity, price, imageUrl) {
    const record = {
        fields: {
            Cat_id: { integerValue: cat_id },
            Title: { stringValue: title },
            Description: { stringValue: description },
            Quantity: { integerValue: quantity },
            Price: { doubleValue: price },
            ...(imageUrl && { ImageUrl: { stringValue: imageUrl } }) // Update image only if provided
        }
    };
 
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        });
 
        if (!response.ok) throw new Error('Failed to update record.');
 
        showMessage('updateItemMessage', 'Record updated successfully!');
        document.getElementById('itemDetails').classList.add('hidden');
        document.getElementById('updateItemId').value = '';
    } catch (error) {
        console.error('Error:', error);
        showMessage('updateItemMessage', 'Error updating record: ' + error.message, 'error');
    }
}
 
// Delete item functionality
document.getElementById('fetchAllItemsBtn').addEventListener('click', async function() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch items.');
 
        const data = await response.json();
        const items = data.documents;
 
        const deleteItemsList = document.getElementById('deleteItemsList');
        deleteItemsList.innerHTML = ''; // Clear previous list
 
        items.forEach(item => {
            const itemId = item.name.split('/').pop(); // Get item ID from the document path
            const itemRow = document.createElement('div');
            itemRow.innerHTML = `
                <div>
                    <span>${item.fields.Title.stringValue}</span>
                    <button class="deleteItemBtn" data-id="${itemId}">Delete</button>
                </div>
            `;
            deleteItemsList.appendChild(itemRow);
        });
 
        deleteItemsList.classList.remove('hidden');
    } catch (error) {
        showMessage('deleteItemMessage', error.message, 'error');
    }
});
 
// Delete item button functionality
document.getElementById('deleteItemsList').addEventListener('click', async function(event) {
    if (event.target.classList.contains('deleteItemBtn')) {
        const itemId = event.target.getAttribute('data-id');
        try {
            const response = await fetch(`${apiUrl}/${itemId}`, {
                method: 'DELETE'
            });
 
            if (!response.ok) throw new Error('Failed to delete item.');
 
            showMessage('deleteItemMessage', 'Item deleted successfully!');
            event.target.closest('div').remove(); // Remove the item from the displayed list
        } catch (error) {
            showMessage('deleteItemMessage', error.message, 'error');
        }
    }
});
 
// Event listeners for buttons
document.getElementById('addItemBtn').addEventListener('click', function() {
    showSection('addItemSection');
});
 
document.getElementById('readInventoryBtn').addEventListener('click', function() {
    window.location.href = '../Admin/adminRead.html'; // Redirect to adminRead.html
});
 
document.getElementById('editCreditLimitBtn').addEventListener('click', function() {
    showSection('creditLimitSection');
});
 
document.getElementById('updateItemBtn').addEventListener('click', function() {
    showSection('updateItemSection');
});
 
document.getElementById('deleteItemBtn').addEventListener('click', function() {
    showSection('deleteItemSection');
});
 
// Function to show/hide sections
function showSection(sectionId) {
    const sections = ['addItemSection', 'inventorySection', 'creditLimitSection', 'updateItemSection', 'deleteItemSection'];
    sections.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}
 
// Logout button functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    // Logic to log out the admin
    alert('Logged out successfully!');
});