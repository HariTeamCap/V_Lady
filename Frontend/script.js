function changeMainImage(thumbnail) {
  const productBlock = thumbnail.closest('.product-block');
  const mainImg = productBlock.querySelector('.main-img');
  mainImg.src = thumbnail.src;
}

function addToCart(name, price, image) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  let existingProduct = cart.find(item => item.name === name);
  if (existingProduct) {
    if(existingProduct.quantity < 20){
      existingProduct.quantity += 1;
      existingProduct.totalPrice = existingProduct.price * existingProduct.quantity;
    }
  } else {
    cart.push({
      name: name,
      price: price,
      image: image,
      quantity: 1,
      totalPrice: price
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = "cart.html";
}