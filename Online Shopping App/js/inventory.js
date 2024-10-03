// Firebase API Configuration
const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory';
const apiUrl1 = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/categories';
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

 
//Add item to inventory
// document.getElementById('inventoryForm').addEventListener('submit', async function (event) {
//     event.preventDefault();
 
//     const id = document.getElementById('id').value.trim();
//     const cat_id = document.getElementById('cat_id').value.trim();
//     const title = document.getElementById('title').value.trim();
//     const description = document.getElementById('description').value.trim();
//     const quantity = parseInt(document.getElementById('quantity').value.trim(), 10);
//     const price = parseFloat(document.getElementById('price').value.trim());
//     const imageFile = document.getElementById('image').files[0];
 
//     if (!id || !cat_id || !title || !description || isNaN(quantity) || isNaN(price) || !imageFile) {
//         showMessage('addItemMessage', 'Please fill in all fields correctly.', 'error');
//         return;
//     }
 
//     const reader = new FileReader();
//     reader.onloadend = async () => {
//         const imageUrl = reader.result;
 
//         const record = {
//             fields: {
//                 Cat_id: { integerValue: cat_id },
//                 Title: { stringValue: title },
//                 Description: { stringValue: description },
//                 Quantity: { integerValue: quantity },
//                 Price: { doubleValue: price },
//                 ImageUrl: { stringValue: imageUrl },
//                 Status: { stringValue: 'active' }
//             }
//         };
 
//         try {
//             const response = await fetch(`${apiUrl}/${id}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(record)
//             });
 
//             if (!response.ok) {
//                 const errorDetails = await response.text();
//                 throw new Error(`Failed to add record: ${response.status} - ${errorDetails}`);
//             }
 
//             showMessage('addItemMessage', 'Record added successfully!');
//             document.getElementById('inventoryForm').reset();
//         } catch (error) {
//             console.error('Error:', error);
//             showMessage('addItemMessage', 'Error adding record: ' + error.message, 'error');
//         }
//     };
 
//     reader.readAsDataURL(imageFile);
// });
// add
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
                Cat_id: { integerValue: parseInt(cat_id, 10) }, // Ensure cat_id is an integer
                Title: { stringValue: title },
                Description: { stringValue: description },
                Quantity: { integerValue: quantity },
                Price: { doubleValue: price },
                ImageUrl: { stringValue: imageUrl },
                Status: { stringValue: 'active' }
            }
        };

        // Log the record object to check its structure
        console.log("Record to be sent:", JSON.stringify(record, null, 2));

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
document.getElementById("categoryBtn").addEventListener("click", function () {
    showSection("categorySection");
});
 
function showSection(sectionId) {
    // Get all sections
    const sections = document.querySelectorAll('section');
    
    // Hide all sections
    sections.forEach(section => section.classList.add('hidden'));

    // Show the selected section
    document.getElementById(sectionId).classList.remove('hidden');
}

document.getElementById('fetchAllItemsBtn').addEventListener('click', function() {
    window.location.href = 'delete.html'; // Redirect to delete.html
});

 
// Logout button functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    // Logic to log out the admin
    alert('Logged out successfully!');
});

// Create Category with Custom ID
async function createCategory(categoryId, categoryName) {
    const categoryData = {
        fields: {
            name: { stringValue: categoryName }
        }
    };
    try {
        const response = await fetch(`${apiUrl1}/${categoryId}`, {
            method: 'PATCH', // or PUT if you prefer, both allow creating with a custom ID
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });
        if (!response.ok) throw new Error('Failed to create category.');
        alert('Category created successfully!');
        fetchAllCategories(); // Refresh category list after creation
    } catch (error) {
        alert(error.message);
    }
}

// Fetch All Categories
// Fetch All Categories
async function fetchAllCategories() {
    try {
        const response = await fetch(apiUrl1);
        if (!response.ok) throw new Error('Failed to fetch categories.');
        const data = await response.json();
        const categories = data.documents || [];

        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = ''; // Clear the list

        // Check if categories are returned and handle them safely
        categories.forEach(category => {
            const categoryId = category.name ? category.name.split('/').pop() : 'Unknown ID'; // Handle if name is not available
            const categoryName = category.fields && category.fields.name && category.fields.name.stringValue ? category.fields.name.stringValue : 'Unknown Name'; // Defensive check
            const categoryRow = document.createElement('div');
            categoryRow.innerHTML = `
                <span>ID: ${categoryId}, Name: ${categoryName}</span>
            `;
            categoriesList.appendChild(categoryRow);
        });
    } catch (error) {
        alert(error.message);
    }
}

