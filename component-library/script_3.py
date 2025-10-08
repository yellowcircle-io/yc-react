# Let me extract the complete CTA button styles and footer section
print("=== CTA BUTTON ANALYSIS ===\n")

# Find button elements with full styling
button_pattern = r'<a[^>]*style="[^"]*background[^"]*"[^>]*>.*?</a>'
cta_buttons = re.findall(button_pattern, complete_output, re.DOTALL)

for i, button in enumerate(cta_buttons):
    print(f"BUTTON {i+1}:")
    print(button.strip()[:400])
    print("\n" + "-"*40 + "\n")

print("\n=== FOOTER SECTION ===")
# Find the footer section
footer_match = re.search(r'<!-- =+.*?FOOTER.*?=+ -->(.*?)$', email_body, re.DOTALL)
if footer_match:
    print(footer_match.group(1).strip()[:1000])
else:
    # Look for footer content differently
    footer_content = re.search(r'(Rho Technologies.*?)$', complete_output, re.DOTALL)
    if footer_content:
        print(footer_content.group(1).strip()[:500])

print("\n=== TYPOGRAPHY PATTERNS ===")
font_patterns = re.findall(r'font-family:\s*([^;]+)', complete_output)
font_sizes = re.findall(r'font-size:\s*([^;]+)', complete_output)
print("Font families:", list(set(font_patterns))[:5])
print("Font sizes:", list(set(font_sizes))[:10])