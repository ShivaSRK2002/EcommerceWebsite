const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory';
let currentPage = 1;
const itemsPerPage = 10; // Number of items per page
let lastVisibleItem = null; // Store last item for pagination
let firstVisibleItem = null; // Store first item for reverse pagination
let inventoryItems = [];
let selectedCategory = ''; // Track selected category

// Fetch inventory from Firestore with pagination and category filtering
async function fetchInventory(direction = 'forward', category = '') {
    let url = new URL(apiUrl);
    url.searchParams.append('pageSize', itemsPerPage);

    // Add category filter to the query if a category is selected
    if (category) {
        url.searchParams.append('where', `category.stringValue=${category}`);
    }

    // Pagination logic
    if (direction === 'forward' && lastVisibleItem) {
        url.searchParams.append('startAfter', lastVisibleItem.name); // Fetch items after the last visible item
    } else if (direction === 'backward' && firstVisibleItem) {
        url.searchParams.append('endBefore', firstVisibleItem.name); // Fetch items before the first visible item
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            inventoryItems = data.documents || [];

            if (inventoryItems.length > 0) {
                // Update pagination cursors
                lastVisibleItem = inventoryItems[inventoryItems.length - 1];
                firstVisibleItem = inventoryItems[0];
                displayItems();
                updatePaginationControls();
            } else {
                alert('No more items to display.');
            }
        } else {
            console.error('Error fetching inventory:', data.error);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

// Display items for the current page
function displayItems() {
    const itemsList = document.getElementById("itemsList");
    itemsList.innerHTML = ""; // Clear previous items

    inventoryItems.forEach(doc => {
        const itemData = doc.fields;
        const itemDiv = document.createElement("div");
        itemDiv.className = "item";
        itemDiv.innerHTML = `
            <h3>${itemData.title.stringValue}</h3>
            <p>Category: ${itemData.category.stringValue}</p>
            <p>Quantity: ${itemData.quantity.integerValue}</p>
            <p>Price: $${itemData.price.integerValue}</p>
            <button onclick="editItem('${doc.name}')">Edit</button>
        `;
        itemsList.appendChild(itemDiv);
    });
}

// Update the pagination controls (previous/next buttons)
function updatePaginationControls() {
    document.getElementById("currentPage").textContent = `Page ${currentPage}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
}

// Change page (increment or decrement)
async function changePage(direction) {
    if (direction === 'forward') {
        currentPage++;
        await fetchInventory('forward', selectedCategory);
    } else if (direction === 'backward' && currentPage > 1) {
        currentPage--;
        await fetchInventory('backward', selectedCategory);
    }
}

// Filter by category and reset pagination
function filterByCategory() {
    const categoryFilter = document.getElementById("categoryFilter").value;
    selectedCategory = categoryFilter; // Set the selected category
    currentPage = 1; // Reset to the first page
    lastVisibleItem = null; // Reset pagination cursors
    firstVisibleItem = null;
    fetchInventory('forward', selectedCategory); // Fetch filtered inventory
}

// Initialize with the first page of inventory
document.addEventListener("DOMContentLoaded", () => {
    fetchInventory();
});
