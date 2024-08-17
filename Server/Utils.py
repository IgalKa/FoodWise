from flask import jsonify
from datetime import datetime


def is_future_date(alert_date_str):
    # Convert the string to a datetime object
    alert_date = datetime.strptime(alert_date_str, '%Y-%m-%d')
    now = datetime.now()
    # Check if the alert_date is in the future
    return alert_date > now


class Utils:

    def __init__(self, app):
        self.app = app
        self.database = app.extensions['database']

    def check_refrigerator_exist(self, refrigerator_id):
        # identify if the refrigerator id exists
        if not self.database.check_value_exist(table_name="refrigerator", column_name="refrigerator_id",
                                               value=refrigerator_id):
            self.app.logger.warning(f'Attempt to access refrigerator {refrigerator_id} that does not exist')
            error_response = {'error': f"Refrigerator number {refrigerator_id} does not exist"}
            return jsonify(error_response), 404
        else:
            return None

    def check_user_exist(self, user_id):
        if not self.database.check_value_exist(table_name="user", column_name="user_id", value=user_id):
            self.app.logger.warning(f'Attempt to access user {user_id} that does not exist')
            error_response = {'error': f"User with id {user_id} does not exist"}
            return jsonify(error_response), 404
        else:
            return None

    def check_email_already_exist(self, email):
        if self.database.check_value_exist(table_name="user", column_name="email", value=email):
            self.app.logger.warning(f'User with email {email} already exists')
            error_response = {'error': f"User with email {email} already exists"}
            return jsonify(error_response), 400
        else:
            return None

    def check_email_exist(self, email):
        if not self.database.check_value_exist(table_name="user", column_name="email", value=email):
            self.app.logger.warning(f"Attempt to access user with email: {email} that does not exist")
            error_response = {'error': f"User with email {email} does not exist"}
            return jsonify(error_response), 404

    def validate_link(self, user_id, refrigerator_id):
        if not self.database.validate_request(user_id, refrigerator_id):
            self.app.logger.warning(
                f'Attempt to access refrigerator {refrigerator_id} that does not linked to user {user_id}')
            error_response = {'error': f"Invalid authentication "}
            return jsonify(error_response), 404
        else:
            return None

    def add_product_to_refrigerator(self, refrigerator_id, product_name, barcode):
        self.app.logger.info(f'Adding {product_name} to refrigerator number: {refrigerator_id}')
        self.database.add_product(refrigerator_id, barcode)
        message_response = {
            'message': f"The product has been successfully added to the refrigerator number {refrigerator_id}"}
        return jsonify(message_response), 200

    def remove_product_from_refrigerator(self, refrigerator_id, product_name, barcode):
        self.app.logger.info(f'Removing {product_name} from refrigerator number: {refrigerator_id}')
        result = self.database.remove_product(refrigerator_id, barcode)
        if result:
            self.app.logger.info(
                f'The product has been successfully removed from refrigerator number {refrigerator_id}')
            message_response = {
                'message': f"The product has been successfully removed from refrigerator number {refrigerator_id}"}
            return jsonify(message_response), 200

        else:
            self.app.logger.warning(
                f'Product with barcode {barcode} not found in the refrigerator number {refrigerator_id}')
            error_response = {
                'error': f"Product with barcode {barcode} not found in the refrigerator number {refrigerator_id}"}
            return jsonify(error_response), 404

    def find_product_by_barcode(self, barcode):
        product_name = self.database.find_product(barcode)
        return product_name

    def product_not_found(self, barcode):
        self.app.logger.warning(f'Attempt to get product with barcode {barcode} that was not found in the database')
        error_response = {'error': f"Product with barcode {barcode} not found"}
        return jsonify(error_response), 404

    def barcode_not_found(self, product_name):
        self.app.logger.warning(f"Attempt to get barcode of product_name {product_name}"
                                f" that wasn't found in the database")
        error_response = {'error': f"Barcode of product_name {product_name} not found"}
        return error_response, 404

    def check_valid_list(self, data, endpoint_name, *keys):
        # Check if data is a list
        if not isinstance(data, list):
            self.app.logger.warning(f'Invalid data format for {endpoint_name} endpoint : not a list')
            error_response = {'error': 'Invalid data format. Expected a list'}
            return jsonify(error_response), 400

        for product in data:
            for key in keys:
                if key not in product:
                    self.app.logger.warning(
                        f'Invalid data format for {endpoint_name} endpoint : Each object must '
                        f'contain barcode and amount keys')
                    error_response = {"error": "Each object must contain"
                                               + ' and '.join(f"'{key}'" for key in keys) + "keys."}
                    return jsonify(error_response), 400

        return None
