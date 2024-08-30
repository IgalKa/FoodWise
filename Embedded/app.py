from evdev import InputDevice, categorize, ecodes
import requests
from requests.exceptions import HTTPError, RequestException
import tkinter as tk
from tkinter import font
import threading
import queue
import time


class App:
    def __init__(self):
        self.url = f'https://foodwise-5jxeyknkuq-uc.a.run.app/'
        #self.url = f'http://10.0.0.8:12345/'
        self.mode = "add"
        self.queue = queue.Queue()
        self.barcode_thread = None
        self.refrigerator_id = None

        self.root = tk.Tk()
        self.root.title("FoodWise")
        self.root.attributes('-fullscreen', True)
        self.root.configure(bg="#c5a3e9")
        self.root.config(cursor="none")

        custom_font = font.Font(family="Helvetica", size=12, weight="bold")

        self.link_button = tk.Button(self.root,
                                     text="link new user",
                                     command=self.on_link_click,
                                     width=20,
                                     height=5,
                                     background='#8a2be2',
                                     foreground='white',
                                     font=custom_font)

        self.add_button = tk.Button(self.root,
                                    text="Adding mode",
                                    command=self.on_add_click,
                                    width=20,
                                    height=5,
                                    background='#8a2be2',
                                    foreground='white',
                                    font=custom_font)

        self.remove_button = tk.Button(self.root,
                                       text="Removal mode",
                                       command=self.on_removal_click,
                                       width=20,
                                       height=5,
                                       background='#8a2be2',
                                       foreground='white',
                                       font=custom_font)

        self.label = tk.Label(self.root,
                              text="Device is starting up...",
                              background="#c5a3e9",
                              foreground='white',
                              font=custom_font)

        self.label.pack(pady=150)

        self.status_label = tk.Label(self.root,
                                     text="",
                                     fg="black",
                                     width=20,
                                     height=5,
                                     background="#c5a3e9")

        self.root.after(10000, self.set_app)

    def run(self):
        print("stating the main loop")
        self.root.mainloop()

    def set_app(self):
        self.refrigerator_id = self.find_refrigerator_id()
        print(f"got the id: {self.refrigerator_id}")
        self.start_barcode_scanner()
        self.process_queue()
        self.set_ui()

    def set_ui(self):
        print("setting the ui")
        self.label.pack_forget()

        self.link_button.pack()
        self.add_button.pack(pady=10)
        self.remove_button.pack(pady=10)

        self.label.pack(pady=10)
        self.label.config(text="current mode: Adding mode")

        self.status_label.pack(pady=10)

    def start_barcode_scanner(self):
        self.barcode_thread = threading.Thread(target=self.listen_barcode_scanner)
        self.barcode_thread.daemon = True
        self.barcode_thread.start()

    def process_queue(self):
        send = True
        while not self.queue.empty():
            try:
                data = self.queue.get_nowait()
                send = self.send_to_server(data)
                if not send:
                    break
                self.queue.task_done()
            except queue.Empty:
                break
        if send:
            self.root.after(100, self.process_queue)
        else:
            self.root.after(10000, self.process_queue)

    def on_add_click(self):
        self.mode = "add"
        self.label.config(text="current mode: Adding mode")

    def on_removal_click(self):
        self.mode = "remove"
        self.label.config(text="current mode: Removal mode")

    def on_link_click(self):
        self.mode = "link"
        self.label.config(text="current mode: Linking mode")

    def send_to_server(self, data):
        print("sending to server: ", data)
        try:
            response = {}
            if self.mode == "add" or self.mode == "remove":
                response = requests.post(self.url + "scan", json=data)
            elif self.mode == "link":
                response = requests.post(self.url + "link", json=data)

            response.raise_for_status()  # Will raise an HTTPError for bad responses (4xx and 5xx)

            response_json = response.json()  # Get JSON response content
            print("got response from the server: ", response_json)

            if response.status_code == 200:
                self.show_status_icon("\u2713")  # Checkmark for success
                return True

        except HTTPError as http_err:
            # Handle HTTP errors specifically and extract status code
            print(f"HTTP error occurred: {http_err}")
            if http_err.response is not None:
                status_code = http_err.response.status_code
                if status_code == 404:
                    self.show_status_icon("\u2717")  # Cross for not found
                    return True
                else:
                    self.queue.put(data)  # Put the data back into the queue for retry
                    return False

        except RequestException as req_err:
            # Handle other request exceptions
            print(f"Request exception occurred: {req_err}")
            self.queue.put(data)  # Put the data back into the queue for retry
            return False

    def show_status_icon(self, icon):
        self.status_label.config(text=icon, fg="green" if icon == "\u2713" else "red", font=("Arial", 40))
        # Clear the status icon after 3 seconds
        self.root.after(3000, lambda: self.status_label.config(text="", fg="black"))

    def handle_scan(self, barcode):
        print("Scanned data:", barcode)
        if self.mode == "remove" or self.mode == "add":
            data = {'refrigerator_id': self.refrigerator_id, 'barcode': barcode, 'mode': self.mode}
        else:
            data = {'refrigerator_id': self.refrigerator_id, 'user_id': barcode}

        self.queue.put(data)

    def listen_barcode_scanner(self):
        dev = InputDevice("/dev/input/by-id/usb-USBKey_Chip_USBKey_Module_202730041341-event-kbd")
        data = ''

        for event in dev.read_loop():
            if event.type == ecodes.EV_KEY:
                key_event = categorize(event)
                if key_event.keystate == key_event.key_down:
                    if key_event.keycode == 'KEY_ENTER':
                        data = data.lstrip('C')
                        self.handle_scan(data)
                        data = ''
                    else:
                        data += key_event.keycode[4]

    def find_refrigerator_id(self):
        # Attempt to read the ID from the file
        try:
            with open("/home/codeCrafters/Desktop/id", 'r') as file:
                print("id was found locally")
                return file.read()
        except FileNotFoundError:
            # File not found, need to request from the server
            print("id was not found locally, getting one from the server")
            while True:
                try:
                    print("sending a request to server for a new refrigerator ID")
                    response = requests.get(self.url + "request_refrigerator_id",
                                            timeout=10)  # Added a timeout for safety
                    response.raise_for_status()  # Raises an HTTPError if the status is 4xx or 5xx
                    refrigerator_id = response.json()
                    with open("/home/codeCrafters/Desktop/id", 'w') as file:
                        file.write(str(refrigerator_id))
                    return refrigerator_id
                # in case of a network problems
                except requests.exceptions.RequestException:
                    print(f"Failed to retrieve refrigerator ID")
                    # Wait before retrying
                    time.sleep(10)


app = App()
app.run()
