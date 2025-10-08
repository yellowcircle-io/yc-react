# Let me parse the email structure more systematically
import re

# Find all the section comments in the email body
email_sections = re.findall(r'<!-- =+\s*(.*?)\s*=+ -->(.*?)(?=<!-- =+|$)', email_body, re.DOTALL)

print("=== RHO EMAIL TEMPLATE SECTIONS ===\n")

for i, (section_name, content) in enumerate(email_sections):
    print(f"SECTION {i+1}: {section_name}")
    print("="*50)
    # Show first 500 chars of content to understand structure
    clean_content = content.strip()[:800]
    print(clean_content)
    print("\n" + "="*70 + "\n")

# Also extract key elements like buttons, colors, typography
print("\n=== BUTTON STYLES ===")
button_matches = re.findall(r'<a[^>]*style="[^"]*background[^"]*"[^>]*>(.*?)</a>', complete_output, re.DOTALL)
for button in button_matches[:3]:
    print(button.strip())
    
print("\n=== COLOR PALETTE ===")
color_matches = re.findall(r'color:\s*(#[0-9a-fA-F]{3,6})', complete_output)
colors = list(set(color_matches))
print("Colors found:", colors)