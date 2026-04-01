import os
from dotenv import load_dotenv
load_dotenv()
from services.email_service import send_email

res = send_email("margehagan@gmail.com", "Testing HRS", "<p>Test</p>")
print("Result:", res)
