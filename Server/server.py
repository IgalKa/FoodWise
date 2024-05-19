from flask import Flask, request, jsonify
from database.Database import Database
import logging

app = Flask(__name__)

# Set up basic configuration for logging to the console
logging.basicConfig(level=logging.DEBUG,  # Log level
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

database = Database("../Server/data/database.db")
app.extensions['database'] = database


@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()  # Get the Body JSON data from the request
    # Check if 'barcode', 'mode', 'refrigerator_id' keys exist in the JSON data
    if 'barcode' in data and 'mode' in data and 'refrigerator_id' in data:
        barcode = data['barcode']
        mode = data['mode']
        refrigerator_id = data['refrigerator_id']
        database = app.extensions['database']
        # identify the product by the given barcode
        product_name = database.find_product(barcode)

        if product_name is None:
            error_response = {'error': f"Product with barcode {barcode} not found"}
            return jsonify(error_response), 404

        # identify if the refrigerator id exists
        if not database.check_value_exist(table_name="refrigerator",column_name="refrigerator_id", value=refrigerator_id):
            error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
            return jsonify(error_response), 404

        if mode == 'add':
            print(f'Adding {product_name} to refrigerator number: {refrigerator_id}')
            database.add_product(refrigerator_id, barcode)
            message_response = {
                'message': f"The product has been successfully added to the refrigerator number {refrigerator_id}"}
            return jsonify(message_response), 200
        elif mode == 'remove':
            print(f'Removing {product_name} from database')
            result = database.remove_product(refrigerator_id, barcode)
            if result:
                message_response = {
                    'message': f"The product has been successfully removed from refrigerator number {refrigerator_id}"}
                return jsonify(message_response), 200
            else:
                error_response = {
                    'error': f"Product with barcode {barcode} not found in the refrigerator number {refrigerator_id}"}
                return jsonify(error_response), 404
        else:
            error_response = {'error': f"Mode {mode} not supported"}
            return jsonify(error_response), 405
    else:
        # If 'barcode' or 'mode' or 'refrigerator_id' keys are missing, return an error response
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400


@app.route('/refrigerator_contents', methods=['GET'])
def refrigerator_contents():
    # Get the QueryParam 'refrigerator_id' from the request
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']

    if database.check_value_exist(table_name="refrigerator",column_name="refrigerator_id", value=refrigerator_id):
        refrigerator_contents = database.find_refrigerator_contents(refrigerator_id)
        return jsonify(refrigerator_contents.__json__()), 200
    else:
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404


@app.route('/register', methods=['POST'])
def register_new_user():
    data = request.get_json()  # Get the Body JSON data from the request
    # Check if 'barcode', 'mode', 'refrigerator_id' keys exist in the JSON data
    if 'email' in data and 'password' in data and 'first_name' in data and 'last_name' in data:
        email = data['email']
        password = data['password']
        first_name = data['first_name']
        last_name = data['last_name']
        database = app.extensions['database']

        # identify if this email already exists
        if database.check_value_exist(table_name="user",column_name="email", value=email):
            error_response = {'error': f"User with email {email} already exists"}
            return jsonify(error_response), 400
        else:
            print(f'Adding user {email} to the database')
            database.add_user(email, password, first_name, last_name)
            message_response = {
                'message': f"The user {first_name} {last_name} has been successfully added to the database"}
            return jsonify(message_response), 200


@app.route('/request_refrigerator_id', methods=['GET'])
def get_request_refrigerator_id():
    database = app.extensions['database']
    new_refrigerator_id = database.generate_refrigerator_id()
    app.logger.info(f"The number {new_refrigerator_id} has been assigned to a new refrigerator as id")
    return jsonify(new_refrigerator_id), 200


@app.route('/link', methods=['POST'])
def link():
    data = request.get_json()  # Get the Body JSON data from the request
    if not ('user_id' in data and 'refrigerator_id' in data):
        error_response = {'error': 'invalid request'}
        return jsonify(error_response), 400

    user_id = data['user_id']
    refrigerator_id = data['refrigerator_id']

    database = app.extensions['database']

    if not database.check_value_exist(table_name="user",column_name="user_id", value=user_id):
        error_response = {'error': f"User with id {user_id} does not exist"}
        return jsonify(error_response), 404

    if not database.check_value_exist(table_name="refrigerator",column_name="refrigerator_id", value=refrigerator_id):
        error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
        return jsonify(error_response), 404

    result = database.link_refrigerator_to_user(refrigerator_id, user_id)
    if result[1] == 1:
        app.logger.info(f"user {user_id} has been linked to refrigerator {refrigerator_id}")
    else:
        app.logger.warning(f"There was an attempt to make an existing link between user {user_id} to refrigerator {refrigerator_id}")
    message_response = {'message': result[0]}
    return jsonify(message_response), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345)