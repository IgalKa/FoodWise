from evdev import InputDevice, categorize, ecodes
import requests
import tkinter as tk
from tkinter import font
import threading
import queue
import time


class App:
    def __init__(self):
        self.url = f'https://foodwise-5jxeyknkuq-uc.a.run.app/'
        self.mode = "add"
        self.queue = queue.Queue()

        self.root = tk.Tk()
        self.root.title("FoodWise")
        self.root.attributes('-fullscreen', True)
        self.root.configure(bg="#c5a3e9")
        self.root.config(cursor="none")

        custom_font = font.Font(family="Helvetica", size=12, weight="bold")

        self.button = tk.Button(self.root,
                                text="link new user",
                                command=self.on_link_click,
                                width=20,
                                height=5,
                                background='#8a2be2',
                                foreground='white',
                                font=custom_font)
        self.button.pack()

        self.button1 = tk.Button(self.root,
                                 text="Adding mode",
                                 command=self.on_add_click,
                                 width=20,
                                 height=5,
                                 background='#8a2be2',
                                 foreground='white',
                                 font=custom_font)

        self.button1.pack(pady=10)

        self.button2 = tk.Button(self.root,
                                 text="Removal mode",
                                 command=self.on_removal_click,
                                 width=20,
                                 height=5,
                                 background='#8a2be2',
                                 foreground='white',
                                 font=custom_font)

        self.button2.pack(pady=10)

        self.label = tk.Label(self.root,
                              text="current mode: Adding mode",
                              background="#c5a3e9",
                              foreground='white',
                              font=custom_font)

        self.label.pack(pady=10)

        self.status_label = tk.Label(self.root,
                                     text="",
                                     fg="black",
                                     width=20,
                                     height=5,
                                     background="#c5a3e9")

        self.status_label.pack(pady=10)

        time.sleep(10)
        self.root.after(100, self.process_queue)
        self.barcode_thread = threading.Thread(target=self.listen_barcode_scanner)
        self.barcode_thread.daemon = True
        self.barcode_thread.start()

    def run(self):
        self.root.mainloop()

    def process_queue(self):
        while not self.queue.empty():
            try:
                data = self.queue.get_nowait()
                self.send_to_server(data)
                self.queue.task_done()
            except queue.Empty:
                break
        self.root.after(100, self.process_queue)

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

        if self.mode == "add" or self.mode == "remove":
            response = requests.post(self.url + "scan", json=data)
        if self.mode == "link":
            response = requests.post(self.url + "link", json=data)

        response_json = response.json()  # Get JSON response content
        if response.status_code == 200:
            self.show_status_icon("\u2713")
        else:
            self.show_status_icon("\u2717")

    def show_status_icon(self, icon):
        self.status_label.config(text=icon, fg="green" if icon == "\u2713" else "red", font=("Arial", 40))
        # Clear the status icon after 3 seconds
        self.root.after(3000, lambda: self.status_label.config(text="", fg="black"))

    def handle_scan(self, barcode, refrigerator_id):
        print("Scanned data:", barcode)

        if self.mode == "remove" or self.mode == "add":
            data = {'refrigerator_id': refrigerator_id, 'barcode': barcode, 'mode': self.mode}
        else:
            data = {'refrigerator_id': refrigerator_id, 'user_id': barcode}

        self.queue.put(data)

    def listen_barcode_scanner(self):
        refrigerator_id = self.find_refrigerator_id()
        print(f"got the id: {refrigerator_id}")
        dev = InputDevice("/dev/input/by-id/usb-USBKey_Chip_USBKey_Module_202730041341-event-kbd")
        data = ''

        for event in dev.read_loop():
            if event.type == ecodes.EV_KEY:
                key_event = categorize(event)
                if key_event.keystate == key_event.key_down:
                    if key_event.keycode == 'KEY_ENTER':
                        data = data.lstrip('C')
                        self.handle_scan(data, refrigerator_id)
                        data = ''
                    else:
                        data += key_event.keycode[4]

    def find_refrigerator_id(self):
        try:
            with open("/home/codeCrafters/Desktop/id", 'r') as file:
                return file.read()
        except FileNotFoundError:
            response = requests.get(self.url + "request_refrigerator_id")
            refrigerator_id = response.json()
            with open("/home/codeCrafters/Desktop/id", 'w') as file:
                file.write(str(refrigerator_id))
            return refrigerator_id


app = App()
app.run()
