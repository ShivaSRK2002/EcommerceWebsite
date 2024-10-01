const apiUrl = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/';
const inventoryCollection = 'inventory';
const itemsPerPage = 4; // Show 4 products per page
let currentPage = 1;
let products = []; // Store all fetched products
let filteredProducts = []; // Store filtered products for rendering

// Fetch inventory items
async function fetchInventoryForCustomer() {
    try {
        const response = await fetch(`${apiUrl}${inventoryCollection}`);
        const data = await response.json();
        products = data.documents.map(doc => doc.fields); // Fetch all products
        filteredProducts = products; // Initialize filtered products
        renderProducts(); // Render products on initial load
        renderPagination(); // Render pagination based on initial product count
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

// Render products on the page
function renderProducts() {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = ''; // Clear previous content

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage); // Get products for the current page

    // Check if there are no products to display
    if (paginatedProducts.length === 0) {
        productsContainer.innerHTML = '<p>No products available for this category.</p>';
        return;
    }

    paginatedProducts.forEach(product => {
        const productCard = `
            <div class="product-card">
                <img src="${product.imageUrl?.stringValue || 'placeholder.jpg'}" alt="${product.title.stringValue}">
                <h3>${product.title.stringValue}</h3>
                <p>${product.description.stringValue}</p>
                <p><strong>Price:</strong> $${product.price.doubleValue.toFixed(2)}</p>
                <button onclick="showProductDetails('${product.title.stringValue}', '${product.description.stringValue}', ${product.price.doubleValue}, '${product.imageUrl?.stringValue || 'placeholder.jpg'}')">View Details</button>
            </div>
        `;
        productsContainer.innerHTML += productCard; // Append each product card
    });
}

// Render pagination controls
function renderPagination() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = ''; // Clear previous pagination controls

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage); // Calculate total pages

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = `<button onclick="changePage(${i})">${i}</button>`;
        paginationControls.innerHTML += pageButton; // Append page buttons
    }
}

// Change page
function changePage(pageNumber) {
    currentPage = pageNumber; // Update current page
    renderProducts(); // Render products for the new page
}

// Filter products by category
document.getElementById('categoryFilter').addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    // Reset filtered products based on selected category
    if (selectedCategory === '') {
        filteredProducts = products; // Show all products if "Select Category" is selected
    } else {
        filteredProducts = products.filter(product => product.catId.stringValue === selectedCategory); // Filter by selected category
    }
    currentPage = 1; // Reset to first page after filtering
    renderProducts(); // Render filtered products
    renderPagination(); // Update pagination
});

// Show product details in modal
function showProductDetails(title, description, price, imageUrl) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDescription').innerText = description;
    document.getElementById('modalPrice').innerText = price.toFixed(2);
    document.getElementById('modalImage').src = imageUrl;

    document.getElementById('productModal').style.display = 'block'; // Show modal
}

// Close modal
document.getElementById('modalClose').onclick = () => {
    document.getElementById('productModal').style.display = 'none'; // Hide modal
};

// Initial fetch on window load
window.onload = fetchInventoryForCustomer;

var sidenav = document.querySelector(".side-navbar")

function showNavbar()
{
    sidenav.style.left="0";
}
function closeNavbar()
{
    sidenav.style.left="-60%";
}

// Function to handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        alert("Logout successful!");
        window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
        alert(`Error during logout: ${error.message}`);
    }
}

document.getElementById("logoutButton").addEventListener("click", handleLogout);
