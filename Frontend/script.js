// script.js (Updated for Backend Integration)
function changeMainImage(thumbnail) {
  const productBlock = thumbnail.closest('.product-block');
  const mainImg = productBlock.querySelector('.main-img');
  mainImg.src = thumbnail.src;
}

async function addToCart(productId, quantity = 1) {
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Error adding to cart');
      return;
    }
    window.location.href = '/cart';
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Server error');
  }
}
// In script.js or a new frontend script
async function loadProducts() {
  const response = await fetch('/api/products');
  const products = await response.json();
  const container = document.querySelector('.product-showcase');
  container.innerHTML += products.map(product => `
    <div class="product-block">
      <div class="product-images">
        <img src="${product.image}" class="main-img" alt="${product.name}">
        <!-- Add thumbnails if needed -->
      </div>
      <div class="product-details">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">₹${product.price}</p>
        <button class="add-to-cart" onclick="addToCart('${product._id}')">Add to Cart</button>
      </div>
    </div>
  `).join('');
}
document.addEventListener('DOMContentLoaded', loadProducts);