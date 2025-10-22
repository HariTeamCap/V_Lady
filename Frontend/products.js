document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');

    fetch('http://localhost:3000/api/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => {
                const productElement = document.createElement('div');
                productElement.classList.add('product');

                const productName = document.createElement('h2');
                productName.textContent = product.name;

                const productDescription = document.createElement('p');
                productDescription.textContent = product.description;

                const productPrice = document.createElement('p');
                productPrice.textContent = `$${product.price}`;

                const productImage = document.createElement('img');
                productImage.src = `http://localhost:3000/${product.images[0]}`;

                productElement.appendChild(productImage);
                productElement.appendChild(productName);
                productElement.appendChild(productDescription);
                productElement.appendChild(productPrice);

                productsContainer.appendChild(productElement);
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
});