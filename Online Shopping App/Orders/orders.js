const ORDERS_PER_PAGE = 5;
let currentPage = 1;
let orders = [];
let filteredOrders = [];

// Function to fetch orders from Firestore
function fetchOrders() {
    const url = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/orders';
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched orders:', data);
            orders = data.documents || [];
            filteredOrders = orders; // Initially, filtered orders are the same as all orders
            displayOrders();
            setupPagination();
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            document.getElementById('orderList').innerHTML = '<p>Error fetching orders. Please try again later.</p>';
        });
}

// Function to display orders on the page
function displayOrders() {
    const orderListDiv = document.getElementById('orderList');
    orderListDiv.innerHTML = ''; // Clear loading text

    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = Math.min(startIndex + ORDERS_PER_PAGE, filteredOrders.length);

    if (startIndex >= filteredOrders.length) {
        orderListDiv.innerHTML = '<p>No orders found.</p>';
        return;
    }

    for (let i = startIndex; i < endIndex; i++) {
        const order = filteredOrders[i];
        const orderData = order.fields;
        let orderHTML = `<div class="order">`;
        orderHTML += `<h3>Order ID: ${order.name.split('/').pop()}</h3>`;
        orderHTML += `<p><strong>Name:</strong> ${orderData.customerDetails.mapValue.fields.name.stringValue}</p>`;
        orderHTML += `<p><strong>Email:</strong> ${orderData.customerDetails.mapValue.fields.email.stringValue}</p>`;
        orderHTML += `<p><strong>Phone:</strong> ${orderData.customerDetails.mapValue.fields.phone.stringValue}</p>`;
        orderHTML += `<p><strong>Address:</strong> ${orderData.customerDetails.mapValue.fields.address.stringValue}</p>`;
        
        orderHTML += `<h4>Cart Items:</h4><ul>`;
        orderData.cartItems.arrayValue.values.forEach(item => {
            orderHTML += `<li>${item.mapValue.fields.title.stringValue} (x${item.mapValue.fields.quantity.integerValue}) - $${item.mapValue.fields.price.doubleValue.toFixed(2)}</li>`;
        });
        orderHTML += `</ul>`;
        
        orderHTML += `<p><strong>Payment Method:</strong> ${orderData.paymentMethod.stringValue}</p>`;
        orderHTML += `<p><strong>Order Date:</strong> ${new Date(orderData.orderDate.timestampValue).toLocaleString()}</p>`;
        orderHTML += `</div>`;
        
        orderListDiv.innerHTML += orderHTML;
    }
}

// Function to setup pagination
function setupPagination() {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = ''; // Clear existing pagination

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

    if (totalPages === 0) return; // No pagination needed if no orders

    // Create previous button
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.onclick = () => {
            currentPage--;
            displayOrders();
            setupPagination();
        };
        paginationDiv.appendChild(prevButton);
    }

    // Create page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = i;
            displayOrders();
            setupPagination();
        };
        paginationDiv.appendChild(pageButton);
    }

    // Create next button
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.onclick = () => {
            currentPage++;
            displayOrders();
            setupPagination();
        };
        paginationDiv.appendChild(nextButton);
    }
}

// Function to filter orders based on payment method
function filterOrders() {
    const selectedPaymentMethod = document.getElementById('paymentFilter').value;
    if (selectedPaymentMethod) {
        filteredOrders = orders.filter(order => {
            return order.fields.paymentMethod.stringValue === selectedPaymentMethod;
        });
    } else {
        filteredOrders = orders; // Reset to all orders if no filter is applied
    }
    currentPage = 1; // Reset to the first page when filtering
    displayOrders();
    setupPagination();
}

// Function to sort orders
function sortOrders() {
    const sortBy = document.getElementById('sortBy').value;

    filteredOrders.sort((a, b) => {
        if (sortBy === "date") {
            return new Date(b.fields.orderDate.timestampValue) - new Date(a.fields.orderDate.timestampValue); // Sort by date descending
        } else if (sortBy === "price") {
            const totalA = a.fields.cartItems.arrayValue.values.reduce((total, item) => total + item.mapValue.fields.price.doubleValue * item.mapValue.fields.quantity.integerValue, 0);
            const totalB = b.fields.cartItems.arrayValue.values.reduce((total, item) => total + item.mapValue.fields.price.doubleValue * item.mapValue.fields.quantity.integerValue, 0);
            return totalB - totalA; // Sort by total price descending
        }
        return 0;
    });

    displayOrders();
    setupPagination();
}

// Function to search orders based on name or email
function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredOrders = orders.filter(order => {
        const customerName = order.fields.customerDetails.mapValue.fields.name.stringValue.toLowerCase();
        const customerEmail = order.fields.customerDetails.mapValue.fields.email.stringValue.toLowerCase();
        return customerName.includes(searchTerm) || customerEmail.includes(searchTerm);
    });

    currentPage = 1; // Reset to the first page when searching
    displayOrders();
    setupPagination();
}

// Fetch orders when the page loads
fetchOrders();