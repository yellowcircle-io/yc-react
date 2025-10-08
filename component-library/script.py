# Let me read and analyze the Rho HTML files to understand the complete structure
with open('RHO-HUBSPOT-CompleteOutout.html', 'r') as f:
    complete_output = f.read()

with open('RHO-HUBSPOT-EmailBody.html', 'r') as f:
    email_body = f.read()

with open('RHO-HUBSPOT-DesignManager-Template.html', 'r') as f:
    template = f.read()

print("=== COMPLETE OUTPUT STRUCTURE ===")
print(complete_output[:2000])
print("\n" + "="*50 + "\n")

print("=== EMAIL BODY STRUCTURE ===")  
print(email_body[:2000])
print("\n" + "="*50 + "\n")

print("=== TEMPLATE STRUCTURE ===")
print(template[:1000])