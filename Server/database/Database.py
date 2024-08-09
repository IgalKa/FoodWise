import random
import sqlite3
from datetime import datetime , timedelta
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

        conn.close()
        # If a row was found, return the name, otherwise return None
        if result:
            return result[0]  # Return the first column of the result (product_name)
        else:
            return None

    def find_barcode(self, product_name):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT barcode "
                       "FROM product "
                       "WHERE product_name = ? ",
                       (product_name,)
                       )
        result = cursor.fetchone()

        conn.close()
        # If a row was found, return the name, otherwise return None
        if result:
            return result[0]  # Return the first column of the result (barcode)
        else:
            return None

    def search_products_by_product_name(self,product_name):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name,barcode "
                        "FROM product "
                        "WHERE product_name LIKE ? || '%'"
                       ,(product_name,))


        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0], 'barcode': row[1]} for row in result[:10]]
        return products_json



    def find_refrigerator_contents(self, refrigerator_id):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name,image,product_quantity,oldest_added_date,alert_date "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ?",
                       (refrigerator_id,))
        result = cursor.fetchall()

        refrigerator = Refrigerator(refrigerator_id)
        for row in result:
            product = Product(row[0], row[1], row[2], row[3], row[4])
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
                "SET product_quantity = ?"
                "WHERE refrigerator_id = ? and barcode = ?",
                (result[0] + 1, refrigerator_id, barcode))
        else:
            now = datetime.now()
            formatted_current_date = now.strftime('%Y-%m-%d')
            data = (refrigerator_id, barcode, 1, formatted_current_date)
            cursor.execute(
                "INSERT INTO refrigerator_content (refrigerator_id,barcode,product_quantity,oldest_added_date)"
                "VALUES (?,?,?,?)", data)

        conn.commit()
        conn.close()
        self.statistics_add_product_to_table("entry_table", refrigerator_id, barcode)

    def statistics_add_product_to_table(self, table_name, refrigerator_id, barcode):
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
                (result[0] + 1, refrigerator_id, barcode, formatted_current_date)
            )
        else:
            cursor.execute(
                f"INSERT INTO {table_name} (refrigerator_id,barcode,{column_date},quantity)"
                f"VALUES (?,?,?,?)",
                (refrigerator_id, barcode, formatted_current_date, 1))

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
                               "SET product_quantity = ? "
                               "WHERE refrigerator_id = ? and barcode = ?",
                               (result[0] - 1, refrigerator_id, barcode))
            conn.commit()

        conn.close()
        self.statistics_add_product_to_table("exit_table", refrigerator_id, barcode)
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

    def check_2values_exist(self, table_name, column_name1, column_name2, value1, value2):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute("SELECT * "
                       "FROM " + table_name +
                       " WHERE " + column_name1 + " = ? AND " + column_name2 + " = ? ", (value1, value2))

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

    def get_user(self, email, password):
        # Connect to the SQLite database
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        data = (email, password)
        cursor.execute("SELECT user_id, first_name, last_name "
                       "FROM user "
                       "WHERE email = ? AND password = ?", data)
        result = cursor.fetchone()
        conn.close()
        return result

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
            conn.close()
            return "The link already exists", 0

        cursor.execute("SELECT * "
                       "FROM link"
                       " WHERE user_id = ? ", (user_id,))
        result = cursor.fetchall()
        nickname = f"Refrigerator {len(result) + 1}"

        cursor.execute("INSERT INTO link (user_id, refrigerator_id,nickname) "
                       "VALUES (?,?,?)", (user_id, refrigerator_id, nickname))
        conn.commit()
        conn.close()
        return "Link created", 1

    def find_linked_refrigerators(self, user_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT refrigerator_id,nickname "
                       "FROM link "
                       "WHERE user_id = ? ", (user_id,))
        result = cursor.fetchall()

        linked_refrigerators = {"refrigerators": [{"refrigerator_id": row[0], "nickname": row[1]} for row in result]}
        conn.close()
        return linked_refrigerators

    def change_refrigerator_nickname(self, refrigerator_id, user_id, nickname):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("UPDATE link "
                       "SET nickname = ? "
                       "WHERE user_id = ? AND refrigerator_id = ?", (nickname, user_id, refrigerator_id))
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
                       (refrigerator_id, barcode)
                       )
        result = cursor.fetchone()
        conn.close()

        if result:
            return result[0]
        else:
            return None

    def find_refrigerator_contents_with_alerts_dates_in_the_past(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_name,image,product_quantity,oldest_added_date,alert_date "
                       "FROM refrigerator_content NATURAL INNER JOIN product "
                       "WHERE refrigerator_id = ? "
                       "AND alert_date IS NOT NULL "
                       "AND alert_date <= DATE('now')",
                       (refrigerator_id,))
        result = cursor.fetchall()

        refrigerator = Refrigerator(refrigerator_id)
        for row in result:
            product = Product(row[0], row[1], row[2], row[3], row[4])
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
            "WHERE refrigerator_id = ? ", (refrigerator_id,)
        )

        for product in products:
            cursor.execute('''
                INSERT INTO refrigerator_track(refrigerator_id,barcode, amount) VALUES (?,?,?)
            ''', (refrigerator_id,product['barcode'],product['amount']))

        conn.commit()
        conn.close()


    def save_shopping_list(self,refrigerator_id, products):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM shopping_list "
            "WHERE refrigerator_id = ? ", (refrigerator_id,)
        )

        for product in products:
            cursor.execute('''
                        INSERT INTO shopping_list(refrigerator_id, product_name, amount) VALUES (?,?,?)
                    ''', (refrigerator_id, product['product_name'], product['amount']))

        conn.commit()
        conn.close()




    def generate_shopping_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT product_name,amount-COALESCE(product_quantity,0) AS amount
            FROM refrigerator_track 
            LEFT OUTER JOIN refrigerator_content ON refrigerator_track.barcode=refrigerator_content.barcode
            NATURAL INNER JOIN product
            WHERE refrigerator_track.refrigerator_id=? AND (product_quantity IS null OR amount>product_quantity)
        """, (refrigerator_id,))

        result = cursor.fetchall()
        conn.close()
        products_json = [{'product_name': row[0],'amount': row[1]} for row in result]
        return products_json


    def get_parameter_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT product_name,barcode,amount
        FROM refrigerator_track
        NATURAL INNER JOIN product
        WHERE refrigerator_id = ?  
        """, (refrigerator_id,))
        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0], 'barcode': row[1],'amount': row[2]} for row in result]
        return products_json


    def get_shopping_list(self, refrigerator_id):
        conn = sqlite3.connect(self.path)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT product_name,amount
        FROM shopping_list
        WHERE refrigerator_id = ?
        """, (refrigerator_id,))
        result = cursor.fetchall()
        conn.close()

        # Format the result as a JSON array of objects
        products_json = [{'product_name': row[0],'amount': row[1]} for row in result]
        return products_json







