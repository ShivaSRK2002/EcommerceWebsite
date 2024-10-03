// Load order details from sessionStorage
const orderDetails = JSON.parse(sessionStorage.getItem('orderDetails')) || {};

// Display order summary on the page
function displayOrderSummary() {
    const summaryDiv = document.getElementById('orderSummary');
    if (!orderDetails.cartItems || orderDetails.cartItems.length === 0) {
        summaryDiv.innerHTML = '<p>No items in your cart.</p>';
        return;
    }

    let summaryHTML = `<h3>Customer Details</h3>
        <p><strong>Name:</strong> ${orderDetails.customerDetails.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${orderDetails.customerDetails.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${orderDetails.customerDetails.phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${orderDetails.customerDetails.address || 'N/A'}</p>
        <h3>Cart Items</h3>`;

    let totalPrice = 0;
    orderDetails.cartItems.forEach(item => {
        summaryHTML += `<p><strong>${item.title}</strong> (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</p>`;
        totalPrice += item.price * item.quantity;
    });

    summaryHTML += `<h3>Total Price: $${totalPrice.toFixed(2)}</h3>`;
    summaryDiv.innerHTML = summaryHTML;
}

// Handle payment
document.getElementById('payButton').addEventListener('click', function() {
    // Get the selected payment method
    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked').value;

    // Append the payment method to order details
    orderDetails.paymentMethod = selectedPaymentMethod;

    // Save updated order details to sessionStorage
    sessionStorage.setItem('orderDetails', JSON.stringify(orderDetails));

    // Prepare the data in Firestore REST API format
    const firestoreData = {
        fields: {
            customerDetails: {
                mapValue: {
                    fields: {
                        name: { stringValue: orderDetails.customerDetails.name || 'N/A' },
                        email: { stringValue: orderDetails.customerDetails.email || 'N/A' },
                        phone: { stringValue: orderDetails.customerDetails.phone || 'N/A' },
                        address: { stringValue: orderDetails.customerDetails.address || 'N/A' }
                    }
                }
            },
            cartItems: {
                arrayValue: {
                    values: orderDetails.cartItems.map(item => ({
                        mapValue: {
                            fields: {
                                title: { stringValue: item.title || 'Unknown Item' },
                                quantity: { integerValue: item.quantity || 1 },
                                price: { doubleValue: item.price || 0.0 }
                            }
                        }
                    }))
                }
            },
            paymentMethod: { stringValue: selectedPaymentMethod || 'Unknown' },
            orderDate: { timestampValue: new Date().toISOString() }
        }
    };

    // Send POST request to Firestore REST API
    fetch('https://firestore.googleapis.com/v1/projects/online-shopping-app-88c5b/databases/(default)/documents/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(firestoreData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Firestore response:', data);  // Log Firestore response for troubleshooting

        if (data.error) {
            console.error('Error from Firestore:', data.error);
            alert('Error saving order: ' + data.error.message);
            return;
        }

        // Display success message
        const successMessageDiv = document.getElementById('orderSuccessMessage');
        successMessageDiv.innerHTML = `
            <h3>Payment Successful!</h3>
            <p>Your order has been placed successfully!</p>
            <p><strong>Order Details:</strong></p>
            <p><strong>Payment Method:</strong> ${selectedPaymentMethod}</p>
            <p><strong>Order Date and Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Order Total:</strong> $${calculateTotalPrice().toFixed(2)}</p>
            <p>Redirecting to collections page...</p>
        `;

        // Clear the cart items from orderDetails
        orderDetails.cartItems = [];  // Clear cart items

        // Clear the order details from sessionStorage
        sessionStorage.removeItem('orderDetails');

        // Clear the order summary UI immediately
        document.getElementById('orderSummary').innerHTML = ''; // Clear order summary
        
        // Optionally show a loading spinner (CSS can be added)
        successMessageDiv.innerHTML += `<p>Loading...</p>`;
        
        // Redirect to collections page after 3 seconds
        setTimeout(() => {
            window.location.href = "../Collections/collection.html";
        }, 3000); // 3000ms = 3 seconds
    })
    .catch((error) => {
        console.error("Error storing order:", error);
        alert('An error occurred while saving your order. Please try again.');
    });
});

// Calculate total price
function calculateTotalPrice() {
    let total = 0;
    orderDetails.cartItems.forEach(item => {
        total += item.price * item.quantity;
    });
    return total;
}

// Display order summary when page loads
displayOrderSummary();
