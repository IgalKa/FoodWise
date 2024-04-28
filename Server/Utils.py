import sqlite3


def find_product_name(barcode):
    # Connect to the SQLite database
    conn = sqlite3.connect('data_bases\\Products.db')
    cursor = conn.cursor()

    # Execute a SELECT query to find the name of the product with the given barcode
    cursor.execute("SELECT name FROM product WHERE barcode = ?", (barcode,))
    result = cursor.fetchone()  # Fetch the first row of the result

    # Close the database connection
    conn.close()

    # If a row was found, return the name, otherwise return None
    if result:
        return result[0]  # Return the first column of the result (name)
    else:
        return None