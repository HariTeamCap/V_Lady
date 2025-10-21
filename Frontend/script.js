
document.addEventListener('DOMContentLoaded', async () => {
  const productContainer = document.querySelector('.product-container');
  const navLinks = document.querySelector('.nav-links');

  let user = null;

  // Check authentication status
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      user = await response.json();
    }
  } catch (error) {
    console.error('Error fetching user status:', error);
  }

  // Update navigation with login/logout button
  const authLink = document.createElement('li');
  if (user) {
    authLink.innerHTML = `<a href="#" id="logout-btn"><i class="fa fa-sign-out"></i></a>`;
    navLinks.appendChild(authLink);

    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/api/logout');
      window.location.reload();
    });
  } else {
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    if (!loginLink) {
        authLink.innerHTML = `<a href="login.html"><i class="fa fa-user"></i></a>`;
        navLinks.appendChild(authLink);
    }
  }

  // Fetch and render products
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    productContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
  }

  function renderProducts(products) {
    productContainer.innerHTML = '';
    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'wrapper';
      productCard.dataset.productId = product._id;

      productCard.innerHTML = `
        <div class="wishlist-btn">
          <i class="material-icons">favorite_border</i>
        </div>
        <div class="container">
          <div class="top">
            <a href="productdetails.html?id=${product._id}">
              <img src="${product.image}" alt="${product.name}"/>
            </a>
          </div>
          <div class="bottom">
            <div class="left">
              <div class="details">
                <h1>${product.name}</h1>
                <p class="discounted-price">₹${product.price}</p>
              </div>
              <div class="buy"><i class="material-icons">add_shopping_cart</i></div>
            </div>
          </div>
        </div>
      `;

      productContainer.appendChild(productCard);

      // Add to wishlist
      const wishlistBtn = productCard.querySelector('.wishlist-btn i');
      wishlistBtn.addEventListener('click', async () => {
        if (!user) {
          alert('Please login to add items to your wishlist.');
          window.location.href = 'login.html';
          return;
        }
        try {
          const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product._id }),
          });
          if (response.ok) {
            wishlistBtn.style.color = '#ff4d6d';
            alert('Added to wishlist!');
          } else {
            alert('Failed to add to wishlist.');
          }
        } catch (error) {
          console.error('Error adding to wishlist:', error);
        }
      });

      // Add to cart
      const addToCartBtn = productCard.querySelector('.buy i');
      addToCartBtn.addEventListener('click', async () => {
        if (!user) {
          alert('Please login to add items to your cart.');
          window.location.href = 'login.html';
          return;
        }
        try {
          const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product._id, quantity: 1 }),
          });
          if (response.ok) {
            alert('Added to cart!');
          } else {
            alert('Failed to add to cart.');
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
        }
      });
    });
  }
});
