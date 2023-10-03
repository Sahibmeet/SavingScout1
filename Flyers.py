from flask import Flask, render_template, request
import requests
from datetime import datetime
from flask import Flask, render_template, request, redirect
from flask import jsonify

app = Flask(__name__)

# URL for fetching flyer data
FLYER_URL = 'https://backflipp.wishabi.com/flipp/flyers?postal_code=L6P4E6'

def get_flyer_data():
    try:
        response = requests.get(FLYER_URL)
        response.raise_for_status()
        data = response.json()
        flyers = data.get('flyers', [])
        return flyers
    except Exception as e:
        print(f"Error retrieving flyer data: {e}")
        return []
    

# Route to search for products

@app.route('/search_products', methods=['POST'])
def search_products():
    search_query = request.form.get('search_query')
    flyer_data = get_flyer_data()

    matching_products = []

    for flyer in flyer_data:
        for product in flyer.get('products', []):
            if search_query.lower() in product.get('name', '').lower():
                matching_products.append(product)

    # Sort matching products from cheaper to more expensive
    matching_products.sort(key=lambda x: x.get('price', 0))

    return jsonify({'products': matching_products})



@app.route('/main')
def main():
    # You can render a different HTML template for your main page if needed
    return render_template('main.html')  # Replace 'main_page.html' with your actual template


@app.route('/update_flyer_url', methods=['POST'])
def update_flyer_url():
    postal_code = request.form.get('postal_code')
    global FLYER_URL
    FLYER_URL = f'https://backflipp.wishabi.com/flipp/flyers?postal_code={postal_code}'
    return redirect('/main')


# Define a function to fetch full flyer data based on flyer path
def fetch_full_flyer_data(flyer_url):
    try:
        response = requests.get(flyer_url)
        response.raise_for_status()
        full_flyer_data = response.json()
        return full_flyer_data
    except Exception as e:
        print(f"Error retrieving full flyer data: {e}")
        return None
    
@app.template_filter('to_date')
def to_date_filter(value):
    try:
        # Parse the date string and format it
        date_obj = datetime.fromisoformat(value)
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return value
    
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/Allflyers')
def Allflyers():
    flyer_data = get_flyer_data()
    return render_template('Allflyers.html', flyer_data=flyer_data)

@app.route('/shopping_list')
def shopping_list():
    return render_template('shopping_list.html')


@app.route('/view_flyer/<path:flyer_path>', methods=['GET'])
def view_flyer(flyer_path):
    full_flyer_data = fetch_full_flyer_data(flyer_path)

    if full_flyer_data:
        # Pass the full flyer data to the template
        script = "<script>window.history.pushState({}, 'Main Page', '/flyerProducts');</script>"
        return render_template('view_flyer.html', full_flyer_data=full_flyer_data, script=script)
    else:
        # Handle the case where full flyer data is not available
        return "Full flyer data not found"

if __name__ == "__main__":
    app.run(debug=True)
