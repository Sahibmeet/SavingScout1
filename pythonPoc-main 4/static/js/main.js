document.addEventListener("DOMContentLoaded", (event) => {


  // DOM is loaded

  if (document.getElementById('search-btn-global')) {
    document.getElementById('search-btn-global').addEventListener('click', () => {
      // let searchKeyword = document.getElementById('search-text').value;
      localStorage.setItem('search-keyword', true);
    });
  }
  const urlObject = new URL(window.location.href);
  const searchParams = urlObject.searchParams;
  const globalSearchValue = searchParams.get("global-search");
  if (globalSearchValue != null) {
    localStorage.setItem('search-keyword', true);
  } else {
    localStorage.removeItem('search-keyword');
  }

  if (localStorage.getItem('search-keyword')) {
    const runSearch = async () => {
      let searchKeyword = document.getElementById("search-text").value;
      var searchKeywordPostCode = document.getElementById("search-text-postcode").value;

      console.log(`This is searched`);
      try {
        const response = await fetch("https://backflipp.wishabi.com/flipp/flyers?postal_code=L6P4E6");
        if (response.status === 200) {
          const flyers = await response.json();

          const productPromises = flyers.flyers.map(async (res, i) => {
            try {
              const productResponse = await Promise.race([
                fetch(`https://backflipp.wishabi.com/flipp/flyers/${res.id}`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
              ]);

              if (productResponse.status === 200) {
                const productListResponse = await productResponse.json();

                if (productListResponse && productListResponse.items) {
                  function formatDate(dateString) {
                    var dateString = dateString; // ISO 8601 format
                    var dateObject = new Date(dateString);
                    var year = dateObject.getFullYear();
                    var month = dateObject.getMonth() + 1; // Months are 0-based, so add 1
                    var day = dateObject.getDate();
                    var hours = dateObject.getHours();
                    var minutes = dateObject.getMinutes();
                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                  }
                  return {
                    id: res.id,
                    merchant: res.merchant,
                    merchant_logo: res.merchant_logo,
                    merchant_valid_from: formatDate(res.valid_from),
                    merchant_valid_to: formatDate(res.valid_to),
                    merchat_postal_code: res.postal_code,
                    merchant_thumbnail: res.thumbnail_url,
                    products: productListResponse.items.map((item, j) => ({
                      id: item.id,
                      name: item.name,
                      product_img: item.cutout_image_url,
                      valid_to: formatDate(item.valid_to),
                      valid_from: formatDate(item.valid_from),
                      price: item.price
                    }))
                  };
                } else {
                  console.error(`Error fetching product data: Malformed JSON response`);
                  return null;
                }
              } else {
                // console.error(`Error fetching product data: Status ${productResponse.status}`);
                return null;
              }
            } catch (error) {
              // console.error(`Error fetching product data: ${error}`);
              return null;
            }
          });

          const productResults = await Promise.allSettled(productPromises);

          const suggestionMerchant = productResults
            .filter(result => result.status === "fulfilled" && result.value !== null)
            .map(result => result.value);
          console.log(suggestionMerchant);
          // Filter and display results based on the search keyword

          var flagCheck = false;
          var html = '';
          var merchantHtml = '';
          countSuggestion = 0;
          countSuggestionNest = 0;
          suggestionMerchant.every((item, index) => {
            console.log("Workign again ------12345");
            if (item.merchant.toLowerCase() === searchKeyword.toLowerCase()) {
              merchantHtml += `<div class="col-md-2 box_flyer aos-init aos-animate ml-5 p-3 merchant-search-cards"   data-aos-anchor-placement="top-center">
            <div class="container-fluid col-xs-12" style="    background-color: #fff;
            border: 4px solid #1DC2E8;
            border-radius: 20px;
            padding: 15px;
            margin: 15px 0;">
                <!-- Flyer content goes here -->
                <div class="text-center" style="margin-bottom: 20px;">
                <span id='item-logo'>
                    <img style="height: 50px; width: 50px; object-fit: contain;" src="${item.merchant_logo}" alt="${item.merchant}">
                    </span>
                </div>
                <div class="col-xs-6 text-center" style="height: 100px;width: 100%;">
                    <a href="/view_flyer/https://backflipp.wishabi.com/flipp/flyers/${item.flyer_run_id}">
                        <img style="width: 100%; height: 100%; object-fit: contain;" src="${item.merchant_thumbnail}">
                    </a>
                </div>
                <div class="col-xs-4 text-center" style="margin-top: 20px; font-variant: small-caps;">
                    <p><strong>Valid From:</strong> ${formatDate(item.merchant_valid_from)}</p>
                    <p><strong>Valid To:</strong> ${formatDate(item.merchant_valid_to)}</p>
                    <!-- In your HTML template -->
                    <div class="get-directions" data-merchant="${item.merchant}">
                    <strong>Store Address:</strong> <span id="storeAddress">Calculating...</span>
                    <strong>Distance:</strong><span id="distance">Calculating...</span>
                        </div>
                </div>
                <p style='text-align:center'>
                <button 
                  class="btn btn-light get-directions"
                  data-merchant="${item.merchant}"
                >
                  Get Directions
                  <a href="#">
                    <img
                      src="https://cdn.iconscout.com/icon/free/png-512/free-directions-1780532-1517622.png?f=webp&w=512"
                      alt="Get Directions"
                      width="32"
                      height="32"
                    />
                  </a>
                </button>
              </p>
                <div class="col-lg-12">
                
                    <a href="view_flyer/https://backflipp.wishabi.com/flipp/flyers/${item.id}%3Fstore-name=${item.merchant}">
                        <button class="btn btn-primary view-allp" style="width: 100%;">View all Products</button>
                    </a>
                </div>
            </div>
        </div>`;
              item.products.every((product, i) => {
                html += `<div class="col-md-3 box ml-1 shopping-item" 
          data-aos-anchor-placement="top-center">
          
          <div class="flyer-item searched-flyer-item" style="font-variant: small-caps;">
          <span id="merchant_logo_searched_img">
          <img src="${item.merchant_logo}" alt="Item Image" class="merchant_logo_searched"></span>
          <img src="${product.product_img}" alt="Item Image" class="img-fluid my-img" id="flyer-item-img">
          <p class="mb-1"><strong>Item Name:</strong> <span class="item-name" id="flyer-item-name">  ${product.name}</span></p>
          <p class="mb-1"><strong>Merchant Name:</strong> ${item.merchant}</p>
          <p class="mb-1"><strong>Price:</strong><span id="flyer-item-price"> $${product.price}</span></p>
          <p class="mb-1"><strong>Valid From:</strong><span id="flyer-item-valid-from"> ${formatDate(product.valid_from)}</span></p>
          <p class="mb-1"><strong>Valid To:</strong><span id="flyer-item-valid-to"> ${formatDate(product.valid_to)}</span></p>
          <div class="get-directions" data-merchant="${item.merchant}">
          <strong>Store Address:</strong> <span id="storeAddress">Calculating...</span>
          <strong>Distance:</strong><span id="distance">Calculating...</span>
              </div>
          <input type="hidden" value="${product.id}" id="id">
          <input type="hidden" value="${item.merchant}" id="store-name">
          </div>
          </div>`;
                if (countSuggestionNest === 40) {
                  console.log("It is in false statement");
                  return false;
                }
                return true;
              });
              countSuggestionNest = 0;
              flagCheck = true;

              console.log(`Length of suggestion array is ${suggestionMerchant.length} ${countSuggestion}`);


            } else {
              // Display products for other merchants that contain the search keyword
              item.products.every((product, i) => {
                if (product.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
                  html += `<div class="col-md-3 box ml-1 shopping-item" 
              data-aos-anchor-placement="top-center">
              <div class="flyer-item searched-flyer-item" style="font-variant: small-caps;">
              <span id="merchant_logo_searched_img">
              <img src="${item.merchant_logo}" alt="Item Image" class="merchant_logo_searched"></span>
              <img src="${product.product_img}" alt="Item Image" class="img-fluid my-img" id="flyer-item-img">
              <p class="mb-1"><strong>Item Name:</strong> <span class="item-name" id="flyer-item-name">${product.name}</span></p>
              <p class="mb-1"><strong>Merchant Name:</strong> ${item.merchant}</p>
              <p class="mb-1"><strong>Price:</strong><span id="flyer-item-price"> $${product.price}</span></p>
              <p class="mb-1"><strong>Valid From:</strong><span id="flyer-item-valid-from"> ${formatDate(product.valid_from)}</span></p>
              <p class="mb-1"><strong>Valid To:</strong><span id="flyer-item-valid-to"> ${formatDate(product.valid_to)}</span></p>
              <div class="get-directions" data-merchant="${item.merchant}">
              <strong>Store Address:</strong> <span id="storeAddress">Calculating...</span>
              <strong>Distance:</strong><span id="distance">Calculating...</span>
                  </div>
              <input type="hidden" value="${product.id}" id="id">
              <input type="hidden" value="${item.merchant}" id="store-name">
              </div>
              </div>`;
                  flagCheck = true;
                }
                countSuggestionNest++;
                if (countSuggestionNest === 40) {
                  console.log("It is in false statement");
                  return false;
                }
                return true;
              });
              countSuggestionNest = 0;

            }
            countSuggestion++;
            console.log(countSuggestion, "----------------", suggestionMerchant.length)
            if (countSuggestion == 100) {
              return false;
            }
            if (countSuggestion === suggestionMerchant.length) {
              console.log("It is in false statement");

              return false;
            }
            return true;
          });
          if (!flagCheck) {
            document.getElementById('loader-flyer').style.display = "none";
            document.getElementById("loader-flyer-no-data").style.display = "flex";
          } else {
            document.getElementById('loader-flyer').style.display = "none";
            if (!merchantHtml == '') {
              document.getElementById("title-merchant").style.display = "block";
            }
            function runDirection(){
              setTimeout(function(){
                const userPostalCode = searchKeywordPostCode;
                // Call the function to update addresses and distances for all merchants.
                updateAllDistancesAndAddresses(userPostalCode);
        
                var directionIcons = document.querySelectorAll(".get-directions");
        
                directionIcons.forEach(function (icon) {
                  icon.addEventListener("click", function (event) {
                    event.preventDefault();
        
                    // Get the merchant name from the data attribute
                    var merchantName = icon.getAttribute("data-merchant");
        
                    // Open a new tab with Google Maps directions
                    var directionsUrl =
                      "https://www.google.com/maps/dir/?api=1&destination=" +
                      merchantName;
                    window.open(directionsUrl, "_blank");
                  });
                });
              },7000)
                // Geocode the user's postal code
                //geocodeUserPostalCode('{{ postal_code }}');  // Replace '{{ postal_code }}' with the actual user's postal code
        
                var btnenv = document.getElementsByClassName('view-allp');
                for(var j=0;j<btnenv.length;j++)
                  {
                    btnenv[j].addEventListener('click', (event) => {
              console.log("working for btn");
              var itemVal = event.target.parentNode.parentNode.parentNode;
              
              var address = itemVal.querySelector('#storeAddress').textContent;
              var distance = itemVal.querySelector('#distance').textContent;
              var thumbnailImg = itemVal.querySelector('#item-logo').innerHTML;
              var storeName = itemVal.querySelector('#store-name').textContent;
              var itemsArr = []
              if(localStorage.getItem('cart-extras')){
                console.log("working for this");
                var cartItems = JSON.parse(localStorage.getItem('cart-extras')) 
                for(var i=0;i<cartItems.length;i++){
                  itemsArr.push(cartItems[i]);
                }
                itemsArr.push({
                  address: address,
                  distance: distance,
                  thumbnailImg: thumbnailImg,
                  storeName: storeName
              })
                localStorage.setItem('cart-extras', JSON.stringify(itemsArr));
              }
              else{
                console.log("working for else");
          
                localStorage.setItem('cart-extras', JSON.stringify([{
                  address: address,
                  distance: distance,
                  thumbnailImg: thumbnailImg,
                  storeName:storeName
              }]));
              }
             
          });
          }
        
              function updateAllDistancesAndAddresses(userPostalCode) {
                var flyerContainers = document.querySelectorAll("[data-merchant]");
        
                // Clear previous results
                document.getElementById("noResultsMessage").style.display = "none";
        
                // Geocode the user's postal code to get coordinates
                geocodeUserPostalCode(
                  userPostalCode,
                  function (userPostalCodeCoordinates) {
                    if (!userPostalCodeCoordinates) {
                      // Handle geocoding errors here
                      document.getElementById("noResultsMessage").style.display =
                        "block";
                    } else {
                      flyerContainers.forEach(function (container) {
                        var merchantName = container.getAttribute("data-merchant");
                        updateDistanceAndAddress(
                          merchantName,
                          userPostalCodeCoordinates,
                          container
                        );
                      });
        
                      // Sort the flyer containers based on distance
                      sortFlyersByDistance(flyerContainers);
                    }
                  }
                );
              }
        
              function geocodeUserPostalCode(postalCode, callback) {
                var geocoder = new google.maps.Geocoder();
        
                // Geocode the postal code to get its coordinates
                geocoder.geocode({ address: postalCode }, function (results, status) {
                  if (status === google.maps.GeocoderStatus.OK) {
                    var userPostalCodeCoordinates = results[0].geometry.location;
                    console.log("Postal Code coordinates:", userPostalCodeCoordinates);
                    callback(userPostalCodeCoordinates);
                  } else {
                    // Handle geocoding errors here
                    console.error(
                      "Geocode was not successful for the following reason: " + status
                    );
                    callback(null); // Pass null to indicate an error
                  }
                });
              }
        
              function calculateDistance(from, to) {
                // Convert latitude and longitude from degrees to radians
                const fromLatRad = from.lat() * (Math.PI / 180);
                const fromLngRad = from.lng() * (Math.PI / 180);
                const toLatRad = to.lat() * (Math.PI / 180);
                const toLngRad = to.lng() * (Math.PI / 180);
        
                // Earth's radius in kilometers
                const earthRadius = 6371;
        
                // Haversine formula
                const dLat = toLatRad - fromLatRad;
                const dLng = toLngRad - fromLngRad;
        
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(fromLatRad) *
                    Math.cos(toLatRad) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
        
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
                // Calculate the distance
                const distance = earthRadius * c;
        
                return distance.toFixed(2); // Return distance rounded to 2 decimal places
              }
        
              function updateDistanceAndAddress(
                merchantName,
                userPostalCodeCoordinates,
                container
              ) {
                // Create a PlacesService instance
                var placesService = new google.maps.places.PlacesService(
                  document.createElement("div")
                );
        
                // Define a request to search for the merchant by name
                var request = {
                  query: merchantName,
                  fields: ["name", "formatted_address", "geometry"],
                };
        
                // Use the PlacesService to search for the merchant
                placesService.textSearch(request, function (results, status) {
                  console.log("Results:", results); // Debug: Log the results
                  if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // Display the address and distance of the first result
                    if (results.length > 0) {
                      var closestResult = results[0];
                      var closestDistance = calculateDistance(
                        userPostalCodeCoordinates,
                        closestResult.geometry.location
                      );
                      // Loop through all results to find the closest one
                      for (var i = 1; i < results.length; i++) {
                        var currentResult = results[i];
                        var currentDistance = calculateDistance(
                          userPostalCodeCoordinates,
                          currentResult.geometry.location
                        );
                        if (currentDistance < closestDistance) {
                          closestResult = currentResult;
                          closestDistance = currentDistance;
                        }
                      }
        
                      // Display the closest address and its distance
                      console.log("Closest Address:", closestResult.formatted_address);
                      console.log("Closest Distance:", closestDistance);
        
                      // Update the address and distance within the specific container
                      var storeAddress = container.querySelector("#storeAddress");
                      var distanceElement = container.querySelector("#distance");
                      console.log(`THis is address thing ${storeAddress}`);
                      storeAddress.textContent = closestResult.formatted_address;
                      distanceElement.textContent = closestDistance + " km";
                    } else {
                      // No matching stores found
                      var storeAddress = container.querySelector("#storeAddress");
                      var distanceElement = container.querySelector("#distance");
                      storeAddress.textContent = "Not found";
                      distanceElement.textContent = "N/A";
                    }
                  } else {
                    // Error in Places API request
                    console.error("Error in Places API request:", status);
                  }
                });
              }
           
            // direction update dode ends
            }

            document.getElementById("title-item").style.display = "block";
            document.getElementsByClassName('append-flyers-search-cards')[0].innerHTML = merchantHtml;
            document.getElementsByClassName('append-search-cards')[0].innerHTML = html;
            runDirection();

            // direction update code start

            // Wrap your JavaScript code in a function to ensure it runs after the page is loaded.
        
              // Geocode the user's postal code
              //geocodeUserPostalCode('{{ postal_code }}');  // Replace '{{ postal_code }}' with the actual user's postal code

          
             



            var cart = [];
            var shoppingElements = document.getElementsByClassName('shopping-item');
            var imgSrc = document.getElementById("modal-flyer-img")
            var title = document.getElementById("modal-info-title")
            var price = document.getElementById("modal-info-price")
            var validFrom = document.getElementById("modal-info-valid-from")
            var validTo = document.getElementById("modal-info-valid-to")
            var modalId = document.getElementById("id-modal")
            var storeName = document.getElementById("store-modal")
            var address = document.getElementById("modal-address")
            var distance = document.getElementById("modal-distance")
            var thumbnailImg = document.getElementById("modal-icon")
            var checkItemExist;
            var flagCheckItemExist = false;

            for (let i = 0; i < shoppingElements.length; i++) {
              shoppingElements[i].addEventListener('click', (event) => {
                if (localStorage.getItem('order-items')) {
                  flagCheckItemExist = true
                  checkItemExist = JSON.parse(localStorage.getItem('order-items'))
                } else {
                  flagCheckItemExist
                }
                document.getElementsByClassName("cart-check")[0].classList.add("add-to-cart");
                if (shoppingElements[i].querySelector("#flyer-item-price").textContent == "" || shoppingElements[i].querySelector("#flyer-item-name").textContent == "") {
                  alert("Name Or Price is missing for this product can not be added");
                  return false;
                }
                if (flagCheckItemExist) {
                  for (var j = 0; j < checkItemExist.length; j++) {
                    if (parseInt(shoppingElements[i].querySelector("#id").value) == parseInt(checkItemExist[j].id)) {
                      document.getElementsByClassName("add-to-cart")[0].classList.remove("btn-primary");
                      document.getElementsByClassName("add-to-cart")[0].classList.add("btn-success");
                      document.getElementsByClassName("add-to-cart")[0].textContent = "Added to shopping cart";
                      document.getElementsByClassName("add-to-cart")[0].classList.remove("add-to-cart");
                      break;
                    } else {
                      document.getElementsByClassName("add-to-cart")[0].classList.add("btn-primary");
                      document.getElementsByClassName("add-to-cart")[0].classList.remove("btn-success");
                      document.getElementsByClassName("add-to-cart")[0].textContent = "Add to shopping cart";

                    }
                  }
                }
                document.getElementById("modal-product-info").style.display = "block";
                // Select child elements using querySelector
                imgSrc.setAttribute('src', shoppingElements[i].querySelector("#flyer-item-img").getAttribute('src'));
                title.textContent = shoppingElements[i].querySelector("#flyer-item-name").textContent;
                price.textContent = shoppingElements[i].querySelector("#flyer-item-price").textContent;
                validFrom.textContent = shoppingElements[i].querySelector("#flyer-item-valid-from").textContent;
                validTo.textContent = shoppingElements[i].querySelector("#flyer-item-valid-to").textContent;
                modalId.value = shoppingElements[i].querySelector("#id").value;
                storeName.value = shoppingElements[i].querySelector("#store-name").value;
                address.textContent =shoppingElements[i].querySelector("#storeAddress").textContent;
                distance.textContent = shoppingElements[i].querySelector("#distance").textContent;
                thumbnailImg.innerHTML = shoppingElements[i].querySelector("#merchant_logo_searched_img").innerHTML;
              });
            }

            document.getElementById("cross-modal").addEventListener('click', () => {
              document.getElementById("modal-product-info").style.display = "none";
            })

            document.getElementsByClassName("add-to-cart")[0].addEventListener('click', () => {
              document.getElementsByClassName("add-to-cart")[0].classList.remove("btn-primary");
              document.getElementsByClassName("add-to-cart")[0].classList.add("btn-success");
              document.getElementsByClassName("add-to-cart")[0].textContent = "Added to shopping cart";
              document.getElementsByClassName("add-to-cart")[0].classList.remove("add-to-cart");
              if (localStorage.getItem('order-items')) {
                var items = JSON.parse(localStorage.getItem('order-items'))
                for (var i = 0; i < items.length; i++) {
                  cart.push(items[i]);
                }
              }
              cart.push({
                id: modalId.value,
                imgUrl: imgSrc.getAttribute('src'),
                productTitle: title.textContent,
                price: price.textContent, 
                validFrom: validFrom.textContent,
                validTo: validTo.textContent,
                qty: 1,
                store_name: storeName.value,
                cart_extras: {
                  address: address.textContent,
                  distance: distance.textContent,
                  thumbnailImg: thumbnailImg.innerHTML,
                  storeName:storeName.value
                }
              })
              localStorage.setItem('order-items', JSON.stringify(cart));
              cart = []
            })


          }
          localStorage.removeItem("search-keyword");
        } else {
          // console.error(`Error fetching flyer data: Status ${response.status}`);
        }
      } catch (error) {
        // console.error(`Error fetching flyer data: ${error}`);
      }
    }
    runSearch();
  }
});





function formatDate(dateString) {
  var dateString = dateString; // ISO 8601 format
  var dateObject = new Date(dateString);
  var year = dateObject.getFullYear();
  var month = dateObject.getMonth() + 1; // Months are 0-based, so add 1
  var day = dateObject.getDate();
  return `${year}-${month}-${day}`;
}