// Update Category
// Function to fetch inventory from the database
async function fetchAndDisplayInventory() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch inventory.');

        const data = await response.json();
        displayInventory(data.documents); // Pass the fetched items to the display function
    } catch (error) {
        console.error('Error fetching inventory:', error);
        alert(error.message);
    }
}

// Call this function after updating a record
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

        // Fetch and display inventory after update
        
        fetchAndDisplayInventory();
    } catch (error) {
        console.error('Error:', error);
        showMessage('updateItemMessage', 'Error updating record: ' + error.message, 'error');
    }
}


// Delete Category
async function deleteCategory(categoryId) {
    const url = `${apiUrl1}/${categoryId}`;
    try {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete category.');
        alert('Category deleted successfully!');
        fetchAllCategories(); // Refresh category list after deletion
    } catch (error) {
        alert(error.message);
    }
}

// Event listeners for buttons
document.getElementById('categoryForm').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent form submission

    if (event.submitter.id === 'createCategoryBtn') {
        const categoryId = document.getElementById('categoryIdInput').value;
        const categoryName = document.getElementById('categoryNameInput').value;
        if (categoryId && categoryName) {
            createCategory(categoryId, categoryName);
        } else {
            alert('Please enter both Category ID and Category Name.');
        }
    }

    if (event.submitter.id === 'updateCategoryBtn') {
        const categoryId = document.getElementById('updateCategoryIdInput').value;
        const newCategoryName = document.getElementById('updateCategoryNameInput').value;
        if (categoryId && newCategoryName) {
            updateCategory(categoryId, newCategoryName);
        } else {
            alert('Please enter both category ID and new category name.');
        }
    }

    if (event.submitter.id === 'deleteCategoryBtn') {
        const categoryId = document.getElementById('deleteCategoryIdInput').value;
        if (categoryId) {
            deleteCategory(categoryId);
        } else {
            alert('Please enter a category ID.');
        }
    }
});

document.getElementById('fetchCategoriesBtn').addEventListener('click', fetchAllCategories);

async function populateCategoryDropdown() {
    try {
        const response = await fetch(apiUrl1);
        if (!response.ok) throw new Error('Failed to fetch categories.');
        const data = await response.json();
        const categories = data.documents || [];

        const catDropdown = document.getElementById('cat_id');
        catDropdown.innerHTML = ''; // Clear previous options

        categories.forEach(category => {
            const categoryId = category.name.split('/').pop(); // Extract category ID
            const categoryName = category.fields.name.stringValue; // Get category name
            const option = document.createElement('option');
            option.value = categoryId; // Set value to category ID
            option.textContent = categoryName; // Set display text to category name
            catDropdown.appendChild(option); // Add option to dropdown
        });
    } catch (error) {
        console.error(error);
    }
}

// Call this function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    populateCategoryDropdown(); // Call this to populate categories
});

async function fetchUsers() {
    const url = `https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/users`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${data.error.message}`);
        }

        if (!data.documents || data.documents.length === 0) {
            document.getElementById('userList').innerText = 'No users found.';
            return;
        }

        // Display the user list with editable credit limits
        displayUsers(data.documents);
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('userList').innerText = 'Error fetching users: ' + error.message;
    }
}

// Display users and credit limits in a table
function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear existing users

    users.forEach(user => {
        const id = user.name.split('/').pop(); // Get the document ID
        const fields = user.fields;

        // Extract necessary fields
        const email = fields.Email ? fields.Email.stringValue : 'No Email';
        const creditLimit = fields.CreditLimit ? fields.CreditLimit.integerValue : 0; // Default to 0

        // Create a row for each user
        const row = document.createElement('tr');
        row.classList.add('user');

        row.innerHTML = `
            <td>${id}</td>
            <td>${email}</td>
            <td><input type="number" id="creditLimit-${id}" value="${creditLimit}" min="0"/></td>
            <td><button onclick="updateCreditLimit('${id}')">Update Credit Limit</button></td>
        `;

        userList.appendChild(row);
    });
}

// Function to update the Credit Limit of a user
async function updateCreditLimit(userId) {
    const creditLimitInput = document.getElementById(`creditLimit-${userId}`);
    const newCreditLimit = parseInt(creditLimitInput.value, 10);

    if (isNaN(newCreditLimit) || newCreditLimit < 0) {
        alert('Please enter a valid Credit Limit.');
        return;
    }

    const updateUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=CreditLimit`;

    const updatedUserData = {
        fields: {
            CreditLimit: { integerValue: newCreditLimit }
        }
    };

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUserData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${errorData.error.message}`);
        }

        alert('Credit Limit updated successfully!');
    } catch (error) {
        console.error('Error updating Credit Limit:', error);
        alert('Failed to update Credit Limit: ' + error.message);
    }
}

// Call fetchUsers to load users when the page loads
fetchUsers();