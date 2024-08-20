from flask import jsonify
from datetime import datetime
from flask_mail import Mail, Message


def is_future_date(alert_date_str):
    # Convert the string to a datetime object
    alert_date = datetime.strptime(alert_date_str, '%Y-%m-%d')
    now = datetime.now()
    # Check if the alert_date is in the future
    return alert_date > now


class Utils:

    def __init__(self, app):
        self.app = app
        self.mail = Mail(app)
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

    def check_barcode_already_exist(self, barcode):
        if self.database.check_value_exist(table_name="product", column_name="barcode", value=barcode):
            self.app.logger.warning(
                f"Attempt to add product to DataBase 'product' with barcode={barcode} that already exists")
            error_response = {'error': f"barcode={barcode} already exists"}
            return jsonify(error_response), 400
        else:
            return None

    def check_product_name_already_exist(self, product_name):
        if self.database.check_value_exist(table_name="product", column_name="product_name", value=product_name):
            self.app.logger.warning(
                f"Attempt to add product to DataBase 'product' with name={product_name} that already exists")
            error_response = {'error': f"product name={product_name} already exists"}
            return error_response, 400
        else:
            return None

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

    def update_product_alert_date(self,refrigerator_id, barcode, alert_date):

        if alert_date is not None and not is_future_date(alert_date):
            self.app.logger.warning(f"Attempt to update alert_date with date={alert_date} that is in the past")
            error_response = {'error': f"Alert date={alert_date} is in the past"}
            return error_response, 400

        self.database.update_alert_date(refrigerator_id, barcode, alert_date)
        self.app.logger.info(
            f"Alert date of refrigerator={refrigerator_id} with product barcode={barcode} updated successfully"
            f" to alert_date={alert_date}")
        message_response = {'message': f"Alert_date updated successfully to {alert_date}"}
        return message_response, 200

    def update_product_quantity(self,refrigerator_id, barcode, quantity):
        if quantity < 0:
            self.app.logger.warning(f"Attempt to update quantity with negative quantity, quantity={quantity}")
            error_response = {'error': f"quantity is negative"}
            return error_response, 400
        elif quantity == 0:
            self.database.refrigerator_content_delete_product(refrigerator_id, barcode)
            self.app.logger.info(f'Deleted product barcode={barcode} from refrigerator number={refrigerator_id}')
            message_response = {
                'message': f"The product has been successfully deleted from refrigerator number={refrigerator_id}"}
            return message_response, 200
        else:  # quantity > 0
            self.database.update_product_quantity(refrigerator_id, barcode, quantity)
            self.app.logger.info(
                f'Set quantity={quantity} for product barcode={barcode} from refrigerator number={refrigerator_id}')
            message_response = {
                'message': f"The product quantity updated to {quantity} at refrigerator number={refrigerator_id}"}
            return message_response, 200

    def get_statistics_by_table_name(self,table_name, refrigerator_id, start_date, end_date):
        if not start_date <= end_date:
            self.app.logger.warning(
                f"Attempt to get {table_name} statistics when start_date={start_date} is after the end_date={end_date}")
            error_response = {'error': f"Start date {start_date} is after end date {end_date}"}
            return error_response, 400

        products_and_quantities = self.database.find_products_and_quantities_between_dates(table_name, refrigerator_id,
                                                                                      start_date, end_date)
        self.app.logger.info(
            f"Get {table_name} statistics of refrigerator={refrigerator_id} start_date={start_date} end_date={end_date}")
        return products_and_quantities

    def scanned_new_product(self,barcode):
        database = self.app.extensions['database']

        if database.check_value_exist(table_name="pending_barcode", column_name="barcode", value=barcode):
            self.app.logger.info(f"Barcode={barcode} already at pending_barcode table")
        else:
            database.add_barcode(barcode)
            msg = Message(
                subject="New barcode to add",
                recipients=["foodwiselmi@gmail.com"],
                body=f"Barcode: {barcode}"
            )
            self.mail.send(msg)
            self.app.logger.info(f"Barcode={barcode} added to pending_barcode table and email sent")

        message_response = {'message': f"Product with barcode={barcode} not at database, the adding request at pending"}
        return message_response, 404


