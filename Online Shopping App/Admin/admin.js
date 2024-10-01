
        document.getElementById('inventoryTab').onclick = function() {
            document.getElementById('inventorySection').style.display = 'block';
            document.getElementById('customerSection').style.display = 'none';
            document.getElementById('reportsSection').style.display = 'none';
            document.getElementById('categorySection').style.display = 'none';
        };

        document.getElementById('customerTab').onclick = function() {
            document.getElementById('inventorySection').style.display = 'none';
            document.getElementById('customerSection').style.display = 'block';
            document.getElementById('reportsSection').style.display = 'none';
            document.getElementById('categorySection').style.display = 'none';
        };

        document.getElementById('reportsTab').onclick = function() {
            document.getElementById('inventorySection').style.display = 'none';
            document.getElementById('customerSection').style.display = 'none';
            document.getElementById('reportsSection').style.display = 'block';
            document.getElementById('categorySection').style.display = 'none';
        };

        document.getElementById('categoryTab').onclick = function() {
            document.getElementById('inventorySection').style.display = 'none';
            document.getElementById('customerSection').style.display = 'none';
            document.getElementById('reportsSection').style.display = 'none';
            document.getElementById('categorySection').style.display = 'block';
        };

        // Initialize the inventory and categories
        async function init() {
            await initializeInventory(); // Initialize inventory if necessary
            await initializeCategories(); // Initialize categories if necessary
            fetchInventory(); // Fetch existing inventory
            fetchCategories(); // Fetch existing categories
        }

        init(); // Call the init function on page load
    