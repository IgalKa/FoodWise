from evdev import InputDevice,categorize,ecodes
import requests
import tkinter as tk
import threading
import os


SERVER_HOST = '192.168.0.101'
SERVER_PORT = 12345

URL= f'http://{SERVER_HOST}:{SERVER_PORT}/scan' 

def on_add_click():
	label.config(text="current mode: Adding mode")

def on_removal_click():
	label.config(text="current mode: Removal mode")	
	

def send_to_server(barcode,mode):
	data={'barcode':barcode,'mode':mode}
	print("sending to server: ",data)
	requests.post(URL, json=data)
        
        
def handle_scan(barcode,label):
	barcode = barcode.lstrip('C')
	label_text = label.cget("text")
	print("Scanned barcode:", barcode)
	mode =''
	if 'Add' in label_text:
		mode = "add"
		
	if "Rem" in label_text:
		mode = "remove"
  
	send_to_server(barcode,mode)        

def listen_barcode_scanner():
	dev = InputDevice("/dev/input/event0")
	barcode = ''
	
	for event in dev.read_loop():
		if event.type == ecodes.EV_KEY:
			key_event= categorize(event)
			if key_event.keystate == key_event.key_down:
				if key_event.keycode == 'KEY_ENTER':
					handle_scan(barcode,label)
					barcode =''
				else:
					barcode+= key_event.keycode[4]
					

                

# Create the main window
root = tk.Tk()
root.title("FoodWise")
root.attributes('-fullscreen', True)


button1= tk.Button(root, text="Adding mode",command=on_add_click,width=20, height=5)
button1.pack(pady=20)

button2 = tk.Button(root, text="Removal mode", command=on_removal_click,width=20, height=5)
button2.pack(pady=20)

label= tk.Label(root,text= "current mode: Adding mode");
label.pack(pady=20)

              
barcode_thread = threading.Thread(target=listen_barcode_scanner)
barcode_thread.daemon = True
barcode_thread.start()

# Run the main event loop
root.mainloop()