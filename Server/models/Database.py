import random
import sqlite3
from datetime import datetime
from .Product import Product
from .Refrigerator import Refrigerator


class Database:
    def __init__(self, path, docker):
        self.path = path
        self.docker = docker

    def find_product(self, barcode):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name "
                       "FROM product "
                       "WHERE barcode = ? ",
                       (barcode,))
        result = cursor.fetchone()
        conn.close()
        # If a row was found, return the name, otherwise return None
        if result:
            return result[0]
        else:
            return None

    def find_barcode(self, product_name):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT barcode "
                       "FROM product "
                       "WHERE product_name = ? ",
                       (product_name,))
        result = cursor.fetchone()
        conn.close()
        # If a row was found, return the name, otherwise return None
        if result:
            return result[0]
        else:
            return None

    def search_products_by_product_name(self, product_name, all):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        if all == '1':
            cursor.execute("SELECT product_name, barcode "
                           "FROM product "
                           "WHERE product_name LIKE ? || '%'"
                           , (product_name,))
        else:
            cursor.execute("SELECT product_name, barcode "
                           "FROM product "
                           "WHERE product_name LIKE ? || '%' AND barcode LIKE ? || '%'"
                           , (product_name, "#"))

        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0], 'barcode': row[1]} for row in result[:10]]
        return products_json

    def find_refrigerator_contents(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name, barcode, product_quantity, oldest_added_date, alert_date "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ?",
                       (refrigerator_id,))
        result = cursor.fetchall()

        refrigerator = Refrigerator(refrigerator_id)
        for row in result:
            if self.docker:
                image_path = "/app/pictures/" + row[1] + ".jpg"
            else:
                image_path = "../Server/pictures/" + row[1] + ".jpg"
            product = Product(row[0], image_path, row[2], row[3], row[4])
            refrigerator.add_product(product)

        conn.close()
        return refrigerator

    def add_barcode(self, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("INSERT INTO pending_barcode (barcode) "
                       "VALUES (?)",
                       (barcode,))
        conn.commit()
        conn.close()

    def add_product(self, refrigerator_id, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()
        conn.close()

        if result:
            self.refrigerator_content_add_one_product(refrigerator_id, barcode, result[0])
        else:
            self.refrigerator_content_insert_product(refrigerator_id, barcode)

    def refrigerator_content_add_one_product(self, refrigerator_id, barcode, current_quantity):
        self.update_product_quantity(refrigerator_id, barcode, current_quantity + 1)

    def refrigerator_content_insert_product(self, refrigerator_id, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        now = datetime.now()
        formatted_current_date = now.strftime('%Y-%m-%d')

        cursor.execute(
            "INSERT INTO refrigerator_content (refrigerator_id, barcode, product_quantity, oldest_added_date)"
            "VALUES (?, ?, ?, ?)",
            (refrigerator_id, barcode, 1, formatted_current_date))
        conn.commit()
        conn.close()

        self.statistics_add_products_to_table("entry_table", refrigerator_id, barcode, 1)

    def remove_product(self, refrigerator_id, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()  # Fetch the first row of the result
        conn.close()

        if result:
            if result[0] == 1:
                self.refrigerator_content_delete_product(refrigerator_id, barcode)
            else:  # result[0] > 1
                self.refrigerator_content_remove_one_product(refrigerator_id, barcode, result[0])

        return result

    def refrigerator_content_delete_product(self, refrigerator_id, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? AND barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()
        quantity = result[0]

        cursor.execute("DELETE FROM refrigerator_content "
                   "WHERE refrigerator_id = ? and barcode = ?",
                   (refrigerator_id, barcode))
        conn.commit()
        conn.close()

        self.statistics_add_products_to_table("exit_table", refrigerator_id, barcode, quantity)

    def refrigerator_content_remove_one_product(self, refrigerator_id, barcode, current_quantity):
        self.update_product_quantity(refrigerator_id, barcode, current_quantity - 1)

    def update_product_quantity(self, refrigerator_id, barcode, quantity):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_quantity "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? AND barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()
        quantity_before = result[0]

        cursor.execute("UPDATE refrigerator_content "
                       "SET product_quantity = ? "
                       "WHERE refrigerator_id = ? and barcode = ?",
                       (quantity, refrigerator_id, barcode))
        conn.commit()
        conn.close()

        if quantity_before > quantity:
            self.statistics_add_products_to_table("exit_table", refrigerator_id, barcode,
                                                  quantity_before - quantity)
        else:  # quantity_before < quantity
            self.statistics_add_products_to_table("entry_table", refrigerator_id, barcode,
                                                  quantity - quantity_before)

    def statistics_add_products_to_table(self, table_name, refrigerator_id, barcode, quantity):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        if table_name == "entry_table":
            column_date = "entry_date"
        else:  # table_name == "exit_table"
            column_date = "exit_date"

        now = datetime.now()
        formatted_current_date = now.strftime('%Y-%m-%d')

        cursor.execute(f"SELECT quantity "
                       f"FROM {table_name} "
                       f"WHERE refrigerator_id = ? AND barcode = ? AND {column_date} = ?",
                       (refrigerator_id, barcode, formatted_current_date))
        result = cursor.fetchone()

        if result:
            cursor.execute(
                f"UPDATE {table_name} "
                f"SET quantity = ? "
                f"WHERE refrigerator_id = ? AND barcode = ? AND {column_date} = ? ",
                (result[0] + quantity, refrigerator_id, barcode, formatted_current_date))
        else:
            cursor.execute(
                f"INSERT INTO {table_name} (refrigerator_id, barcode, {column_date}, quantity)"
                f"VALUES (?, ?, ?, ?)",
                (refrigerator_id, barcode, formatted_current_date, quantity))

        conn.commit()
        conn.close()

    def check_value_exist(self, table_name, column_name, value):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       f"FROM {table_name} " 
                       f"WHERE {column_name} = ? ",
                       (value,))
        result = cursor.fetchone()
        conn.close()

        if result:
            return True
        else:
            return False

    def check_2values_exist(self, table_name, column_name1, column_name2, value1, value2):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       f"FROM {table_name} "
                       f"WHERE {column_name1} = ? AND {column_name2} = ? ",
                       (value1, value2))
        result = cursor.fetchone()
        conn.close()

        if result:
            return True
        else:
            return False

    def check_3values_exist(self, table_name, column_name1, column_name2, column_name3, value1, value2, value3):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       f"FROM {table_name} "
                       f"WHERE {column_name1} = ? AND {column_name2} = ? AND {column_name3} = ? ",
                       (value1, value2, value3))
        result = cursor.fetchone()
        conn.close()

        if result:
            return True
        else:
            return False

    def validate_request(self, user_id, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       "FROM link "
                       "WHERE refrigerator_id = ? AND user_id = ?",
                       (refrigerator_id, user_id))
        result = cursor.fetchone()
        conn.close()

        return result is not None

    def add_user(self, email, password, first_name, last_name):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO user (email, password, first_name, last_name)"
            "VALUES (?, ?, ?, ?)",
            (email, password, first_name, last_name))

        conn.commit()
        conn.close()

    def get_user(self, email, password):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT user_id, first_name, last_name "
                       "FROM user "
                       "WHERE email = ? AND password = ?",
                       (email, password))
        result = cursor.fetchone()
        conn.close()
        # Check if result is not None
        if result:
            user_object = {
                'user_id': result[0],
                'first_name': result[1],
                'last_name': result[2]
            }
            return user_object
        else:
            return None  # Explicitly return None if no user is found

    def update_user_email(self, user_id, email):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE user "
                       "SET email = ? "
                       "WHERE user_id = ?",
                       (email, user_id))
        conn.commit()
        conn.close()

    def update_user_password(self, user_id, password):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE user "
                       "SET password = ? "
                       "WHERE user_id = ?",
                       (password, user_id))
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
                       "VALUES (?)",
                       (random_number,))
        conn.commit()
        conn.close()

        return random_number

    def link_refrigerator_to_user(self, refrigerator_id, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT * "
                       "FROM link "
                       "WHERE user_id = ? AND refrigerator_id = ?",
                       (user_id, refrigerator_id))
        result = cursor.fetchall()

        if result:
            conn.close()
            return "The link already exists", 0

        cursor.execute("SELECT * "
                       "FROM link"
                       " WHERE user_id = ? ",
                       (user_id,))
        result = cursor.fetchall()
        nickname = f"Refrigerator {len(result) + 1}"

        cursor.execute("INSERT INTO link (user_id, refrigerator_id, nickname) "
                       "VALUES (?, ?, ?)",
                       (user_id, refrigerator_id, nickname))
        conn.commit()
        conn.close()

        return "Link created", 1

    def find_linked_refrigerators(self, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT refrigerator_id, nickname "
                       "FROM link "
                       "WHERE user_id = ? ",
                       (user_id,))
        result = cursor.fetchall()

        linked_refrigerators = {"refrigerators": [{"refrigerator_id": row[0], "nickname": row[1]} for row in result]}
        conn.close()

        return linked_refrigerators

    def change_refrigerator_nickname(self, refrigerator_id, user_id, nickname):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE link "
                       "SET nickname = ? "
                       "WHERE user_id = ? AND refrigerator_id = ?",
                       (nickname, user_id, refrigerator_id))
        conn.commit()
        conn.close()

    def update_alert_date(self, refrigerator_id, barcode, alert_date):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE refrigerator_content "
                       "SET alert_date = ?"
                       "WHERE refrigerator_id = ? AND barcode = ?",
                       (alert_date, refrigerator_id, barcode))
        conn.commit()
        conn.close()

    def get_alert_date(self, refrigerator_id, barcode):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT alert_date "
                       "FROM refrigerator_content "
                       "WHERE refrigerator_id = ? AND barcode = ?",
                       (refrigerator_id, barcode))
        result = cursor.fetchone()
        conn.close()

        if result:
            return result[0]
        else:
            return None

    def find_refrigerator_contents_expired(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name, barcode, product_quantity, oldest_added_date, alert_date "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ? "
                       "AND alert_date IS NOT NULL "
                       "AND alert_date <= DATE('now')",
                       (refrigerator_id,))
        result = cursor.fetchall()

        refrigerator = Refrigerator(refrigerator_id)
        for row in result:
            if self.docker:
                image_path = "/app/pictures/" + row[1] + ".jpg"
            else:
                image_path = "../Server/pictures/" + row[1] + ".jpg"
            product = Product(row[0], image_path, row[2], row[3], row[4])
            refrigerator.add_product(product)
        conn.close()

        return refrigerator

    def find_products_and_quantities_between_dates(self, table_name, refrigerator_id, start_date, end_date):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        if table_name == "entry_table":
            column_date = "entry_date"
        else:  # table_name == "exit_table"
            column_date = "exit_date"

        cursor.execute("SELECT product_name, Sum(quantity) "
                       f"FROM {table_name} NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ? "
                       f"AND {column_date} >= ? AND {column_date} <= ? "
                       "GROUP BY barcode, product_name",
                       (refrigerator_id, start_date, end_date))
        result = cursor.fetchall()

        products = []
        for row in result:
            products.append({"product_name": row[0], "quantity": row[1]})
        conn.close()

        return {"products": products}

    def update_refrigerator_parameters(self, refrigerator_id, products):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM refrigerator_track "
            "WHERE refrigerator_id = ? ",
            (refrigerator_id,))

        for product in products:
            cursor.execute('''
                INSERT INTO refrigerator_track(refrigerator_id, barcode, amount)
                 VALUES (?, ?, ?)
            ''', (refrigerator_id, product['barcode'], product['amount']))

        conn.commit()
        conn.close()

    def save_shopping_list(self,refrigerator_id, products):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM shopping_list "
            "WHERE refrigerator_id = ? ",
            (refrigerator_id,))

        for product in products:
            cursor.execute('''
                        INSERT INTO shopping_list(refrigerator_id, product_name, amount)
                         VALUES (?, ?, ?)
                    ''', (refrigerator_id, product['product_name'], product['amount']))

        conn.commit()
        conn.close()

    def generate_initial_shopping_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT product_name, amount-COALESCE(product_quantity, 0) AS amount
            FROM refrigerator_track NATURAL LEFT OUTER JOIN refrigerator_content
            NATURAL INNER JOIN product
            WHERE refrigerator_track.refrigerator_id = ? AND (product_quantity IS null OR amount > product_quantity)
        """, (refrigerator_id,))
        result = cursor.fetchall()
        conn.close()

        products_json = [{'product_name': row[0], 'amount': row[1]} for row in result]
        return products_json

    def get_parameter_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT product_name, barcode, amount
            FROM refrigerator_track NATURAL INNER JOIN product
            WHERE refrigerator_id = ?  
        """, (refrigerator_id,))
        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0], 'barcode': row[1], 'amount': row[2]} for row in result]
        return products_json

    def get_shopping_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT product_name, amount
            FROM shopping_list
            WHERE refrigerator_id = ?
        """, (refrigerator_id,))
        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0], 'amount': row[1]} for row in result]
        return products_json

    def get_password_of_user_by_email(self, email):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT password 
            FROM user
            WHERE email = ?
        """, (email,))
        result = cursor.fetchone()
        conn.close()

        return result[0]

    def get_password_of_user_by_user_id(self, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT password "
                       "FROM user "
                       "WHERE user_id = ?",
                       (user_id,))
        result = cursor.fetchone()
        conn.close()

        return result[0]

    def add_new_product_to_DB(self, barcode, product_name):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("INSERT INTO product(barcode, product_name, image) "
                       "VALUES (?, ?, ?) ",
                       (barcode, product_name, None))
        conn.commit()
        conn.close()
