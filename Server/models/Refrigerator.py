class Refrigerator:
    def __init__(self, refrigerator_id):
        self.refrigerator_id = refrigerator_id
        self.products = []

    def add_product(self, product):
        self.products.append(product)

    def __json__(self):
        return {
                'refrigerator_id': self.refrigerator_id,
                'products': [product.__json__() for product in self.products]
        }


