from flask import Flask, request, jsonify
import logging
import sys
from os.path import abspath, dirname, join

# Calculate the project root directory and add it to sys.path
project_root = abspath(join(dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from database.Database import Database

app = Flask(__name__)

# Set up basic configuration for logging to the console
logging.basicConfig(level=logging.DEBUG,  # Log level
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app.extensions['database'] = Database("../Server/data/database.db")


#     Embedded endpoints


@app.route('/request_refrigerator_id', methods=['GET'])
def request_refrigerator_id():
    database = app.extensions['database']
    new_refrigerator_id = database.generate_refrigerator_id()
    app.logger.info(f"The number {new_refrigerator_id} has been assigned to a new refrigerator as id")
    return jsonify(new_refrigerator_id), 200


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


@app.route('/refrigerator_contents', methods=['GET'])
def refrigerator_contents():
    # Get the QueryParam 'refrigerator_id' from the request
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        refrigerator_content = database.find_refrigerator_contents(refrigerator_id)
        app.logger.info(f'Retrieved refrigerator contents for {refrigerator_id}')
        return jsonify(refrigerator_content.__json__()), 200
    else:
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404


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


@app.route('/update_refrigerator_name', methods=['POST'])
def update_refrigerator_name():
    database = app.extensions['database']
    user_id = request.args.get('user_id')
    data = request.get_json()
    # If 'new_name' or 'refrigerator_id' keys are missing, return an error response
    if not ('new_name' in data and 'refrigerator_id' in data):
        app.logger.error("Invalid request of update_refrigerator_name endpoint")
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    refrigerator_id = data['refrigerator_id']
    new_name = data['new_name']

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


@app.route('/find_product_number', methods=['GET'])
def find_product_number():
    product_name = request.args.get('product_name')
    database = app.extensions['database']

    result = database.find_barcode(product_name)
    app.logger.info(f"The result of the search for {product_name} is {result}")
    return jsonify(result), 200


@app.route('/update_refrigerator_parameters', methods=['POST'])
def update_refrigerator_parameters():
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')
    data = request.get_json()

    if not database.check_value_exist("refrigerator","refrigerator_id" ,refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    # Check if data is a list
    if not isinstance(data, list):
        error_response = {'error': 'Invalid data format. Expected a list'}
        return jsonify(error_response), 400

    for product in data:
        # Ensure each object has 'barcode' and 'amount' keys
        if 'barcode' not in product or 'amount' not in product:
            error_response ={"error": "Each object must contain 'barcode' and 'amount' keys."}
            return jsonify(error_response), 400



    database.update_refrigerator_parameters(refrigerator_id, data)
    message_response = {'message': "The refrigerator parameters were updated successfully"}
    return jsonify(message_response), 200



@app.route('/save_shopping_list', methods=['POST'])
def save_shopping_list():
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')
    data = request.get_json()

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404


    if not isinstance(data, list):
        error_response = {'error': 'Invalid data format. Expected a list'}
        return jsonify(error_response), 400

    for product in data:
        if 'product_name' not in product or 'amount' not in product:
            error_response = {"error": "Each object must contain 'barcode' and 'amount' keys."}
            return jsonify(error_response), 400

    result = database.save_shopping_list(refrigerator_id,data)
    return jsonify(result), 200



@app.route('/create_shopping_list', methods=['GET'])
def create_shopping_list():
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    result = database.generate_shopping_list(refrigerator_id)
    return jsonify(result), 200



@app.route('/parameter_list', methods=['GET'])
def parameter_list():
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    result = database.get_parameter_list(refrigerator_id)
    return jsonify(result), 200


@app.route('/shopping_list', methods=['GET'])
def shopping_list():
    database = app.extensions['database']
    refrigerator_id = request.args.get('refrigerator_id')

    if not database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id", value=refrigerator_id):
        app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    result = database.get_shopping_list(refrigerator_id)
    return jsonify(result), 200



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345, threaded=True)
