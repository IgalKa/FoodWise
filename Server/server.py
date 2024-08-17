from flask import Flask, request, jsonify
import logging
import sys
from os.path import abspath, dirname, join
from datetime import timedelta
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_mail import Mail, Message

# Calculate the project root directory and add it to sys.path
project_root = abspath(join(dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from database.Database import Database
from Utils import Utils

app = Flask(__name__)

# Set up basic configuration for logging to the console
logging.basicConfig(level=logging.DEBUG,  # Log level
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Configuration for the flask server
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'foodwiselmi@gmail.com'
app.config['MAIL_PASSWORD'] = 'vjxm lhxk pmfa bzxu'
app.config['MAIL_DEFAULT_SENDER'] = 'foodwiselmi@gmail.com'
app.config['JWT_SECRET_KEY'] = '3e2a1b5c4d6f8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4'  # Change this to a random secret key
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=3650)  # 10 years


app.extensions['database'] = Database("../Server/data/database.db")


mail = Mail(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
utils = Utils(app)  # Create an instance of the Utils class


#     Embedded endpoints

# /request_refrigerator_id
@app.route('/request_refrigerator_id', methods=['GET'])
def request_refrigerator_id():
    database = app.extensions['database']
    new_refrigerator_id = database.generate_refrigerator_id()
    app.logger.info(f"The number {new_refrigerator_id} has been assigned to a new refrigerator as id")
    return jsonify(new_refrigerator_id), 200


# /link , json={"user_id": 1, "refrigerator_id": 1}
@app.route('/link', methods=['POST'])
def link():
    data = request.get_json()  # Get the Body JSON data from the request
    # If 'user_id' or 'refrigerator_id' keys are missing, return an error response
    if not ('user_id' in data and 'refrigerator_id' in data):
        error_response = {'error': 'Invalid request'}
        app.logger.error("Invalid request of link endpoint")
        return jsonify(error_response), 400

    user_id = data['user_id']
    refrigerator_id = data['refrigerator_id']
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    result = database.link_refrigerator_to_user(refrigerator_id, user_id)
    if result[1] == 1:
        app.logger.info(f"User {user_id} has been linked to refrigerator {refrigerator_id}")
    else:
        app.logger.warning(
            f"There was an attempt to make an existing link between user {user_id} to refrigerator {refrigerator_id}")

    message_response = {'message': result[0]}
    return jsonify(message_response), 200


def scanned_new_product(barcode):
    database = app.extensions['database']

    if database.check_value_exist(table_name="pending_barcode", column_name="barcode", value=barcode):
        app.logger.info(f"Barcode={barcode} already at pending_barcode table")
    else:
        database.add_barcode(barcode)
        msg = Message(
            subject="New barcode to add",
            recipients=["foodwiselmi@gmail.com"],
            body=f"Barcode: {barcode}"
        )
        mail.send(msg)
        app.logger.info(f"Barcode={barcode} added to pending_barcode table and email sent")

    message_response = {'message': f"Product with barcode={barcode} not at database, the adding request at pending"}
    return message_response, 404


# /scan , json={"barcode": 7290008757034, "mode": "add", "refrigerator_id": 1}
@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()  # Get the Body JSON data from the request
    # If 'barcode' or 'mode' or 'refrigerator_id' keys are missing, return an error response
    if not ('barcode' in data and 'mode' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of scan endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    barcode = data['barcode']
    mode = data['mode']
    refrigerator_id = data['refrigerator_id']
    database = app.extensions['database']

    product_name = utils.find_product_by_barcode(barcode)

    if not product_name:
        app.logger.warning(f'Attempt to get product with barcode={barcode} that was not found in the database')
        return scanned_new_product(barcode)

    check_result = utils.check_refrigerator_exist(refrigerator_id)
    if check_result:
        return check_result

    if mode == 'add':
        return utils.add_product_to_refrigerator(product_name=product_name,
                                                 refrigerator_id=refrigerator_id,
                                                 barcode=barcode)

    elif mode == 'remove':
        return utils.remove_product_from_refrigerator(product_name=product_name,
                                                      refrigerator_id=refrigerator_id,
                                                      barcode=barcode)

    else:
        app.logger.error(f'Attempt to use mode {mode} that does not exist')
        error_response = {'error': f"Mode {mode} not supported"}
        return jsonify(error_response), 405


#     Frontend endpoints


@app.route('/add_product_with_app', methods=['POST'])
@jwt_required()
def add_product_with_app():
    user_id = get_jwt_identity()
    data = request.get_json()
    database = app.extensions['database']

    if not ('barcode' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of add_product_from_app endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    barcode = data['barcode']
    refrigerator_id = data['refrigerator_id']

    product_name = utils.find_product_by_barcode(barcode)

    if not product_name:
        return utils.product_not_found(barcode)

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    return utils.add_product_to_refrigerator(product_name=product_name,
                                             refrigerator_id=refrigerator_id,
                                             barcode=barcode)


@app.route('/remove_product_wtih_app', methods=['POST'])
@jwt_required()
def remove_product_with_app():
    user_id = get_jwt_identity()
    data = request.get_json()
    database = app.extensions['database']

    if not ('barcode' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of add_product_from_app endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    barcode = data['barcode']
    refrigerator_id = data['refrigerator_id']

    product_name = utils.find_product_by_barcode(barcode)

    if not product_name:
        return utils.product_not_found(barcode)

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    return utils.remove_product_from_refrigerator(product_name=product_name,
                                                  refrigerator_id=refrigerator_id,
                                                  barcode=barcode)


# /register , json={"email": "liorbaa@mta.ac.il", "password": "12345678", "first_name": "Lior", "last_name": "Barak"}
@app.route('/register', methods=['POST'])
def register_new_user():
    data = request.get_json()  # Get the Body JSON data from the request
    # If 'email' or 'password' or 'first_name' or 'last_name' keys are missing, return an error response
    if not ('email' in data and 'password' in data and 'first_name' in data and 'last_name' in data):
        app.logger.error("Invalid request of register_new_user endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    email = data['email']
    password = data['password']
    first_name = data['first_name']
    last_name = data['last_name']
    database = app.extensions['database']

    # identify if user with this email already exists
    if database.check_value_exist(table_name="user", column_name="email", value=email):
        app.logger.warning(f'User with email {email} already exists')
        error_response = {'error': f"User with email {email} already exists"}
        return jsonify(error_response), 400
    else:
        app.logger.info(f'Adding user with email {email} to the database')
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        database.add_user(email, hashed_password, first_name, last_name)
        message_response = {
            'message': f"The user {first_name} {last_name} has been successfully added to the database"}
        return jsonify(message_response), 200


# /user_login , json={"email": "liorbaa@mta.ac.il", "password": "12345678"}
@app.route('/user_login', methods=['POST'])
def user_login():
    data = request.get_json()  # Get the Body JSON data from the request
    # Check if 'email', 'password' keys are not exist in the JSON data
    if not ('email' in data and 'password' in data):
        app.logger.error("Invalid request of user_login endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    user_email = data['email']
    user_password = data['password']
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="email", value=user_email):
        app.logger.warning(f"Attempt to access user with email: {user_email} that does not exist")
        error_response = {'error': f"User with email {user_email} does not exist"}
        return jsonify(error_response), 404

    saved_password = database.get_password_of_user(user_email)
    if not bcrypt.check_password_hash(saved_password, user_password):
        app.logger.warning(f"Attempt to access user with email: {user_email} and wrong password: {user_password}")
        error_response = {'error': f"Wrong password for user with email {user_email}"}
        return jsonify(error_response), 404

    ##if not database.check_2values_exist(table_name="user", column_name1="email", column_name2="password",
    ##                                    value1=user_email, value2=user_password):
    ##    app.logger.warning(f"Attempt to access user with email: {user_email} and wrong password: {user_password}")
    ##    error_response = {'error': f"Wrong password for user with email {user_email}"}
    ##    return jsonify(error_response), 404

    user = database.get_user(user_email, saved_password)
    access_token = create_access_token(identity=user['id'])
    app.logger.info("User logged successfully")
    return jsonify(
        access_token=access_token,
        first_name=user['first_name'],
        last_name=user['last_name'],
    ), 200


# /linked_refrigerators
@app.route('/linked_refrigerators', methods=['GET'])
@jwt_required()
def linked_refrigerators():
    user_id = get_jwt_identity()
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    app.logger.info(f"There was a request for all the linked refrigerators for user {user_id}")
    return database.find_linked_refrigerators(user_id), 200


# /refrigerator_contents?refrigerator_id=1,
@app.route('/refrigerator_contents', methods=['GET'])
@jwt_required()
def refrigerator_contents():
    user_id = get_jwt_identity()
    # Get the QueryParam 'refrigerator_id' from the request
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    refrigerator_content = database.find_refrigerator_contents(refrigerator_id)
    app.logger.info(f'Retrieved refrigerator contents for {refrigerator_id}')
    return jsonify(refrigerator_content.__json__()), 200


# /number_linked_refrigerators?user_id=1
@app.route('/number_linked_refrigerators', methods=['GET'])
@jwt_required()
def number_linked_refrigerators():
    user_id = get_jwt_identity()
    database = app.extensions['database']

    #check if user exists

    result = database.find_linked_refrigerators(user_id)
    number_refrigerators = len(result['refrigerators'])

    app.logger.info(f"There was a request for the number of the linked refrigerators for user {user_id}"
                    f" ,returned {number_refrigerators}")
    response = {"number_linked_refrigerators": number_refrigerators}
    return response, 200


# /update_refrigerator_name?user_id=1 , json={"refrigerator_id": 1, "new_name": "Main Refrigerator"}
@app.route('/update_refrigerator_name', methods=['POST'])
@jwt_required()
def update_refrigerator_name():
    database = app.extensions['database']
    user_id = get_jwt_identity()
    data = request.get_json()
    # If 'new_name' or 'refrigerator_id' keys are missing, return an error response
    if not ('new_name' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of update_refrigerator_name endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    refrigerator_id = data['refrigerator_id']
    new_name = data['new_name']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    database.change_refrigerator_nickname(refrigerator_id, user_id, new_name)
    app.logger.info(f"User {user_id} changed the name of refrigerator {refrigerator_id} to {new_name}")
    message_response = {'message': "The name was updated successfully"}
    return jsonify(message_response), 200


@app.route('/search_products', methods=['GET'])
@jwt_required()
def search_products():
    user_id = get_jwt_identity()
    product_name = request.args.get('product_name')
    all = request.args.get('all')
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    if not product_name:
        app.logger.info(f"There was a search for empty name")
        return {'message': "No products found"}, 404

    result = database.search_products_by_product_name(product_name, all)
    if not result:
        app.logger.info(f"There was an unsuccessful search for {product_name}")
        return {'message': "No products found"}, 404

    app.logger.info(f"There was a successful search for {product_name}")
    return jsonify(result), 200


@app.route('/update_refrigerator_parameters', methods=['POST'])
@jwt_required()
def update_refrigerator_parameters():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')
    data = request.get_json()

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    # Check if data is a list
    if not isinstance(data, list):
        app.logger.warning(f'Invalid data format for update_refrigerator_parameters endpoint : not a list')
        error_response = {'error': 'Invalid data format. Expected a list'}
        return jsonify(error_response), 400

    for product in data:
        # Ensure each object has 'barcode' and 'amount' keys
        if 'barcode' not in product or 'amount' not in product:
            app.logger.warning(f'Invalid data format for update_refrigerator_parameters endpoint : Each object must '
                               f'contain barcode and amount keys')
            error_response = {"error": "Each object must contain 'barcode' and 'amount' keys."}
            return jsonify(error_response), 400

    database.update_refrigerator_parameters(refrigerator_id, data)
    app.logger.info(f'parameters for refrigerator {refrigerator_id} were updated successfully')
    message_response = {'message': "The refrigerator's parameters were updated successfully"}
    return jsonify(message_response), 200


@app.route('/save_shopping_list', methods=['POST'])
@jwt_required()
def save_shopping_list():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')
    data = request.get_json()

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    if not isinstance(data, list):
        app.logger.warning(f'Invalid data format for save_shopping_list endpoint : not a list')
        error_response = {'error': 'Invalid data format. Expected a list'}
        return jsonify(error_response), 400

    for product in data:
        if 'product_name' not in product or 'amount' not in product:
            app.logger.warning(f'Invalid data format for save_shopping_list endpoint : Each object must '
                               f'contain product_name and amount keys')
            error_response = {"error": "Each object must contain 'product_name' and 'amount' keys."}
            return jsonify(error_response), 400

    app.logger.info(f'A new shopping list was saved for refrigerator {refrigerator_id}')
    database.save_shopping_list(refrigerator_id, data)
    message_response = {'message': "The shopping list was saved successfully"}
    return jsonify(message_response), 200


@app.route('/generate_initial_shopping_list', methods=['GET'])
@jwt_required()
def generate_initial_shopping_list():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    app.logger.info(f'An initial shopping list was generated for refrigerator {refrigerator_id}')
    result = database.generate_initial_shopping_list(refrigerator_id)
    return jsonify(result), 200


@app.route('/get_refrigerator_parameters', methods=['GET'])
@jwt_required()
def get_refrigerator_parameters():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    app.logger.info(f'Request for the parameters of refrigerator {refrigerator_id}')
    result = database.get_parameter_list(refrigerator_id)
    return jsonify(result), 200


@app.route('/fetch_saved_shopping_list', methods=['GET'])
@jwt_required()
def fetch_saved_shopping_list():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    app.logger.info(f'Request for the saved shopping list for refrigerator {refrigerator_id}')
    result = database.get_shopping_list(refrigerator_id)
    return jsonify(result), 200


# /get_product_alert_date?refrigerator_id=1&product_name=Eggs pack 12L free organic
@app.route('/get_product_alert_date', methods=['GET'])
@jwt_required()
def get_product_alert_date():
    user_id = get_jwt_identity()
    refrigerator_id = request.args.get('refrigerator_id')
    product_name = request.args.get('product_name')
    database = app.extensions['database']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    barcode = database.find_barcode(product_name)
    if barcode is None:
        app.logger.warning(f"Attempt to get barcode of product_name {product_name} that wasn't found in the database")
        error_response = {'error': f"Barcode of product_name {product_name} not found"}
        return error_response, 404

    if not database.check_2values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", value1=refrigerator_id, value2=barcode):
        app.logger.warning(f"Attempt to get alert_date of refrigerator {refrigerator_id} with product {product_name}"
                           f" barcode {barcode} wasn't found in the database")
        error_response = {'error': f"Refrigerator {refrigerator_id} with product {product_name}"
                                   f" barcode {barcode} wasn't found in database"}
        return error_response, 404

    alert_date = database.get_alert_date(refrigerator_id, barcode)

    app.logger.info(f"Alert date of refrigerator {refrigerator_id} with product {product_name} barcode {barcode}"
                    f" is {alert_date}")
    response = {'alert_date': alert_date}
    return response, 200


# /get_refrigerator_content_expired?refrigerator_id=1
@app.route('/get_refrigerator_content_expired', methods=['GET'])
@jwt_required()
def get_refrigerator_content_expired():
    user_id = get_jwt_identity()
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f"Attempt to access refrigerator {refrigerator_id} that does not exist")
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return error_response, 404

    refrigerator_content = database.find_refrigerator_contents_expired(refrigerator_id)
    app.logger.info(f"Get refrigerator {refrigerator_id} contents with products there alert date passed")
    return refrigerator_content.__json__(), 200


# /update_alert_date_and_quantity , json={"refrigerator_id": 1, "product_name": "Milk 1% 1L Tnuva", "alert_date": "2024-09-25", "product_quantity": 3}
@app.route("/update_alert_date_and_quantity", methods=['POST'])
@jwt_required()
def update_alert_date_and_quantity():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    data = request.get_json()

    if not ('refrigerator_id' in data and 'product_name' in data and 'alert_date' and 'product_quantity' in data):
        app.logger.error("Invalid request of update_alert_date_and_quantity endpoint")
        error_response = {'error': "invalid request"}
        return error_response, 400

    refrigerator_id = data['refrigerator_id']
    product_name = data['product_name']
    alert_date = data['alert_date']
    product_quantity = data['product_quantity']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404


    barcode = database.find_barcode(product_name)
    if barcode is None:
        app.logger.warning(f"Attempt to get barcode of product_name={product_name} that wasn't found in the database")
        error_response = {'error': f"Barcode of product_name={product_name} not found"}
        return error_response, 404

    if not database.check_2values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", value1=refrigerator_id, value2=barcode):
        app.logger.warning(f"Attempt to update refrigerator={refrigerator_id} with product barcode={barcode} that"
                           f" was not found in the database")
        error_response = {
            'error': f"Refrigerator={refrigerator_id} with product={product_name} wasn't found in database"}
        return error_response, 404

    if not database.check_3values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", column_name3="alert_date", value1=refrigerator_id,
                                        value2=barcode, value3=alert_date):
        response, status_code = update_product_alert_date(refrigerator_id, barcode, alert_date)
        if status_code != 200:
            return response, status_code

    if not database.check_3values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", column_name3="product_quantity", value1=refrigerator_id,
                                        value2=barcode, value3=product_quantity):
        response, status_code = update_product_quantity(refrigerator_id, barcode, product_quantity)
        if status_code != 200:
            return response, status_code

    message_response = {'message': f"Refrigerator={refrigerator_id} with product={product_name} "
                                   f"quantity={product_quantity} alert_date={alert_date} was updated successfully"}
    return message_response, 200


def update_product_alert_date(refrigerator_id, barcode, alert_date):
    database = app.extensions['database']

    if not Utils.is_future_date(alert_date):
        app.logger.warning(f"Attempt to update alert_date with date {alert_date} that is in the past")
        error_response = {'error': f"Alert date {alert_date} is in the past"}
        return error_response, 400

    database.update_alert_date(refrigerator_id, barcode, alert_date)
    app.logger.info(f"Alert date of refrigerator={refrigerator_id} with product barcode={barcode} updated successfully"
                    f" to alert_date={alert_date}")
    message_response = {'message': f"Alert_date updated successfully"}
    return message_response, 200


def update_product_quantity(refrigerator_id, barcode, quantity):
    database = app.extensions['database']

    if quantity < 0:
        app.logger.warning(f"Attempt to update quantity with negative quantity, quantity={quantity}")
        error_response = {'error': f"quantity is negative"}
        return error_response, 400
    elif quantity == 0:
        database.delete_product(refrigerator_id, barcode)
        app.logger.info(f'Deleted product barcode={barcode} from refrigerator number={refrigerator_id}')
        message_response = {
            'message': f"The product has been successfully deleted from refrigerator number={refrigerator_id}"}
        return message_response, 200
    else:  # quantity > 0
        database.set_product_quantity(refrigerator_id, barcode, quantity)
        app.logger.info(f'Set quantity for product barcode={barcode} from refrigerator number={refrigerator_id}')
        message_response = {
            'message': f"The product quantity has been successfully updated at refrigerator number={refrigerator_id}"}
        return message_response, 200


def get_statistics_by_table_name(table_name):
    user_id = get_jwt_identity()
    refrigerator_id = request.args.get('refrigerator_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    database = app.extensions['database']

    if not database.validate_request(user_id, refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
        error_response = {'error': f"Invalid authentication "}
        return jsonify(error_response), 404

    if not start_date <= end_date:
        app.logger.warning(f"Attempt to get {table_name} statistics when start_date={start_date} is after the end_date={end_date}")
        error_response = {'error': f"Start date {start_date} is after end date {end_date}"}
        return error_response, 400

    products_and_quantities = database.find_products_and_quantities_between_dates(table_name, refrigerator_id,
                                                                                  start_date, end_date)
    app.logger.info(
        f"Get {table_name} statistics of refrigerator={refrigerator_id} start_date={start_date} end_date={end_date}")
    return products_and_quantities, 200


# /get_entry_statistics?refrigerator_id=1&start_date=2024-07-20&end_date=2024-07-21
@app.route('/get_entry_statistics', methods=['GET'])
@jwt_required()
def get_entry_statistics():
    return get_statistics_by_table_name(table_name="entry_table")


# /get_exit_statistics?refrigerator_id=1&start_date=2024-07-20&end_date=2024-07-21
@app.route('/get_exit_statistics', methods=['GET'])
@jwt_required()
def get_exit_statistics():
    return get_statistics_by_table_name(table_name="exit_table")


@app.route('/get_statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    entry_stats = get_statistics_by_table_name(table_name="entry_table")
    exit_stats = get_statistics_by_table_name(table_name="exit_table")

    combined_stats = {
        "entry_statistics": entry_stats,
        "exit_statistics": exit_stats
    }

    return jsonify(combined_stats), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345, threaded=True)
