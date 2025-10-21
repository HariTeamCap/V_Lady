document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Set username in profile
    document.getElementById('profile-username').textContent = getCurrentUsername();

    // Load initial data
    loadOrders();
    loadAddresses();

    // Setup menu navigation
    setupMenuNavigation();
    
    // Setup address modal
    setupAddressModal();
});

// Menu Navigation
function setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.profile-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');

            // Show corresponding section
            const sectionId = item.dataset.section + '-section';
            document.querySelectorAll('.profile-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Load Orders
async function loadOrders() {
    try {
        const response = await fetch('/api/orders', {
            credentials: 'include'
        });
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        document.querySelector('.orders-list').innerHTML = 
            '<p class="error">Failed to load orders. Please try again later.</p>';
    }
}

// Display Orders
function displayOrders(orders) {
    const ordersList = document.querySelector('.orders-list');
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div>
                    <h3>Order #${order._id}</h3>
                    <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                    <strong>Total: ₹${order.total}</strong>
                    <p>Status: ${order.status}</p>
                </div>
            </div>
            <div class="order-products">
                ${order.items.map(item => `
                    <div class="order-product">
                        <img src="${item.productId.image}" alt="${item.productId.name}">
                        <p>${item.productId.name}</p>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Load Addresses
async function loadAddresses() {
    try {
        const response = await fetch('/api/addresses', {
            credentials: 'include'
        });
        const addresses = await response.json();
        displayAddresses(addresses);
    } catch (error) {
        console.error('Error loading addresses:', error);
        document.querySelector('.addresses-list').innerHTML = 
            '<p class="error">Failed to load addresses. Please try again later.</p>';
    }
}

// Display Addresses
function displayAddresses(addresses) {
    const addressesList = document.querySelector('.addresses-list');
    if (!addresses || addresses.length === 0) {
        addressesList.innerHTML = '<p>No addresses found.</p>';
        return;
    }

    addressesList.innerHTML = addresses.map(address => `
        <div class="address-card">
            <div class="address-actions">
                <button onclick="editAddress('${address._id}')">
                    <i class="fa fa-edit"></i>
                </button>
                <button onclick="deleteAddress('${address._id}')">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
            <h3>${address.name}</h3>
            <p>${address.fullName}</p>
            <p>${address.street}</p>
            <p>${address.city}, ${address.state}</p>
            <p>PIN: ${address.pincode}</p>
            <p>Phone: ${address.phone}</p>
        </div>
    `).join('');
}

// Setup Address Modal
function setupAddressModal() {
    const modal = document.getElementById('address-modal');
    const addBtn = document.getElementById('add-address-btn');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('address-form');

    // Open modal on add button click
    addBtn.onclick = () => {
        document.getElementById('modal-title').textContent = 'Add New Address';
        form.reset();
        document.getElementById('address-id').value = '';
        modal.style.display = 'block';
    };

    // Close modal on X click
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close modal on outside click
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Handle form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        const addressId = document.getElementById('address-id').value;
        const addressData = {
            name: document.getElementById('address-name').value,
            fullName: document.getElementById('full-name').value,
            phone: document.getElementById('phone').value,
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            pincode: document.getElementById('pincode').value
        };

        try {
            const response = await fetch(`/api/addresses${addressId ? '/' + addressId : ''}`, {
                method: addressId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(addressData)
            });

            if (response.ok) {
                modal.style.display = 'none';
                loadAddresses(); // Reload addresses
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to save address');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        }
    };
}

// Edit Address
async function editAddress(addressId) {
    try {
        const response = await fetch(`/api/addresses/${addressId}`, {
            credentials: 'include'
        });
        const address = await response.json();

        // Fill form with address data
        document.getElementById('modal-title').textContent = 'Edit Address';
        document.getElementById('address-id').value = address._id;
        document.getElementById('address-name').value = address.name;
        document.getElementById('full-name').value = address.fullName;
        document.getElementById('phone').value = address.phone;
        document.getElementById('street').value = address.street;
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('pincode').value = address.pincode;

        // Show modal
        document.getElementById('address-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading address:', error);
        alert('Failed to load address details');
    }
}

// Delete Address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }

    try {
        const response = await fetch(`/api/addresses/${addressId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            loadAddresses(); // Reload addresses
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete address');
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
    }
}