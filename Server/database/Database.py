import random
import sqlite3
from datetime import datetime
from Server.models.Refrigerator import Refrigerator
from Server.models.Product import Product


class Database:
    def __init__(self, path):
        self.path = path

    def find_product(self, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        # Execute a SELECT query to find the name of the product with the given barcode
        cursor.execute("SELECT product_name "
                       "FROM product "
                       "WHERE barcode = ? ",
                       (int(barcode),))
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

        cursor.execute("SELECT product_name,image,product_quantity,oldest_added_date "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ?",
                       (refrigerator_id,))
        result = cursor.fetchall()

        refrigerator = Refrigerator(refrigerator_id)
        for row in result:
            product = Product(row[0], row[1], row[2], row[3])
            refrigerator.add_product(product)

        conn.close()
        return refrigerator

    def add_product(self, refrigerator_id, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()  # Fetch the first row of the result

        if result:
            cursor.execute(
                "UPDATE refrigerator_content "
                "SET product_quantity=?"
                "WHERE refrigerator_id = ? and barcode = ?",
                (result[0] + 1, refrigerator_id, barcode))
        else:
            data = (refrigerator_id, barcode, 1, datetime.now())
            cursor.execute(
                "INSERT INTO refrigerator_content (refrigerator_id,barcode,product_quantity,oldest_added_date)"
                "VALUES (?,?,?,?)", data)

        conn.commit()
        conn.close()

    def remove_product(self, refrigerator_id, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()  # Fetch the first row of the result

        if result:
            if result[0] == 1:
                cursor.execute("DELETE FROM refrigerator_content "
                               "WHERE refrigerator_id = ? and barcode = ?",
                               (refrigerator_id, barcode))
            else:
                cursor.execute("UPDATE refrigerator_content "
                               "SET product_quantity=? "
                               "WHERE refrigerator_id = ? and barcode = ?",
                               (result[0] - 1, refrigerator_id, barcode))
            conn.commit()

        conn.close()
        return result

    def check_value_exist(self, table_name, column_name, value):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute("SELECT * "
                       "FROM " + table_name +
                       " WHERE " + column_name + " = ? ", (value,))

        result = cursor.fetchone()
        conn.close()
        if result:
            return True
        else:
            return False

    def add_user(self, email, password, first_name, last_name):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        data = (email, password, first_name, last_name)
        cursor.execute(
            "INSERT INTO user (email,password,first_name,last_name)"
            "VALUES (?,?,?,?)", data)

        conn.commit()
        conn.close()

    def generate_refrigerator_id(self):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        while (True):
            random_number = random.randint(100000000, 999999999)
            if not self.check_value_exist(table_name="refrigerator", column_name="refrigerator_id",
                                          value=random_number):
                break

        cursor.execute("INSERT INTO refrigerator (refrigerator_id)"
                       "VALUES (?)", (random_number,))

        conn.commit()
        conn.close()
        return random_number

    def link_refrigerator_to_user(self, refrigerator_id, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       "FROM link "
                       "WHERE user_id = ? AND refrigerator_id = ?", (user_id, refrigerator_id))
        result = cursor.fetchall()

        if result:
            return "the link already exists", 0

        cursor.execute("SELECT * "
                       "FROM link"
                       " WHERE user_id = ? ", (user_id,))
        result = cursor.fetchall()
        nickname = f"Refrigerator {len(result)+1}"

        cursor.execute("INSERT INTO link (user_id, refrigerator_id,nickname) "
                       "VALUES (?, ?,?)", (user_id, refrigerator_id, nickname))
        conn.commit()
        conn.close()
        return "link created", 1

    def find_linked_refrigerators(self, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT refrigerator_id,nickname "
                       "FROM link "
                       "WHERE user_id = ? ", (user_id,))
        result = cursor.fetchall()

        return {"refrigerators": [{"refrigerator_id": row[0], "nickname": row[1]} for row in result]}

    def change_refrigerator_nickname(self, refrigerator_id, user_id, nickname):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE link "
                       "SET nickname =? "
                       "WHERE user_id = ? AND refrigerator_id = ?", (nickname, user_id, refrigerator_id))

        conn.commit()
        conn.close()