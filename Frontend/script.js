document.addEventListener("DOMContentLoaded", () => {
  const productWrappers = document.querySelectorAll(".wrapper");

  productWrappers.forEach(wrapper => {
    const productId = wrapper.dataset.productId;
    const productName = wrapper.querySelector(".details h1").textContent;
    const productPrice = wrapper.querySelector(".details .discounted-price").textContent;
    const productMrp = wrapper.querySelector(".details .mrp span").textContent;
    const productImage = wrapper.querySelector(".top img").src;

    const product = {
      id: productId,
      name: productName,
      price: productPrice,
      mrp: productMrp,
      image: productImage,
      quantity: 1
    };

    // ----- Wishlist -----
    const wishlistBtn = wrapper.querySelector(".wishlist-btn i");
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    // If already in wishlist, mark active
    if (wishlist.find(p => p.id === productId)) {
      wishlistBtn.textContent = "favorite";
      wishlistBtn.style.color = "#ff4d6d";
    }

    wishlistBtn.addEventListener("click", () => {
      let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      const exists = wishlist.find(p => p.id === productId);

      if (exists) {
        wishlist = wishlist.filter(p => p.id !== productId);
        wishlistBtn.textContent = "favorite_border";
        wishlistBtn.style.color = "white";
      } else {
        wishlist.push(product);
        wishlistBtn.textContent = "favorite";
        wishlistBtn.style.color = "#ff4d6d";
      }

      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    });

    // ----- Add to Cart -----
    const addToCartBtn = wrapper.querySelector(".buy i");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existing = cart.find(p => p.id === productId);

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({ ...product });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`${productName} added to cart 🛒`);
      });
    }
    
    // videos.js

// === Lazy Loading ===
const lazyVideos = document.querySelectorAll('.lazy-video');

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      if (!video.src) {
        video.src = video.dataset.src;
      }
    }
  });
}, {
  rootMargin: '100px', // start loading just before visible
  threshold: 0.25
});

lazyVideos.forEach(video => videoObserver.observe(video));

// === One-at-a-Time Playback ===
const allVideos = document.querySelectorAll('video');

allVideos.forEach(video => {
  video.addEventListener('play', () => {
    allVideos.forEach(v => {
      if (v !== video) v.pause();
    });
  });
});
    // ----- Buy Now -----
    const buyNowBtn = wrapper.querySelector(".buy-now");
    if (buyNowBtn) {
      buyNowBtn.addEventListener("click", () => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existing = cart.find(p => p.id === productId);
        if (!existing) cart.push({ ...product });
        localStorage.setItem("cart", JSON.stringify(cart));
        window.location.href = "cart.html";
      });
    }
  });
});