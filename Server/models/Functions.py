from datetime import datetime


class Functions:
    @staticmethod
    def is_future_date(alert_date_str):
        # Convert the string to a datetime object
        alert_date = datetime.strptime(alert_date_str, '%Y-%m-%d')
        now = datetime.now()
        # Check if the alert_date is in the future
        return alert_date > now


