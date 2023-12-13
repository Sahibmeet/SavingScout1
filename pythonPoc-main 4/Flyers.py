from flask import Flask, render_template, request, session,jsonify
import requests
from flask_session import Session 
from datetime import datetime
from flask import Flask, render_template, request, redirect
from flask import jsonify
from flask_mail import Mail,Message
import secrets
import os
from urllib.parse import unquote

app = Flask(__name__)

# Generate a secret key
secret_key = secrets.token_hex(16)

# Set the secret key in the app's configuration
app.config['SECRET_KEY'] = secret_key
app.config['MAIL_SERVER'] = "smtp.googlemail.com"
app.config['MAIL_PORT'] = "587"
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = "savingscout1@gmail.com"
app.config['MAIL_PASSWORD'] = "pjxh ekjt unom llhz"
mail = Mail(app)

# Configure the session to use a server-side session storage
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# URL for fetching flyer data
FLYER_URL = 'https://backflipp.wishabi.com/flipp/flyers?postal_code=L6P4E6'

# Function to get flyer data from a specified URL
def get_flyer_data():
    try:
        response = requests.get(FLYER_URL)
        response.raise_for_status()
        data = response.json()
        flyers = data.get('flyers', [])
        return flyers
    except Exception as e:
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



# Route to set the postal code and display the main page
@app.route('/main', methods=['POST', 'GET'])
def main():
    if request.method == 'POST':
        # If a POST request is received, set the postal code in the session
        postal_code = request.form.get('postal_code')
        session['postal_code'] = postal_code
    else:
        # If a GET request is received, retrieve the postal code from the session
        postal_code = session.get('postal_code')

    # Retrieve flyer data
    flyer_data = get_flyer_data()

    return render_template('main.html', postal_code=postal_code, flyer_data=flyer_data)

# Route to update the flyer URL based on the postal code
@app.route('/update_flyer_url', methods=['POST'])
def update_flyer_url():
    postal_code = request.form.get('postal_code')
    session['postal_code'] = postal_code  # Update the postal code in the session
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
        return None
    
# Custom Jinja filter to format dates
@app.template_filter('to_date')
def to_date_filter(value):
    try:
        # Parse the date string and format it
        date_obj = datetime.fromisoformat(value)
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return value

# Index route    
@app.route('/')
def index():
    return render_template('index.html')

# Route to display all flyers
@app.route('/Allflyers')
def Allflyers():
    postal_code = session.get('postal_code', '')  # Get the postal_code from the session
    flyer_data = get_flyer_data()
    return render_template('Allflyers.html', flyer_data=flyer_data, postal_code=postal_code)

# Route to display the shopping list
@app.route('/shopping_list')
def shopping_list():
    postal_code = session.get('postal_code', '')  # Get the postal_code from the session
    return render_template('shopping_list.html',postal_code=postal_code)

# Route to display search results for all products
@app.route('/searchAllProducts')
def searchAllProducts():
    postal_code = session.get('postal_code', '')  # Get the postal_code from the session
    return render_template('searchAllProducts.html',postal_code=postal_code)

# Function to extract store name from a flyer path
def extract_store_name(url):
    # Parse the URL and extract the store name
    # Assuming the store name is after 'store-name=' in the URL
    start_index = url.find('store-name=') + len('store-name=')
    end_index = url.find('&', start_index)
    
    # If there's no '&' after 'store-name=', consider the end of the string
    if end_index == -1:
        end_index = None
    
    store_name = url[start_index:end_index]
    return store_name

# Route to view a specific flyer
@app.route('/view_flyer/<path:flyer_path>', methods=['GET'])
def view_flyer(flyer_path):
    print(flyer_path)
    storeName = extract_store_name(flyer_path)
    print("THis is store name ",storeName)
    postal_code = session.get('postal_code', '')  # Get the postal_code from the session
    full_flyer_data = fetch_full_flyer_data(flyer_path)

    if full_flyer_data:
        # Pass the full flyer data to the template
        script = "<script>window.history.pushState({}, 'Main Page', '/flyerProducts');</script>"
        return render_template('view_flyer.html', full_flyer_data=full_flyer_data, script=script, postal_code=postal_code , store_name = storeName)
    else:
        # Handle the case where full flyer data is not available
        return "Full flyer data not found"



import concurrent.futures

import concurrent.futures

# Route to get searched data
@app.route('/get_searched_data', methods=['GET'])
def get_search_data():
    searchKeyword = request.args.get('global-search')
    postal_code = session.get('postal_code', '')  
 
    return render_template('searchAllProducts.html',searchKeyword=searchKeyword,postal_code=postal_code)

# Route to send an email with a shopping list
@app.route('/mail_send', methods=['POST'])
def send_email():
    data = request.get_json()
    email = data.get('email')
    pdf_file_path = data.get('pdfUrl')
    msg_title = "Saving scout shopping list"
    sender = "norep@flip.com"
    msg = Message(msg_title,sender=sender,recipients=[email])
    msg_body = "Hi , Please find your shopping list attached with this email"
    msg.body = ""
    # Attach the PDF file to the email
    with app.open_resource(pdf_file_path) as pdf_file:
        msg.attach("your_attachment.pdf", "application/pdf", pdf_file.read())
    data = {
		'app_name': "Saving Scout",
		'title': msg_title,
		'body': msg_body,
	}
    msg.html = render_template("email.html",data=data)

    try:
        mail.send(msg)
        return jsonify("Email sent...")
    except Exception as e:
        print(e)
        return f"the email was not sent {e}"


# Route to generate a PDF file
@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    
     if 'pdfFile' in request.files:
        pdf_blob = request.files['pdfFile']
        if pdf_blob:
            # Save the Blob to a local directory
            file_path = os.path.dirname(__file__) + pdf_blob.filename
            pdf_blob.save(file_path)

            # Additional processing if needed
            # For example, you can return a response to the client
            return jsonify(file_path)
     return jsonify({'message': 'No file or incorrect field name found'})


if __name__ == "__main__":
    app.run(debug=True)

