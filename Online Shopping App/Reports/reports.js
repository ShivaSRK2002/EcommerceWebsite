document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('statusMessage');

    document.getElementById('allCategoriesBtn').addEventListener('click', () => {
        console.log('Fetching items from Firestore...');

        // Fetch categories first
        fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/categories')
            .then(response => {
                console.log('Categories Response Status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => { 
                        throw new Error(`Network response was not ok: ${response.statusText} - ${text}`); 
                    });
                }
                return response.json();
            })
            .then(categoriesData => {
                const categoriesMap = {};
                categoriesData.documents.forEach(category => {
                    const fields = category.fields;
                    const catId = fields.Cat_id?.integerValue || category.name.split('/').pop(); // Get Cat_id or use the document ID
                    categoriesMap[catId] = fields.name?.stringValue || 'N/A'; // Map category ID to name
                });

                // Now fetch inventory items
                return fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory')
                    .then(response => {
                        console.log('Inventory Response Status:', response.status);
                        if (!response.ok) {
                            return response.text().then(text => { 
                                throw new Error(`Network response was not ok: ${response.statusText} - ${text}`); 
                            });
                        }
                        return response.json();
                    })
                    .then(inventoryData => {
                        const itemsContainer = document.getElementById('itemsContainer');
                        itemsContainer.innerHTML = ''; // Clear previous items
                        let csvContent = 'Cat_id,CategoryName,Description,ItemId,Price,Quantity,Title,ImageUrl,IsActive,Status\n';  // CSV Header

                        if (!inventoryData.documents || inventoryData.documents.length === 0) {
                            itemsContainer.innerHTML = '<p>No items found in the inventory.</p>';
                            statusMessage.textContent = '';
                            return;
                        }

                        console.log('Fetched Inventory Data:', inventoryData); // Debugging: Log the data received from Firestore

                        // Iterate over all documents in the Firestore collection
                        inventoryData.documents.forEach(doc => {
                            const fields = doc.fields;
                            const catId = fields.Cat_id?.integerValue || 'N/A';
                            const categoryName = categoriesMap[catId] || 'Unknown'; // Get the category name

                            // Ensure all fields are safely accessed, even if optional
                            const itemDetails = `
                                <strong>Cat_id:</strong> ${catId}<br>
                                <strong>Category Name:</strong> ${categoryName}<br>
                                <strong>Description:</strong> ${fields.Description?.stringValue || 'N/A'}<br>
                                <strong>ItemId:</strong> ${doc.name.split('/').pop()}<br>
                                <strong>Price:</strong> $${fields.Price?.doubleValue ? fields.Price.doubleValue.toFixed(2) : 'N/A'}<br>
                                <strong>Quantity:</strong> ${fields.Quantity?.integerValue || 'N/A'}<br>
                                <strong>Title:</strong> ${fields.Title?.stringValue || 'N/A'}<br>
                                <strong>Image URL:</strong> <a href="${fields.ImageUrl?.stringValue || '#'}" target="_blank">View Image</a><br>
                                <strong>Is Active:</strong> ${fields.IsActive?.booleanValue ? 'Yes' : 'No'}<br>
                                <strong>Status:</strong> ${fields.Status?.stringValue || 'N/A'}<br>
                                <hr>
                            `;

                            // Append details to CSV content
                            csvContent += `${catId},${categoryName},${fields.Description?.stringValue || ''},${doc.name.split('/').pop()},${fields.Price?.doubleValue || ''},${fields.Quantity?.integerValue || ''},${fields.Title?.stringValue || ''},${fields.ImageUrl?.stringValue || ''},${fields.IsActive?.booleanValue},${fields.Status?.stringValue || ''}\n`;

                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'item';
                            itemDiv.innerHTML = itemDetails;
                            itemsContainer.appendChild(itemDiv);
                        });

                        // Create CSV file and download
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'allCategories.csv';
                        link.click();

                        // Clear status message
                        statusMessage.textContent = '';
                    });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                statusMessage.textContent = 'Error fetching items. Please try again later.';
            });
    });
});
//Inventory stock by categories

