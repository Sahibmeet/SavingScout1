document.addEventListener("DOMContentLoaded", function () {
    const searchButton = document.getElementById("search");
    const queryInput = document.getElementById("query");
    const postalCodeInput = document.getElementById("postal_code");
    const groceryList = document.getElementById("grocery-list");

    searchButton.addEventListener("click", function () {
        const query = queryInput.value;
        const postalCode = postalCodeInput.value;

        if (query && postalCode) {
            fetch(`/?query=${query}&postal_code=${postalCode}`)
                .then(response => response.json())
                .then(data => {
                    displayGroceryItems(data);
                })
                .catch(error => {
                    console.error("Error fetching grocery items:", error);
                });
        }
    });

    function displayGroceryItems(items) {
        groceryList.innerHTML = "";
        items.forEach(item => {
            const itemElement = document.createElement("div");
            itemElement.innerHTML = `
                <h2>${item.name}</h2>
                <p>Price: ${item.price}</p>
                <p>Description: ${item.description}</p>
            `;
            groceryList.appendChild(itemElement);
        });
    }
});
