# models/__init__.py

# Import classes from individual modules
from .Refrigerator import Refrigerator
from .Product import Product
from .User import User
from .Functions import Functions

# Specify modules to be imported when using `from models import *`
__all__ = ['Refrigerator', 'Product', 'User', 'Functions']