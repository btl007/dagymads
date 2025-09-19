# generate_schedule_json.py
from datetime import datetime, timedelta
import json

def generate_default_slots_json():
    default_slots = []
    # IMPORTANT: Set this to today's date for accurate 31-day generation
    # For example, if today is Sept 16, 2025:
    today = datetime(2025, 9, 16) # <--- USER SHOULD CHANGE THIS TO CURRENT DATE

    for i in range(31): # Today + 30 days
        date = today + timedelta(days=i)
        slots = {}
        for hour in range(6, 25): # 06:00 to 24:00
            time = f"{hour:02d}:00"
            slots[time] = True
        default_slots.append({"date": date.strftime("%Y-%m-%d"), "slots": slots})
    return default_slots

if __name__ == "__main__":
    json_output = generate_default_slots_json()
    print(json.dumps(json_output, indent=4))
