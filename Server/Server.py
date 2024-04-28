from flask import Flask, request, jsonify
from Utils import find_product_name,find_refrigerator_contents

app = Flask(__name__)


@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()  # Get the JSON data from the request
    # Check if 'barcode' and 'mode' keys exist in the JSON data
    if 'barcode' in data and 'mode' in data:
        barcode = data['barcode']
        mode = data['mode']

        # Do actions with the barcode and mode here
        if mode == 'add':
            print(f'Adding {barcode} to database')
            print(f'You want to add {find_product_name(barcode)} to database')
        else:
            print(f'Removing {barcode} from database')
            print(f'You want to delete {find_product_name(barcode)} from database')
        # Return a JSON response
        response = {'message': 'Data received successfully'}
        return jsonify(response), 200
    else:
        # If 'barcode' or 'mode' keys are missing, return an error response
        error_response = {'error': 'Barcode and mode are required fields'}
        return jsonify(error_response), 400


@app.route('/refrigerator_contents', methods=['GET'])
def get_refrigerator_contents():
    refrigerator_id=request.args.get('refrigerator_id')
    refrigerator_contents=find_refrigerator_contents(refrigerator_id)
    return jsonify(refrigerator_contents), 200


#app.debug = True

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345)
