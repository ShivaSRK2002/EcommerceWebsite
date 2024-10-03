$(document).ready(function () {
    $('#navbar').load('navbar.html', function() {

    });
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (!userId || userRole === 'user') {
        alert('Access denied. You do not have permission to view this page.');
        window.location.href = 'signin.html'; // Redirect to sign-in page or another page
    }
   
    // Function to download data as CSV
    function downloadCSV(filename, rows) {
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
    }

    // Fetch user details from Firestore
    function getUserData(userId, callback) {
        $.ajax({
            url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents/users/${userId}`,
            method: 'GET',
            success: function (data) {
                const name = data.fields.name.stringValue;
                callback(name);
            },
            error: function (error) {
                console.error('Error fetching user data:', error);
            }
        });
    }

    $('#generateUserReport').click(function () {
        $.ajax({
            url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: 'users' }]
                }
            }),
            success: function(userData) {
                const userReports = [];
    
                // Extract user details
                userData.forEach(userDoc => {
                    const user = userDoc.document.fields;
                    userReports.push({
                        userId: user.userId.stringValue,
                        name: user.name.stringValue,
                        email: user.email.stringValue,
                        mobileNo: user.mobileNo.stringValue,
                        creditLimit: user.creditLimit.integerValue
                    });
                });
    
                // Prepare CSV data
                let csvData = [["User ID", "Name", "Email", "Mobile No", "Credit Limit"]];
                userReports.forEach(report => {
                    csvData.push([
                        report.userId,
                        report.name,
                        report.email,
                        report.mobileNo,
                        report.creditLimit
                    ]);
                });
    
                // Download the CSV
                downloadCSV("user_report.csv", csvData);
            },
            error: function(error) {
                console.error('Error generating user report:', error);
            }
        });
    });
    




    
    $('#generateTopCustomersReport').click(function () {
        const fromDate = $('#topFromDate').val();
        const toDate = $('#topToDate').val();
    
        $.ajax({
            url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: 'orders' }],
                    where: {
                        compositeFilter: {
                            op: 'AND',
                            filters: [
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'orderDate' }, // Correct field path for order date
                                        op: 'GREATER_THAN_OR_EQUAL',
                                        value: { stringValue: fromDate + "T00:00:00Z" } // Since orderDate is stored as a string
                                    }
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'orderDate' }, // Correct field path for order date
                                        op: 'LESS_THAN_OR_EQUAL',
                                        value: { stringValue: toDate + "T23:59:59Z" } // Since orderDate is stored as a string
                                    }
                                }
                            ]
                        }
                    }
                }}),
                success: function (data) {
                    let csvData = [["User ID", "Name", "Total Spent"]];
                    const userTotalSpent = {};
    
                    data.forEach(doc => {
                        if (doc.document) {
                            const order = doc.document.fields;
                            const userId = order.userId.stringValue;
                            const orderTotal = parseFloat(order.orderTotal.integerValue);
    
                            if (!userTotalSpent[userId]) {
                                userTotalSpent[userId] = 0;
                            }
                            userTotalSpent[userId] += orderTotal;
                        }
                    });
    
                    // Sort users by total spent and select the top 10 customers
                    const topCustomers = Object.entries(userTotalSpent)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10);
    
                    // Fetch user names and prepare CSV
                    topCustomers.forEach(([userId, totalSpent], index) => {
                        getUserData(userId, function (name) {
                            csvData.push([userId, name, totalSpent]);
                            if (index === topCustomers.length - 1) {
                                downloadCSV("top_10_customers_report.csv", csvData);
                            }
                        });
                    });
                },
                error: function (error) {
                    console.error('Error generating top customers report:', error);
                }
            });
        });

        $('#generateCashPurchaseReport').click(function () {
            const fromDate = $('#cashFromDate').val();
            const toDate = $('#cashToDate').val();
        
            $.ajax({
                url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    structuredQuery: {
                        from: [{ collectionId: 'orders' }],
                        where: {
                            compositeFilter: {
                                op: 'AND',
                                filters: [
                                    {
                                        fieldFilter: {
                                            field: { fieldPath: 'orderDate' },
                                            op: 'GREATER_THAN_OR_EQUAL',
                                            value: { stringValue: fromDate + "T00:00:00Z" }
                                        }
                                    },
                                    {
                                        fieldFilter: {
                                            field: { fieldPath: 'orderDate' },
                                            op: 'LESS_THAN_OR_EQUAL',
                                            value: { stringValue: toDate + "T23:59:59Z" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }),
                success: function (data) {
                    let csvData = [["User ID", "Name", "Order ID", "Paid By Cash Amount"]];
                    const userCashOrders = {};
        
                    // Process the data returned
                    data.forEach(doc => {
                        const order = doc.document.fields;
                        const userId = order.userId?.stringValue; // Use optional chaining
                        const paidByCash = order.paidByCash?.integerValue; // Use optional chaining
                        const orderId = order.orderId?.stringValue; // Capture order ID safely
        
                        // Check if paidByCash is greater than 0 and that values are defined
                        if (paidByCash > 0 && userId && orderId) {
                            if (!userCashOrders[userId]) {
                                userCashOrders[userId] = []; // Initialize an array for each user
                            }
                            userCashOrders[userId].push({
                                orderId: orderId, // Store order ID
                                paidByCash: paidByCash
                            });
                        }
                    });
        
                    const userIds = Object.keys(userCashOrders);
                    userIds.forEach((userId) => {
                        getUserData(userId, function (name) {
                            // Add a record for each order for the user
                            userCashOrders[userId].forEach(order => {
                                csvData.push([userId, name, order.orderId, order.paidByCash]); // Include order ID
                            });
        
                            // After processing all users' data, download the CSV
                            if (userId === userIds[userIds.length - 1]) {
                                downloadCSV("cash_purchase_report.csv", csvData);
                            }
                        });
                    });
                },
                error: function (error) {
                    console.error('Error generating cash purchase report:', error);
                }
            });
        });
        


    // Generate Credit Purchase report
    $('#generateCreditPurchaseReport').click(function () {
        const fromDate = $('#creditFromDate').val();
        const toDate = $('#creditToDate').val();
    
        $.ajax({
            url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: 'orders' }],
                    where: {
                        compositeFilter: {
                            op: 'AND',
                            filters: [
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'orderDate' },
                                        op: 'GREATER_THAN_OR_EQUAL',
                                        value: { stringValue: fromDate + "T00:00:00Z" }
                                    }
                                },
                                {
                                    fieldFilter: {
                                        field: { fieldPath: 'orderDate' },
                                        op: 'LESS_THAN_OR_EQUAL',
                                        value: { stringValue: toDate + "T23:59:59Z" }
                                    }
                                }
                            ]
                        }
                    }
                }
            }),
            success: function (data) {
                let csvData = [["User ID", "Name", "Order ID", "Paid By Credits Amount"]];
                const userCreditOrders = {};
    
                // Process the data returned
                data.forEach(doc => {
                    const order = doc.document.fields;
                    const userId = order.userId?.stringValue; // Use optional chaining
                    const paidByCredits = order.paidByCredits?.integerValue; // Use optional chaining
                    const orderId = order.orderId?.stringValue; // Capture order ID safely
    
                    // Check if paidByCredits is greater than 0 and that values are defined
                    if (paidByCredits > 0 && userId && orderId) {
                        if (!userCreditOrders[userId]) {
                            userCreditOrders[userId] = []; // Initialize an array for each user
                        }
                        userCreditOrders[userId].push({
                            orderId: orderId, // Store order ID
                            paidByCredits: paidByCredits
                        });
                    }
                });
    
                const userIds = Object.keys(userCreditOrders);
                userIds.forEach((userId) => {
                    getUserData(userId, function (name) {
                        // Add a record for each order for the user
                        userCreditOrders[userId].forEach(order => {
                            csvData.push([userId, name, order.orderId, order.paidByCredits]); // Include order ID
                        });
    
                        // After processing all users' data, download the CSV
                        if (userId === userIds[userIds.length - 1]) {
                            downloadCSV("credit_purchase_report.csv", csvData);
                        }
                    });
                });
            },
            error: function (error) {
                console.error('Error generating credit purchase report:', error);
            }
        });
    });
    
    
    // Function to fetch categories and populate the select dropdown
function fetchCategories() {
    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'categories' }]
            }
        }),
        success: function(data) {
            const categorySelect = $('#categorySelect');
            data.forEach(doc => {
                const category = doc.document.fields;
                const categoryId = category.categoryId.stringValue; // Assuming this is the field name
                const categoryName = category.name.stringValue; // Assuming you have a name field
                categorySelect.append(`<option value="${categoryId}">${categoryName}</option>`);
            });
        },
        error: function(error) {
            console.error('Error fetching categories:', error);
        }
    });
}

// Fetch categories on page load
$(document).ready(function() {
    fetchCategories();
});

// Generate Current Stock Report
$('#generateCurrentStockReport').click(function () {
    const selectedCategory = $('#categorySelect').val();
    let filter = null;

    // Build filter only if a specific category is selected
    if (selectedCategory !== 'all') {
        filter = {
            fieldFilter: {
                field: { fieldPath: 'categoryId' },
                op: 'EQUAL',
                value: { stringValue: selectedCategory }
            }
        };
    }

    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'products' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'isActivated' },
                                    op: 'EQUAL',
                                    value: { booleanValue: true }
                                }
                            },
                            ...(filter ? [filter] : []) // Add filter if it exists
                        ]
                    }
                }
            }
        }),
        success: function(data) {
            let reportData = [["Product ID", "Title", "Description", "Price", "Quantity", "Image URL", "Category ID"]];
            data.forEach(doc => {
                const product = doc.document.fields;
                reportData.push([
                    product.productId.stringValue,
                    product.title.stringValue,
                    product.description.stringValue,
                    product.price.integerValue,
                    product.quantity.integerValue,
                    product.imageUrl.stringValue,
                    product.categoryId.stringValue // You can change this to the category name if needed
                ]);
            });
            downloadCSV("current_stock_report.csv", reportData); // Function to download the CSV
        },
        error: function(error) {
            console.error('Error generating current stock report:', error);
        }
    });
});

// Generate High Stock Report
$('#generateHighStockReport').click(function () {
    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'products' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'quantity' },
                        op: 'GREATER_THAN',
                        value: { integerValue: 100 }
                    }
                }
            }
        }),
        success: function(data) {
            let reportData = [["Product ID", "Title", "Description", "Price", "Quantity", "Image URL", "Category ID"]];
            data.forEach(doc => {
                const product = doc.document.fields;
                reportData.push([
                    product.productId.stringValue,
                    product.title.stringValue,
                    product.description.stringValue,
                    product.price.integerValue,
                    product.quantity.integerValue,
                    product.imageUrl.stringValue,
                    product.categoryId.stringValue // You can change this to the category name if needed
                ]);
            });
            downloadCSV("high_stock_report.csv", reportData); // Function to download the CSV
        },
        error: function(error) {
            console.error('Error generating high stock report:', error);
        }
    });
});

// Generate Low Stock Report
$('#generateLowStockReport').click(function () {
    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'products' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'quantity' },
                        op: 'LESS_THAN',
                        value: { integerValue: 15 }
                    }
                }
            }
        }),
        success: function(data) {
            let reportData = [["Product ID", "Title", "Description", "Price", "Quantity", "Image URL", "Category ID"]];
            data.forEach(doc => {
                const product = doc.document.fields;
                reportData.push([
                    product.productId.stringValue,
                    product.title.stringValue,
                    product.description.stringValue,
                    product.price.integerValue,
                    product.quantity.integerValue,
                    product.imageUrl.stringValue,
                    product.categoryId.stringValue // You can change this to the category name if needed
                ]);
            });
            downloadCSV("low_stock_report.csv", reportData); // Function to download the CSV
        },
        error: function(error) {
            console.error('Error generating low stock report:', error);
        }
    });
});


// Fetch and generate report for all customers
$('#generateAllCustomersReport').click(function () {
    const fromDate = $('#allFromDate').val();
    const toDate = $('#allToDate').val();

    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'orders' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'GREATER_THAN_OR_EQUAL',
                                    value: { stringValue: fromDate + "T00:00:00Z" }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'LESS_THAN_OR_EQUAL',
                                    value: { stringValue: toDate + "T23:59:59Z" }
                                }
                            }
                        ]
                    }
                }
            }
        }),
        success: function (data) {
            console.log(data);
            let csvData = [["User ID", "Name", "Order ID", "Order Date", "Order Total", "Product Details"]];
            const userOrders = {};

            data.forEach(doc => {
                if (doc.document) {
                    const order = doc.document.fields;
                    const userId = order.userId.stringValue;
                    const orderItems = order.items.arrayValue.values;
                    const orderId = order.orderId.stringValue;
                    const orderDate = order.orderDate.stringValue;
                    const orderTotal = order.orderTotal.integerValue;

                    // Prepare a string to summarize the product details
                    let productDetails = orderItems.map(item => {
                        const productName = item.mapValue.fields.productName.stringValue;
                        const quantity = item.mapValue.fields.quantity.integerValue;
                        const price = item.mapValue.fields.price.integerValue;
                        return `${productName} (Qty: ${quantity}, Price: ₹${price})`;
                    }).join("; "); // Join with a semicolon for better readability

                    // Push a new row to csvData for each order
                    if (!userOrders[userId]) {
                        userOrders[userId] = [];
                    }
                    userOrders[userId].push({
                        orderId: orderId,
                        orderDate: orderDate,
                        orderTotal: orderTotal,
                        productDetails: productDetails
                    });
                }
            });

            const userIds = Object.keys(userOrders);
            userIds.forEach((userId, index) => {
                getUserData(userId, function (name) {
                    userOrders[userId].forEach(order => {
                        csvData.push([userId, name, order.orderId, order.orderDate, order.orderTotal, order.productDetails]);
                    });

                    // After all users' data has been added, download the CSV
                    if (index === userIds.length - 1) {
                        downloadCSV("all_customers_report.csv", csvData);
                    }
                });
            });
        },
        error: function (error) {
            console.error('Error generating all customers report:', error);
        }
    });
});



function fetchsalesCategories() {
    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'categories' }]
            }
        }),
        success: function(data) {
            const categorySelect = $('#salescategorySelect');
            data.forEach(doc => {
                const category = doc.document.fields;
                const categoryId = category.categoryId.stringValue; // Assuming this is the field name
                const categoryName = category.name.stringValue; // Assuming you have a name field
                categorySelect.append(`<option value="${categoryId}">${categoryName}</option>`);
            });
        },
        error: function(error) {
            console.error('Error fetching categories:', error);
        }
    });
}

// Fetch categories on page load
$(document).ready(function() {
    fetchsalesCategories();
});


$('#generateAllSalesCatWiseReport').click(function () {
    const fromsalesDate = $('#allsalescatFromDate').val();
    const tosalesDate = $('#allsalescatToDate').val();
    const selectedCategoryId = $('#salescategorySelect').val();

    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'orders' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'GREATER_THAN_OR_EQUAL',
                                    value: { stringValue: fromsalesDate + "T00:00:00Z" }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'LESS_THAN_OR_EQUAL',
                                    value: { stringValue: tosalesDate + "T23:59:59Z" }
                                }
                            }
                        ]
                    }
                }
            }
        }),
        success: function (data) {
            console.log(data);
            let csvData = [["User ID", "Name", "Order ID", "Order Date", "Order Total"]];
            const userOrders = {};

            // Fetch products category info asynchronously and then process orders
            let categoryPromises = [];

            data.forEach(doc => {
                if (doc.document) {
                    const order = doc.document.fields;
                    const orderId = order.orderId.stringValue;
                    const orderDate = order.orderDate.stringValue;
                    const orderTotal = order.orderTotal.integerValue;
                    const userId = order.userId.stringValue;

                    const orderItems = order.items.arrayValue.values;
                    orderItems.forEach(item => {
                        const productId = item.mapValue.fields.productId.stringValue;

                        // Fetch the product details to get the categoryId
                        categoryPromises.push($.ajax({
                            url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents/products/${productId}`,
                            method: 'GET',
                            success: function (productData) {
                                const productCategoryId = productData.fields.categoryId.stringValue;

                                // If category matches, push the order into userOrders
                                if (selectedCategoryId === "" || productCategoryId === selectedCategoryId) {
                                    if (!userOrders[userId]) {
                                        userOrders[userId] = {};
                                    }
                                    if (!userOrders[userId][orderId]) {
                                        userOrders[userId][orderId] = {
                                            orderDate: orderDate,
                                            orderTotal: orderTotal
                                        };
                                    }
                                }
                            },
                            error: function (error) {
                                console.error('Error fetching product details:', error);
                            }
                        }));
                    });
                }
            });

            // Wait for all category lookups to finish before generating the CSV
            Promise.all(categoryPromises).then(() => {
                
                const userIds = Object.keys(userOrders);

                userIds.forEach((userId, index) => {
                    getUserData(userId, function (name) {
                        const orders = userOrders[userId];

                        for (const orderId in orders) {
                            const order = orders[orderId];
                            csvData.push([userId, name, orderId, order.orderDate, order.orderTotal]);
                        }

                        // After all users' data has been added, download the CSV
                        if (index === userIds.length - 1) {
                            downloadCSV("sales_categorywise_report.csv", csvData);
                        }
                    });
                });
            });
        },
        error: function (error) {
            console.error('Error generating category-wise sales report:', error);
        }
    });
});

