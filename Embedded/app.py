from evdev import InputDevice, categorize, ecodes
import requests
import tkinter as tk
import threading


class App:
    def __init__(self):
        self.server_host = '192.168.0.102'
        self.server_port = 12345
        self.url = f'http://{self.server_host}:{self.server_port}/'
        self.mode = "add"

        self.root = tk.Tk()
        self.root.title("FoodWise")
        self.root.attributes('-fullscreen', True)

        background_image = tk.PhotoImage("background.jpg")
        background_label = tk.Label(self.root, image=background_image)
        background_label.place(x=0, y=0, relwidth=1, relheight=1)

        self.button = tk.Button(self.root, text="Linking mode", command=self.on_link_click, width=20, height=5)
        self.button.pack()

        self.button1 = tk.Button(self.root, text="Adding mode", command=self.on_add_click, width=20, height=5)
        self.button1.pack(pady=10)

        self.button2 = tk.Button(self.root, text="Removal mode", command=self.on_removal_click, width=20, height=5)
        self.button2.pack(pady=20)

        self.label = tk.Label(self.root, text="current mode: Adding mode");
        self.label.pack(pady=20)

        self.status_label = tk.Label(self.root, text="", fg="black", width=20, height=5)
        self.status_label.pack(pady=10)

        self.barcode_thread = threading.Thread(target=self.listen_barcode_scanner)
        self.barcode_thread.daemon = True
        self.barcode_thread.start()

    def run(self):
        self.root.mainloop()

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
        global mode

        if mode == "remove" or mode == "add":
            data = {'refrigerator_id': refrigerator_id, 'barcode': barcode, 'mode': mode}
        else:
            data = {'refrigerator_id': refrigerator_id, 'user_id': barcode}

        self.send_to_server(data)

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
            with open("id", 'r') as file:
                return file.read()
        except FileNotFoundError:
            response = requests.get(self.url + "request_refrigerator_id")
            refrigerator_id = response.json()
            with open("id", 'w') as file:
                file.write(str(refrigerator_id))
            return refrigerator_id


app = App()
app.run()
