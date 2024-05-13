from flask import Flask, request, jsonify, abort
from Database import Database

app = Flask(__name__)

database = Database()
app.extensions['database'] = database


@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()  # Get the JSON data from the request
    # Check if 'barcode' and 'mode' keys exist in the JSON data
    if 'barcode' in data and 'mode' in data and 'refrigerator_id' in data:
        barcode = data['barcode']
        mode = data['mode']
        refrigerator_id = data['refrigerator_id']

        database = app.extensions['database']

        # identify the product by the given barcode
        product_name = database.find_product(barcode)

        if product_name is None:
            abort(404, description=f"Product with barcode {barcode} not found")

        if mode == 'add':
            print(f'Adding {product_name} to refrigerator number: {refrigerator_id}')
            database.add_product(refrigerator_id, barcode)
            return jsonify({'message': f"The product has been successfully added to the refrigerator number {refrigerator_id}"}), 200

        else:
            print(f'Removing {product_name} from database')
            result = database.remove_product(refrigerator_id, barcode)
            if result:
                return jsonify({'message': f"The product has been successfully removed from refrigerator number {refrigerator_id}"}), 200
            else:
                abort(404, description=f"Product with barcode {barcode} not found in the rerigerator number {refrigerator_id}")


    else:
        # If 'barcode' or 'mode' keys are missing, return an error response
        error_response = {'error': 'Barcode and mode are required fields'}
        return jsonify(error_response), 400


@app.route('/refrigerator_contents', methods=['GET'])
def get_refrigerator_contents():
    refrigerator_id = request.args.get('refrigerator_id')
    database = app.extensions['database']
    refrigerator_contents = database.find_refrigerator_contents(refrigerator_id)
    return jsonify(refrigerator_contents), 200


#app.debug = True

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345)
