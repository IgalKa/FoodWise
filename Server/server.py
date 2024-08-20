from flask import Flask, request, jsonify
import logging
from datetime import timedelta
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models.Database import Database
from Utils import Utils, is_future_date

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
app.config['JWT_SECRET_KEY'] = '3e2a1b5c4d6f8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=3650)  # 10 years

docker = False

if docker:
    app.extensions['database'] = Database("/app/data/database.db", docker)
else:
    app.extensions['database'] = Database("../Server/data/database.db", docker)

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

    try:  # If 'user_id' or 'refrigerator_id' keys are missing, return an error response
        user_id = data['user_id']
        refrigerator_id = data['refrigerator_id']
        database = app.extensions['database']
    except KeyError:
        error_response = {'error': 'Invalid request'}
        app.logger.error("Invalid request of link endpoint")
        return jsonify(error_response), 400

    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

    check_result = utils.check_refrigerator_exist(refrigerator_id)
    if check_result:
        return check_result

    result = database.link_refrigerator_to_user(refrigerator_id, user_id)
    if result[1] == 1:
        app.logger.info(f"User {user_id} has been linked to refrigerator {refrigerator_id}")
    else:
        app.logger.warning(
            f"There was an attempt to make an existing link between user {user_id} to refrigerator {refrigerator_id}")

    message_response = {'message': result[0]}
    return jsonify(message_response), 200



