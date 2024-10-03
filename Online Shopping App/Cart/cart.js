const productDetailsAPI = 'https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/inventory';
const cart = JSON.parse(sessionStorage.getItem('cart')) || [];

// Fetch product details from Firebase
async function fetchProductDetails() {
    try {
        const response = await fetch(productDetailsAPI);
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        const data = await response.json();
        return data.fields; // Adjust based on actual structure
    } catch (error) {
        console.error(error);
    }
}

// Display cart items on the page
function displayCart() {
    const cartContainer = document.getElementById('cart');
    cartContainer.innerHTML = ''; // Clear existing cart

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty.</div>';
        return;
    }

    let totalPrice = 0; // Initialize total price

    cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');

        // Item details with image
        const itemDetails = document.createElement('div');
        itemDetails.classList.add('item-details');
        itemDetails.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}" class="cart-item-image" style="width: 100px; height: 100px; object-fit: cover; margin-right: 20px;">
            <strong>Title:</strong> ${item.title}<br>
            <strong>Price:</strong> $${item.price.toFixed(2)}<br>
            <strong>Quantity:</strong> <span>${item.quantity}</span>
        `;

        // Quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.classList.add('quantity-controls');

        const minusButton = document.createElement('button');
        minusButton.innerText = '-';
        minusButton.onclick = () => updateQuantity(item.id, -1);

        const quantityDisplay = document.createElement('span');
        quantityDisplay.innerText = ` Quantity: ${item.quantity} `;

        const plusButton = document.createElement('button');
        plusButton.innerText = '+';
        plusButton.onclick = () => updateQuantity(item.id, 1);

        quantityControls.appendChild(minusButton);
        quantityControls.appendChild(quantityDisplay);
        quantityControls.appendChild(plusButton);

        cartItemDiv.appendChild(itemDetails);
        cartItemDiv.appendChild(quantityControls);
        cartContainer.appendChild(cartItemDiv);

        // Calculate the total price for this item
        totalPrice += item.price * item.quantity;
    });

    // Display total price
    const totalDiv = document.createElement('div');
    totalDiv.classList.add('cart-total');
    totalDiv.innerHTML = `<strong>Total Price:</strong> $${totalPrice.toFixed(2)}`;
    cartContainer.appendChild(totalDiv);
}

// Update item quantity in the cart
function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;

        // Remove item if quantity is 0
        if (item.quantity <= 0) {
            cart.splice(cart.indexOf(item), 1);
        }

        // Save updated cart to session storage
        sessionStorage.setItem('cart', JSON.stringify(cart));

        // Refresh the cart display
        displayCart();
    }
}

// Handle Confirm Payment button
document.getElementById('confirmPaymentBtn').addEventListener('click', () => {
    // Get customer details from input fields
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerAddress = document.getElementById('customerAddress').value;

    // Create order details object
    const orderDetails = {
        customerDetails: {
            name: customerName,     // User enters their name
            email: customerEmail,   // User enters their email
            phone: customerPhone,    // User enters their phone
            address: customerAddress, // User enters their address
            dateTime: new Date().toLocaleString()
        },
        cartItems: JSON.parse(sessionStorage.getItem('cart')) || []
    };

    // Save order details in sessionStorage
    sessionStorage.setItem('orderDetails', JSON.stringify(orderDetails));

    // Clear the cart from sessionStorage
    sessionStorage.removeItem('cart'); // Clear the cart from sessionStorage

    // Optionally, clear the cart array in memory
    cart.length = 0; // Clear cart array in the current session

    // Redirect to bill.html
    window.location.href = '../Bill/bill.html';
});

// Display cart items when the page loads
displayCart();
