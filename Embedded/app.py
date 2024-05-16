from evdev import InputDevice, categorize, ecodes
import requests
import tkinter as tk
import threading
import os

SERVER_HOST = '192.168.0.106'
SERVER_PORT = 12345

URL = f'http://{SERVER_HOST}:{SERVER_PORT}/scan'


def on_add_click():
    label.config(text="current mode: Adding mode")


def on_removal_click():
    label.config(text="current mode: Removal mode")


def show_status_icon(icon):
    status_label.config(text=icon, fg="green" if icon == "\u2713" else "red", font=("Arial", 40))
    # Clear the status icon after 3 seconds
    root.after(3000, lambda: status_label.config(text="", fg="black"))


def send_to_server(barcode, mode):
    data = {'refrigerator_id': 1, 'barcode': barcode, 'mode': mode}
    print("sending to server: ", data)
    response = requests.post(URL, json=data)

    response_json = response.json()  # Get JSON response content
    if response.status_code == 200:
        show_status_icon("\u2713")
    else:
        show_status_icon("\u2717")


def handle_scan(barcode, label):
    barcode = barcode.lstrip('C')
    label_text = label.cget("text")
    print("Scanned barcode:", barcode)
    mode = ''
    if 'Add' in label_text:
        mode = "add"

    if "Rem" in label_text:
        mode = "remove"

    send_to_server(barcode, mode)


def listen_barcode_scanner():
    dev = InputDevice("/dev/input/by-id/usb-USBKey_Chip_USBKey_Module_202730041341-event-kbd")
    barcode = ''

    for event in dev.read_loop():
        if event.type == ecodes.EV_KEY:
            key_event = categorize(event)
            if key_event.keystate == key_event.key_down:
                if key_event.keycode == 'KEY_ENTER':
                    handle_scan(barcode, label)
                    barcode = ''
                else:
                    barcode += key_event.keycode[4]


# Create the main window
root = tk.Tk()
root.title("FoodWise")
root.attributes('-fullscreen', True)

button1 = tk.Button(root, text="Adding mode", command=on_add_click, width=20, height=5)
button1.pack(pady=40)

button2 = tk.Button(root, text="Removal mode", command=on_removal_click, width=20, height=5)
button2.pack(pady=20)

label = tk.Label(root, text="current mode: Adding mode");
label.pack(pady=20)

status_label = tk.Label(root, text="", fg="black", width=20, height=5)
status_label.pack(pady=10)

barcode_thread = threading.Thread(target=listen_barcode_scanner)
barcode_thread.daemon = True
barcode_thread.start()

# Run the main event loop
root.mainloop()
