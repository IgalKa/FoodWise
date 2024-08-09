from flask import Flask, request, jsonify
import logging
import sys
from os.path import abspath, dirname, join
from database.Database import Database
from models import Functions

# Calculate the project root directory and add it to sys.path
project_root = abspath(join(dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

app = Flask(__name__)

# Set up basic configuration for logging to the console
logging.basicConfig(level=logging.DEBUG,  # Log level
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app.extensions['database'] = Database("../Server/data/database.db")


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
    # identify the product by the given barcode
    product_name = database.find_product(barcode)

    if product_name is None:
        app.logger.warning(f'Attempt to get product with barcode {barcode} that was not found in the database')
        error_response = {'error': f"Product with barcode {barcode} not found"}
        return jsonify(error_response), 404

    # identify if the refrigerator id exists
    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    if mode == 'add':
        app.logger.info(f'Adding {product_name} to refrigerator number: {refrigerator_id}')
        database.add_product(refrigerator_id, barcode)
        message_response = {
            'message': f"The product has been successfully added to the refrigerator number {refrigerator_id}"}
        return jsonify(message_response), 200
    elif mode == 'remove':
        app.logger.info(f'Removing {product_name} from refrigerator number: {refrigerator_id}')
        result = database.remove_product(refrigerator_id, barcode)
        if result:
            app.logger.info(f'The product has been successfully removed from refrigerator number {refrigerator_id}')
            message_response = {
                'message': f"The product has been successfully removed from refrigerator number {refrigerator_id}"}
            return jsonify(message_response), 200
        else:
            app.logger.warning(f'Product with barcode {barcode} not found in the refrigerator number {refrigerator_id}')
            error_response = {
                'error': f"Product with barcode {barcode} not found in the refrigerator number {refrigerator_id}"}
            return jsonify(error_response), 404
    else:
        app.logger.error(f'Attempt to use mode {mode} that does not exist')
        error_response = {'error': f"Mode {mode} not supported"}
        return jsonify(error_response), 405


#     Frontend endpoints

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
        database.add_user(email, password, first_name, last_name)
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

    if not database.check_2values_exist(table_name="user", column_name1="email", column_name2="password",
                                        value1=user_email, value2=user_password):
        app.logger.warning(f"Attempt to access user with email: {user_email} and wrong password: {user_password}")
        error_response = {'error': f"Wrong password for user with email {user_email}"}
        return jsonify(error_response), 404

    result = database.get_user(user_email, user_password)
    app.logger.info("User logged successfully")
    return jsonify(result), 200


# /linked_refrigerators?user_id=1
@app.route('/linked_refrigerators', methods=['GET'])
def linked_refrigerators():
    user_id = request.args.get('user_id')
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    app.logger.info(f"There was a request for all the linked refrigerators for user {user_id}")
    return database.find_linked_refrigerators(user_id), 200


# /refrigerator_contents?refrigerator_id=1
@app.route('/refrigerator_contents', methods=['GET'])
def refrigerator_contents():
    # Get the QueryParam 'refrigerator_id' from the request
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    refrigerator_content = database.find_refrigerator_contents(refrigerator_id)
    app.logger.info(f'Retrieved refrigerator contents for {refrigerator_id}')
    return jsonify(refrigerator_content.__json__()), 200


# /number_linked_refrigerators?user_id=1
@app.route('/number_linked_refrigerators', methods=['GET'])
def number_linked_refrigerators():
    user_id = request.args.get('user_id')
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    result = database.find_linked_refrigerators(user_id)
    number_refrigerators = len(result['refrigerators'])

    app.logger.info(f"There was a request for the number of the linked refrigerators for user {user_id}"
                    f" ,returned {number_refrigerators}")
    response = {"number_linked_refrigerators": number_refrigerators}
    return response, 200


# /update_refrigerator_name?user_id=1 , json={"refrigerator_id": 1, "new_name": "Main Refrigerator"}
@app.route('/update_refrigerator_name', methods=['POST'])
def update_refrigerator_name():
    user_id = request.args.get('user_id')
    data = request.get_json()
    # If 'new_name' or 'refrigerator_id' keys are missing, return an error response
    if not ('new_name' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of update_refrigerator_name endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    refrigerator_id = data['refrigerator_id']
    new_name = data['new_name']
    database = app.extensions['database']

    if not database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
        app.logger.warning(f'Attempt to access user {user_id} that does not exist')
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    database.change_refrigerator_nickname(refrigerator_id, user_id, new_name)
    app.logger.info(f"User {user_id} changed the name of refrigerator {refrigerator_id} to {new_name}")
    message_response = {'message': "The name was updated successfully"}
    return jsonify(message_response), 200


# /update_product_alert_date , json={"refrigerator_id": 1, "product_name": "Milk 1% 1L Tnuva", "alert_date": "2024-09-25"}
@app.route('/update_product_alert_date', methods=['POST'])
def update_product_alert_date():
    data = request.get_json()
    # If 'refrigerator_id' or 'product_name' or 'alert_date' keys are missing, return an error response
    if not ('refrigerator_id' in data and 'product_name' in data and 'alert_date' in data):
        app.logger.error("Invalid request of update_alert_date endpoint")
        error_response = {'error': "invalid request"}
        return error_response, 400

    refrigerator_id = data['refrigerator_id']
    product_name = data['product_name']
    alert_date = data['alert_date']
    database = app.extensions['database']

    barcode = database.find_barcode(product_name)
    if barcode is None:
        app.logger.warning(f"Attempt to get barcode of product_name {product_name} that wasn't found in the database")
        error_response = {'error': f"Barcode of product_name {product_name} not found"}
        return error_response, 404

    if not database.check_2values_exist(table_name="refrigerator_content", column_name1="refrigerator_id",
                                        column_name2="barcode", value1=refrigerator_id, value2=barcode):
        app.logger.warning(f"Attempt to update alert_date of refrigerator {refrigerator_id} with product {product_name}"
                           f" barcode {barcode} that was not found in the database")
        error_response = {'error': f"Refrigerator {refrigerator_id} with product {product_name} barcode {barcode}"
                                   f" wasn't found in database"}
        return error_response, 404

    if not Functions.is_future_date(alert_date):
        app.logger.warning(f"Attempt to update alert_date with date {alert_date} that is in the past")
        error_response = {'error': f"Alert date {alert_date} is in the past"}
        return error_response, 400

    database.update_alert_date(refrigerator_id, barcode, alert_date)
    app.logger.info(f"Alert date of refrigerator {refrigerator_id} with product {product_name} barcode {barcode}"
                    f" updated successfully to {alert_date}")
    message_response = {'message': f"Alert_date updated successfully"}
    return message_response, 200


# /get_product_alert_date?refrigerator_id=1&product_name=Eggs pack 12L free organic
@app.route('/get_product_alert_date', methods=['GET'])
def get_product_alert_date():
    refrigerator_id = request.args.get('refrigerator_id')
    product_name = request.args.get('product_name')
    database = app.extensions['database']

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
def get_refrigerator_content_expired():
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f"Attempt to access refrigerator {refrigerator_id} that does not exist")
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return error_response, 404

    refrigerator_content = database.find_refrigerator_contents_with_alerts_dates_in_the_past(refrigerator_id)
    app.logger.info(f"Get refrigerator {refrigerator_id} contents with products there alert date passed")
    return refrigerator_content.__json__(), 200


def get_statistics_by_table_name(table_name):
    refrigerator_id = request.args.get('refrigerator_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    database = app.extensions['database']

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
def get_entry_statistics():
    return get_statistics_by_table_name(table_name="entry_table")


# /get_exit_statistics?refrigerator_id=1&start_date=2024-07-20&end_date=2024-07-21
@app.route('/get_exit_statistics', methods=['GET'])
def get_exit_statistics():
    return get_statistics_by_table_name(table_name="exit_table")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345, threaded=True)
