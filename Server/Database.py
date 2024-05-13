import sqlite3
from datetime import datetime


class Database:
    def __init__(self):
        self.path = 'data_bases\\database.db'

    def find_product(self, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()


        # Execute a SELECT query to find the name of the product with the given barcode
        cursor.execute("SELECT product_name "
                       "FROM product "
                       "WHERE barcode = ? ",(int(barcode),))

        result = cursor.fetchone()

        print(result)

        conn.close()

        # If a row was found, return the name, otherwise return None
        if result:
            return result[0]  # Return the first column of the result (name)
        else:
            return None

    def find_refrigerator_contents(self, refrigerator_id):

        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name,product_quantity "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ?",
                       (refrigerator_id,))
        result = cursor.fetchall()

        conn.close()

        # If a row was found, return the name, otherwise return None
        return result

    def add_product(self, refrigerator_id, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        # Execute a SELECT query to find the name of the product with the given barcode
        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id,barcode))
        result = cursor.fetchone()  # Fetch the first row of the result

        if result:
            cursor.execute(
                "UPDATE refrigerator_content "
                "SET product_quantity=?, oldest_added_date=? "
                "WHERE refrigerator_id = ? and barcode = ?",
                (result[0] + 1, datetime.now(), refrigerator_id, barcode))

        else:
            data = (refrigerator_id, barcode, 1, datetime.now())
            cursor.execute(
                "INSERT INTO refrigerator_content (refrigerator_id,barcode,product_quantity,oldest_added_date)  "
                "VALUES (?,?,?,?)",data)

        conn.commit()
        conn.close()

    def remove_product(self, refrigerator_id, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        # Execute a SELECT query to find the name of the product with the given barcode
        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id,barcode))
        result = cursor.fetchone()  # Fetch the first row of the result


        if result:
            if result[0] == 1:
                cursor.execute("DELETE FROM refrigerator_content "
                               "WHERE refrigerator_id = ? and barcode = ?",
                               (refrigerator_id,barcode))
            else:
                cursor.execute("UPDATE refrigerator_content "
                               "SET product_quantity=? "
                               "WHERE refrigerator_id = ? and barcode = ?",
                                (result[0] - 1, refrigerator_id, barcode))
            conn.commit()

        conn.close()
        return result