$('#generateTop10Report').click(function () {
    const fromDate = $('#fromtop10prodDate').val();
    const toDate = $('#totop10prodDate').val();
    generateSalesReport(fromDate, toDate, 'top');
});

$('#generateBottom10Report').click(function () {
    const fromDate = $('#frombottom10prodDate').val();
    const toDate = $('#tobottom10prodDate').val();
    generateSalesReport(fromDate, toDate, 'bottom');
});

function generateSalesReport(fromDate, toDate, reportType) {
    $.ajax({
        url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents:runQuery`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'orders' }],
                where: {
                    compositeFilter: {
                        op: 'AND',
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'GREATER_THAN_OR_EQUAL',
                                    value: { stringValue: fromDate + "T00:00:00Z" }
                                }
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: 'orderDate' },
                                    op: 'LESS_THAN_OR_EQUAL',
                                    value: { stringValue: toDate + "T23:59:59Z" }
                                }
                            }
                        ]
                    }
                }
            }
        }),
        success: function (data) {
            const productSales = {};

            data.forEach(doc => {
                if (doc.document) {
                    const order = doc.document.fields;
                    const orderItems = order.items.arrayValue.values;

                    orderItems.forEach(item => {
                        const productId = item.mapValue.fields.productId.stringValue;
                        const quantity = parseInt(item.mapValue.fields.quantity.integerValue); // Convert to integer

                        // Sum the quantity for each product
                        if (!productSales[productId]) {
                            productSales[productId] = 0;
                        }
                        productSales[productId] += quantity;
                    });
                }
            });

            // Convert productSales to an array and sort it by total quantity sold
            let sortedSales;
            if (reportType === 'top') {
                sortedSales = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10 descending
            } else {
                sortedSales = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 10); // Bottom 10 ascending
            }

            console.log(sortedSales)
            // Fetch product details for selected products
            const fetchProductPromises = [];
            const productsWithDetails = [];

            sortedSales.forEach(([productId, totalQuantity]) => {
                fetchProductPromises.push($.ajax({
                    url: `https://firestore.googleapis.com/v1/projects/online-shopping-psiog/databases/(default)/documents/products/${productId}`,
                    method: 'GET',
                    success: function (productData) {
                        const productName = productData.fields.title.stringValue;
                        productsWithDetails.push({ productName, totalQuantity });
                    }
                }));
            });

            // Wait for all product name fetches to finish
            Promise.all(fetchProductPromises).then(() => {
                if (reportType === 'top') {
                    console.log("Top 10 Selling Products:", productsWithDetails);
                    downloadCsv(productsWithDetails, 'Top_10_Selling_Products');
                    } else {
                    console.log("Bottom 10 Selling Products:", productsWithDetails);
                    downloadCsv(productsWithDetails, 'Bottom_10_Selling_Products');
                }

                // You can now display these products in the UI or export them as needed
            });
        },
        error: function (error) {
            console.error('Error fetching sales data:', error);
        }
    });
}


function downloadCsv(data, filename) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Product Name,Total Quantity Sold\n";

    data.forEach(item => {
        const row = `${item.productName},${item.totalQuantity}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

});