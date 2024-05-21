from evdev import InputDevice,categorize,ecodes
import requests
import tkinter as tk
import threading



SERVER_HOST = '192.168.0.102'
SERVER_PORT = 12345

mode="add"

URL= f'http://{SERVER_HOST}:{SERVER_PORT}/' 

def on_add_click():
	global mode
	mode="add"
	label.config(text="current mode: Adding mode")

def on_removal_click():
	global mode
	mode="remove"
	label.config(text="current mode: Removal mode")	
	
def on_link_click():
	global mode
	mode="link"
	label.config(text="current mode: Linking mode")	
	
def show_status_icon(icon):
    status_label.config(text=icon, fg="green" if icon == "\u2713" else "red", font=("Arial", 40))
    # Clear the status icon after 3 seconds
    root.after(3000, lambda: status_label.config(text="", fg="black"))
	

def send_to_server(data):
	print("sending to server: ",data)
	global mode
	if mode == "add" or mode =="remove":
		response=requests.post(URL+"scan", json=data)
	if mode =="link":
		response=requests.post(URL+"link", json=data)
	
	response_json = response.json()  # Get JSON response content
	if response.status_code == 200:
		show_status_icon("\u2713")
	else:
		show_status_icon("\u2717")
            		 		 
      
        
def handle_scan(barcode,refrigerator_id):
	print("Scanned data:", barcode)
	global mode
	
	if mode == "remove" or mode == "add":
		data={'refrigerator_id':refrigerator_id,'barcode':barcode,'mode':mode} 
	else:
		data={'refrigerator_id':refrigerator_id,'user_id':barcode}
		
	send_to_server(data) 

def find_refrigerator_id():
	try:
		with open("id", 'r') as file:
			return file.read()
	except FileNotFoundError:
		response=requests.get(URL+"request_refrigerator_id")
		refrigerator_id=response.json()
		with open("id", 'w') as file:
			file.write(str(refrigerator_id))
		return refrigerator_id	    

def listen_barcode_scanner():
	refrigerator_id=find_refrigerator_id()
	print(f"got the id: {refrigerator_id}")
	dev = InputDevice("/dev/input/by-id/usb-USBKey_Chip_USBKey_Module_202730041341-event-kbd")
	data=''

	for event in dev.read_loop():	
		if event.type == ecodes.EV_KEY:
			key_event= categorize(event)
			if key_event.keystate == key_event.key_down:
				if key_event.keycode == 'KEY_ENTER':
					data = data.lstrip('C')
					handle_scan(data,refrigerator_id)
					data =''
				else:           
					data+= key_event.keycode[4]

					     
	
# Create the main window
root = tk.Tk()
root.title("FoodWise")
root.attributes('-fullscreen', True)

button = tk.Button(root, text="Linking mode", command=on_link_click, width=20, height=5)
button.pack()

button1 = tk.Button(root, text="Adding mode", command=on_add_click, width=20, height=5)
button1.pack(pady=10)

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
						            
