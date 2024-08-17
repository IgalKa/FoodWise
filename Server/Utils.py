from flask import jsonify
from datetime import datetime


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

    def is_future_date(self, alert_date_str):
        # Convert the string to a datetime object
        alert_date = datetime.strptime(alert_date_str, '%Y-%m-%d')
        now = datetime.now()
        # Check if the alert_date is in the future
        return alert_date > now
