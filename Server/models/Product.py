import base64
import os


class Product:
    def __init__(self, name, image, quantity, addedTime):
        self.name = name
        self.image_path = image
        self.quantity = quantity
        self.addedTime = addedTime

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
            'product_addedTime': self.addedTime
        }
