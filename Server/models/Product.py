import base64
import os


class Product:
    def __init__(self, name, image, quantity, added_date, alert_date):
        self.name = name
        self.image_path = image
        self.quantity = quantity
        self.added_date = added_date
        self.alert_date = alert_date

    def __json__(self):
        base64_image = None
        if self.image_path:
            if os.path.exists(self.image_path):
                # Open the image file
                with open(self.image_path, "rb") as image_file:
                    # Read the image file as binary data
                    image_data = image_file.read()

                # Encode the binary image data as a Base64 string
                base64_image = base64.b64encode(image_data).decode("utf-8")

        return {
            'product_name': self.name,
            'product_image': base64_image,
            'product_quantity': self.quantity,
            'product_added_date': self.added_date,
            'product_alert_date': self.alert_date
        }
