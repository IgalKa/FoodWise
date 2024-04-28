from datetime import datetime


class Product:
    def __init__(self, barcode, name, image, quantity=1):
        self.barcode = barcode
        self.name = name
        self.image = image
        self.quantity = quantity
        self.addedTime = datetime.now()

