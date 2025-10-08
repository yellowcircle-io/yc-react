# Continue reading the complete email structure
print("=== ANALYZING EMAIL COMPONENTS ===\n")

# Look for specific sections in the complete output
sections = []
lines = complete_output.split('\n')

current_section = ""
for line in lines:
    if 'SECTION' in line and '=====' in line:
        if current_section:
            sections.append(current_section)
        current_section = line.strip()
    elif current_section:
        current_section += '\n' + line

if current_section:
    sections.append(current_section)

for i, section in enumerate(sections[:6]):  # Show first 6 sections
    print(f"--- SECTION {i+1} ---")
    print(section[:800])
    print("\n" + "="*50 + "\n")