# /scan , json={"barcode": 7290008757034, "mode": "add", "refrigerator_id": 1}
@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()  # Get the Body JSON data from the request

    try:  # If 'barcode' or 'mode' or 'refrigerator_id' keys are missing, return an error response
        barcode = data['barcode']
        mode = data['mode']
        refrigerator_id = data['refrigerator_id']
    except KeyError:
        app.logger.error("Invalid request of scan endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    product_name = utils.find_product_by_barcode(barcode)

    if not product_name:
        app.logger.warning(f'Attempt to get product with barcode={barcode} that was not found in the database')
        return utils.scanned_new_product(barcode)

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

    try:
        barcode = data['barcode']
        refrigerator_id = data['refrigerator_id']
    except KeyError:
        app.logger.error("Invalid request of add_product_from_app endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    product_name = utils.find_product_by_barcode(barcode)

    if not product_name:
        return utils.product_not_found(barcode)

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    return utils.add_product_to_refrigerator(product_name=product_name,
                                             refrigerator_id=refrigerator_id,
                                             barcode=barcode)


# /register , json={"email": "liorbaa@mta.ac.il", "password": "12345678", "first_name": "Lior", "last_name": "Barak"}
@app.route('/register', methods=['POST'])
def register_new_user():
    data = request.get_json()  # Get the Body JSON data from the request

    try:  # If 'email' or 'password' or 'first_name' or 'last_name' keys are missing, return an error response
        email = data['email']
        password = data['password']
        first_name = data['first_name']
        last_name = data['last_name']
    except KeyError:
        app.logger.error("Invalid request of register_new_user endpoint")
        error_response = {'error': 'Invalid request'}
        return jsonify(error_response), 400

    database = app.extensions['database']

    # identify if user with this email already exists
    check_result = utils.check_email_already_exist(email)
    if check_result:
        return check_result

    app.logger.info(f'Adding user with email={email}, first name={first_name}, last name={last_name} to database')
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    database.add_user(email, hashed_password, first_name, last_name)
    message_response = {
        'message': f"The user {first_name} {last_name} has been successfully added to the database"}
    return jsonify(message_response), 200


# /user_login , json={"email": "liorbaa@mta.ac.il", "password": "12345678"}
@app.route('/user_login', methods=['POST'])
def user_login():
    data = request.get_json()  # Get the Body JSON data from the request

    try:  # Check if 'email', 'password' keys are exist in the JSON data
        user_email = data['email']
        user_password = data['password']
        database = app.extensions['database']
    except KeyError:
        app.logger.error("Invalid request of user_login endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    check_result = utils.check_email_exist(user_email)
    if check_result:
        return check_result

    saved_password = database.get_password_of_user_by_email(user_email)
    if not bcrypt.check_password_hash(saved_password, user_password):
        app.logger.warning(f"Attempt to access user with email: {user_email} with wrong password")
        error_response = {'error': f"Wrong password for user with email {user_email}"}
        return jsonify(error_response), 404

    user = database.get_user(user_email, saved_password)
    access_token = create_access_token(identity=user['user_id'])
    user['access_token'] = access_token
    app.logger.info("User logged successfully")
    return jsonify(user), 200


@app.route('/update_user_email', methods=['POST'])
@jwt_required()
def update_user_email():
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        new_email = data['email']
        database = app.extensions['database']
    except KeyError:
        app.logger.error("Invalid request of update_user_email endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

    check_result = utils.check_email_already_exist(new_email)
    if check_result:
        return check_result

    database.update_user_email(user_id, new_email)
    app.logger.info(f"The email of user_id={user_id} updated successfully to new email={new_email}")
    message_response = {'message': f"The user email has been successfully updated to {new_email}"}
    return jsonify(message_response), 200


@app.route('/update_user_password', methods=['POST'])
@jwt_required()
def update_user_password():
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        new_password = data['password']
        database = app.extensions['database']
    except KeyError:
        app.logger.error("Invalid request of update_user_password endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

    saved_password = database.get_password_of_user_by_user_id(user_id)
    if bcrypt.check_password_hash(saved_password, new_password):
        app.logger.warning(f"Attempt to update the exists password with the same password")
        error_response = {'error': f"Password not updated, this password is your old password"}
        return jsonify(error_response), 400

    hashed_new_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    database.update_user_password(user_id, hashed_new_password)
    app.logger.info(f"The password of user_id={user_id} updated successfully")
    message_response = {'message': f"The user password has been successfully updated"}
    return jsonify(message_response), 200


# /linked_refrigerators
@app.route('/linked_refrigerators', methods=['GET'])
@jwt_required()
def linked_refrigerators():
    user_id = get_jwt_identity()
    database = app.extensions['database']

    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    refrigerator_content = database.find_refrigerator_contents(refrigerator_id)
    app.logger.info(f'Retrieved refrigerator contents for refrigerator={refrigerator_id}')
    return jsonify(refrigerator_content.__json__()), 200


# /number_linked_refrigerators?user_id=1
@app.route('/number_linked_refrigerators', methods=['GET'])
@jwt_required()
def number_linked_refrigerators():
    user_id = get_jwt_identity()
    database = app.extensions['database']

    # check if user exists
    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

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

    try:  # If 'new_name' or 'refrigerator_id' keys are missing, return an error response
        refrigerator_id = data['refrigerator_id']
        new_name = data['new_name']
    except KeyError:
        app.logger.error("Invalid request of update_refrigerator_name endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    database.change_refrigerator_nickname(refrigerator_id, user_id, new_name)
    app.logger.info(f"User {user_id} changed the name of refrigerator {refrigerator_id} to {new_name}")
    message_response = {'message': "The name was updated successfully"}
    return jsonify(message_response), 200


@app.route('/search_products', methods=['GET'])
@jwt_required()
def search_products():
    user_id = get_jwt_identity()
    database = app.extensions['database']

    try:
        product_name = request.args['product_name']
        all = request.args['all']
    except KeyError:
        app.logger.error("Invalid request of search_products endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    check_result = utils.check_user_exist(user_id)
    if check_result:
        return check_result

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    check_result = utils.check_valid_list(data, 'update_refrigerator_parameters', 'barcode', 'amount')
    if check_result:
        return check_result

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    check_result = utils.check_valid_list(data, 'save_shopping_list', 'product_name', 'amount')
    if check_result:
        return check_result

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    app.logger.info(f'An initial shopping list was generated for refrigerator {refrigerator_id}')
    result = database.generate_initial_shopping_list(refrigerator_id)
    return jsonify(result), 200


@app.route('/get_refrigerator_parameters', methods=['GET'])
@jwt_required()
def get_refrigerator_parameters():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    app.logger.info(f'Request for the parameters of refrigerator {refrigerator_id}')
    result = database.get_parameter_list(refrigerator_id)
    return jsonify(result), 200


@app.route('/fetch_saved_shopping_list', methods=['GET'])
@jwt_required()
def fetch_saved_shopping_list():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    barcode = database.find_barcode(product_name)
    if barcode is None:
        return utils.barcode_not_found(product_name)

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

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    refrigerator_content = database.find_refrigerator_contents_expired(refrigerator_id)
    app.logger.info(f"Get refrigerator {refrigerator_id} contents with products there alert date passed")
    return refrigerator_content.__json__(), 200


# /update_alert_date_and_quantity ,
# json={"refrigerator_id": 1, "product_name": "Milk 1% 1L Tnuva", "alert_date": "2024-09-25", "product_quantity": 3}
@app.route("/update_alert_date_and_quantity", methods=['POST'])
@jwt_required()
def update_alert_date_and_quantity():
    user_id = get_jwt_identity()
    database = app.extensions['database']
    data = request.get_json()

    try:
        refrigerator_id = data['refrigerator_id']
        product_name = data['product_name']
        alert_date = data['alert_date']
        product_quantity = data['product_quantity']
    except KeyError:
        app.logger.error("Invalid request of update_alert_date_and_quantity endpoint")
        error_response = {'error': "invalid request"}
        return error_response, 400

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    barcode = database.find_barcode(product_name)
    if barcode is None:
        return utils.barcode_not_found(product_name)

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
        response, status_code = utils.update_product_alert_date(refrigerator_id, barcode, alert_date)
        if status_code != 200:
            return response, status_code

    if not database.check_3values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", column_name3="product_quantity", value1=refrigerator_id,
                                        value2=barcode, value3=product_quantity):
        response, status_code = utils.update_product_quantity(refrigerator_id, barcode, product_quantity)
        if status_code != 200:
            return response, status_code

    message_response = {'message': f"Refrigerator={refrigerator_id} with product={product_name} "
                                   f"quantity={product_quantity} alert_date={alert_date} was updated successfully"}
    return message_response, 200



@app.route('/get_statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    user_id = get_jwt_identity()
    refrigerator_id = request.args.get('refrigerator_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    check_result = utils.validate_link(user_id, refrigerator_id)
    if check_result:
        return check_result

    entry_stats = utils.get_statistics_by_table_name(table_name="entry_table")
    exit_stats = utils.get_statistics_by_table_name(table_name="exit_table")

    combined_stats = {
        "entry_statistics": entry_stats,
        "exit_statistics": exit_stats
    }

    return jsonify(combined_stats), 200





#     Managers endpoints

# /add_new_product_to_DB , json={"barcode": "1111111111111", "product_name": "Testing", "image": null}
@app.route('/add_new_product_to_DB', methods=['POST'])
def add_new_product_to_DB():
    database = app.extensions['database']
    data = request.get_json()

    try:
        barcode = data['barcode']
        product_name = data['product_name']
        image = data['image']
    except KeyError:
        app.logger.error("Invalid request of add_new_product_to_DB endpoint")
        error_response = {'error': "invalid request"}
        return error_response, 400

    check_result = utils.check_barcode_already_exist(barcode)
    if check_result:
        return check_result

    check_result = utils.check_product_name_already_exist(product_name)
    if check_result:
        return check_result

    database.add_new_product_to_DB(barcode, product_name, image)
    app.logger.info(f"Added product barcode={barcode}, product name={product_name} to 'product' DB")
    message_response = {"message": f"Product barcode={barcode}, name={product_name} added successfully to 'product' DB"}
    return message_response, 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345, threaded=True, debug=True)