document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('statusMessage');

    document.getElementById('categoriesBtn').addEventListener('click', () => {
        console.log('Fetching categories from Firestore...');

        // Fetch categories
        fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/categories')
            .then(response => {
                console.log('Categories Response Status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => { 
                        throw new Error(`Network response was not ok: ${response.statusText} - ${text}`); 
                    });
                }
                return response.json();
            })
            .then(categoriesData => {
                const categoriesContainer = document.getElementById('categoriesContainer');
                categoriesContainer.innerHTML = ''; // Clear previous categories

                if (!categoriesData.documents || categoriesData.documents.length === 0) {
                    categoriesContainer.innerHTML = '<p>No categories found.</p>';
                    statusMessage.textContent = '';
                    return;
                }

                console.log('Fetched Categories Data:', categoriesData); // Debugging: Log the data received from Firestore

                // Iterate over all documents in the Firestore categories collection
                categoriesData.documents.forEach(category => {
                    const fields = category.fields;
                    const catId = fields.Cat_id?.integerValue || category.name.split('/').pop(); // Get Cat_id or use the document ID
                    const categoryName = fields.name?.stringValue || 'N/A'; // Get the category name

                    // Display category details
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category';
                    categoryDiv.innerHTML = `
                        <strong>Category ID:</strong> ${catId}<br>
                        <strong>Category Name:</strong> ${categoryName}<br>
                        <button class="fetchItemsBtn" data-category-id="${catId}">Fetch Inventory Items</button>
                        <button class="downloadCsvBtn" data-category-id="${catId}">Download CSV Report</button>
                        <div class="itemsContainer"></div>
                        <hr>
                    `;
                    categoriesContainer.appendChild(categoryDiv);

                    // Attach event listener for fetching inventory items for this category
                    categoryDiv.querySelector('.fetchItemsBtn').addEventListener('click', () => {
                        fetchInventoryItems(catId, categoryDiv.querySelector('.itemsContainer'));
                    });

                    // Attach event listener for downloading CSV report
                    categoryDiv.querySelector('.downloadCsvBtn').addEventListener('click', () => {
                        downloadCsv(catId);
                    });
                });

                // Clear status message
                statusMessage.textContent = '';
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                statusMessage.textContent = 'Error fetching categories. Please try again later.';
            });
    });

    // Function to fetch inventory items based on category ID
    function fetchInventoryItems(categoryId, itemsContainer) {
        console.log(`Fetching inventory items for category ID: ${categoryId}...`);

        // Fetch inventory items
        fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory')
            .then(response => {
                console.log('Inventory Response Status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => { 
                        throw new Error(`Network response was not ok: ${response.statusText} - ${text}`); 
                    });
                }
                return response.json();
            })
            .then(inventoryData => {
                itemsContainer.innerHTML = ''; // Clear previous items

                if (!inventoryData.documents || inventoryData.documents.length === 0) {
                    itemsContainer.innerHTML = '<p>No items found in the inventory.</p>';
                    return;
                }

                console.log('Fetched Inventory Data:', inventoryData); // Debugging: Log the data received from Firestore

                // Filter and display items that belong to the selected category
                inventoryData.documents.forEach(doc => {
                    const fields = doc.fields;
                    const itemCategoryId = fields.Cat_id?.integerValue || 'N/A'; // Get the item category ID

                    // Check if the item belongs to the selected category
                    if (itemCategoryId == categoryId) {  // Compare by category ID
                        const itemDetails = `
                            <strong>Item ID:</strong> ${doc.name.split('/').pop()}<br>
                            <strong>Title:</strong> ${fields.Title?.stringValue || 'N/A'}<br>
                            <strong>Description:</strong> ${fields.Description?.stringValue || 'N/A'}<br>
                            <strong>Price:</strong> $${fields.Price?.doubleValue ? fields.Price.doubleValue.toFixed(2) : 'N/A'}<br>
                            <strong>Quantity:</strong> ${fields.Quantity?.integerValue || 'N/A'}<br>
                            <strong>Image URL:</strong> <a href="${fields.ImageUrl?.stringValue || '#'}" target="_blank">View Image</a><br>
                            <hr>
                        `;

                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                        itemDiv.innerHTML = itemDetails;
                        itemsContainer.appendChild(itemDiv);
                    }
                });

                if (itemsContainer.innerHTML === '') {
                    itemsContainer.innerHTML = '<p>No items found for this category.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching inventory items:', error);
                itemsContainer.innerHTML = '<p>Error fetching items. Please try again later.</p>';
            });
    }

    // Function to download CSV report for the inventory items of a specific category
    function downloadCsv(categoryId) {
        console.log(`Downloading CSV report for category ID: ${categoryId}...`);

        fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory')
            .then(response => {
                console.log('Inventory Response Status for CSV:', response.status);
                if (!response.ok) {
                    return response.text().then(text => { 
                        throw new Error(`Network response was not ok: ${response.statusText} - ${text}`); 
                    });
                }
                return response.json();
            })
            .then(inventoryData => {
                let csvContent = 'Item ID,Title,Description,Price,Quantity,Image URL\n';  // CSV Header

                // Check if there are items to process
                if (!inventoryData.documents || inventoryData.documents.length === 0) {
                    console.error('No items found in the inventory for CSV.');
                    return;
                }

                // Filter items based on the category ID and build CSV content
                inventoryData.documents.forEach(doc => {
                    const fields = doc.fields;
                    const itemCategoryId = fields.Cat_id?.integerValue || 'N/A'; // Get the item category ID

                    // Only include items belonging to the selected category
                    if (itemCategoryId == categoryId) {
                        const itemId = doc.name.split('/').pop();
                        const title = fields.Title?.stringValue || 'N/A';
                        const description = fields.Description?.stringValue || 'N/A';
                        const price = fields.Price?.doubleValue ? fields.Price.doubleValue.toFixed(2) : 'N/A';
                        const quantity = fields.Quantity?.integerValue || 'N/A';
                        const imageUrl = fields.ImageUrl?.stringValue || '';

                        // Append item details to CSV content
                        csvContent += `${itemId},"${title}","${description}",${price},${quantity},"${imageUrl}"\n`;
                    }
                });

                // Create CSV file blob and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `inventory_report_category_${categoryId}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log(`CSV report downloaded for category ID: ${categoryId}.`);
            })
            .catch(error => {
                console.error('Error downloading CSV:', error);
                statusMessage.textContent = 'Error downloading CSV report. Please try again later.';
            });
    }
});