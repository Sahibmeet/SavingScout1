import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

# Define the base URLs for Flipp
BASE_URL = 'https://flipp.com'
BACKEND_URL = 'https://backflipp.wishabi.com/flipp'
SEARCH_URL = f'{BACKEND_URL}/items/search'
ITEM_URL = f'{BACKEND_URL}/items/'

@app.route('/')
def grocery():
    # Get the query and postal_code from the query parameters
    query = request.args.get('query', default='apples', type=str)
    postal_code = request.args.get('postal_code', default='L6P4E6', type=str)

    # Check if both query and postal_code are provideds
    if query and postal_code:
        # Use the provided query and postal_code to fetch data from Flipp
        data = get_grocery_data(query, postal_code)
        return jsonify(data)
    else:
        return "Please provide a valid query and postal_code."


def get_grocery_data(query, postal_code):
    try:
        # Define the parameters for the search
        search_params = {
            'q': query,
            'postal_code': postal_code,
        }

        # Make a GET request to the search URL
        response = requests.get(SEARCH_URL, params=search_params)

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            items = data.get('items')

            # Extract and format the grocery items
            grocery_data = []
            for item in items:
                grocery_item = {
                    "name": item.get('title'),
                    "price": item.get('price'),
                    "description": item.get('description'),
                }
                grocery_data.append(grocery_item)

            return grocery_data

        else:
            # Handle request error
            return []

    except Exception as e:
        # Handle any exceptions
        print(f"An error occurred: {e}")
        return []

if __name__ == "__main__":
    app.run(debug=True)
