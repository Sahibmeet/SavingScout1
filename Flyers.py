from flask import Flask, render_template, request
import requests
from datetime import datetime

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
    flyer_data = get_flyer_data()
    return render_template('index.html', flyer_data=flyer_data)

@app.route('/view_flyer/<path:flyer_path>', methods=['GET'])
def view_flyer(flyer_path):
    full_flyer_data = fetch_full_flyer_data(flyer_path)

    if full_flyer_data:
        # Pass the full flyer data to the template
        return render_template('view_flyer.html', full_flyer_data=full_flyer_data)
    else:
        # Handle the case where full flyer data is not available
        return "Full flyer data not found"

if __name__ == "__main__":
    app.run(debug=True)
