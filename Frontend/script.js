// Add to existing script.js
async function addToWishlist(productId) {
  try {
    const response = await fetch('/api/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    if (!response.ok) throw new Error('Error adding to wishlist');
    alert('Added to wishlist');
  } catch (error) {
    alert('Error');
  }
}

async function removeFromWishlist(productId) {
  await fetch(`/api/wishlist/remove/${productId}`, { method: 'DELETE' });
  alert('Removed from wishlist');
}

async function loadWishlist() {
  const response = await fetch('/api/wishlist');
  const wishlist = await response.json();
  const container = document.querySelector('.product-container');
  container.innerHTML = wishlist.items.map(product => `
    <div class="wrapper" data-product-id="${product._id}">
      <div class="wishlist-btn"><i class="material-icons" onclick="removeFromWishlist('${product._id}')">favorite</i></div>
      <!-- Product content -->
    </div>
  `).join('');
}

if (window.location.pathname.includes('wishlist')) {
  document.addEventListener('DOMContentLoaded', loadWishlist);
}

// Update category scripts to use addToWishlist instead of localStorage
document.addEventListener("DOMContentLoaded", () => {
  const wishlistBtn = document.querySelector(".wishlist-btn i");
  const productId = document.querySelector(".wrapper").dataset.productId;

  wishlistBtn.addEventListener("click", () => {
    if (wishlistBtn.classList.contains('active')) {
      removeFromWishlist(productId);
      wishlistBtn.textContent = "favorite_border";
      wishlistBtn.classList.remove("active");
      wishlistBtn.style.color = "white";
    } else {
      addToWishlist(productId);
      wishlistBtn.textContent = "favorite";
      wishlistBtn.classList.add("active");
      wishlistBtn.style.color = "#ff4d6d";
    }
  });
});