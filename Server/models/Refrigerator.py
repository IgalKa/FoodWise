class Refrigerator:
    def __init__(self, refrigerator_id):
        self.refrigerator_id = refrigerator_id
        self.products = []

    def add_item(self, product):
        self.products.append(product)

    def remove_item(self, barcode):
        for product in self.products:
            if product.barcode == barcode:
                if product.quantity ==1:
                    self.products.remove(product)
                else:
                    product.quantity=product.quantity-1
                return
