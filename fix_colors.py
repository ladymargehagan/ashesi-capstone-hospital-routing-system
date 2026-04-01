import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements mapping
    replacements = {
        'bg-blue-600': 'bg-primary',
        'bg-blue-700': 'bg-secondary',
        'text-blue-600': 'text-primary',
        'text-blue-700': 'text-secondary',
        'border-blue-600': 'border-primary',
        'border-blue-200': 'border-primary/20',
        'border-blue-100': 'border-primary/10',
        'from-blue-600': 'from-primary',
        'from-blue-700': 'from-secondary',
        'from-blue-500': 'from-primary/80',
        'via-blue-700': 'via-primary',
        'to-cyan-600': 'to-secondary',
        'to-cyan-500': 'to-secondary/80',
        'to-cyan-400': 'to-secondary/60',
        'shadow-blue-200': 'shadow-primary/20',
        'shadow-blue-300': 'shadow-primary/30',
        'shadow-blue-900': 'shadow-primary/50',
        'shadow-cyan-500': 'shadow-secondary/50',
        'bg-blue-50': 'bg-[#C4D8E5]/30',
        'bg-blue-100': 'bg-primary/10',
        'text-blue-500': 'text-primary/80',
        'text-cyan-500': 'text-secondary',
        'hover:text-blue-600': 'hover:text-primary',
        'hover:bg-blue-50': 'hover:bg-[#C4D8E5]/50',
        'hover:bg-blue-700': 'hover:bg-secondary',
        'ring-blue-500': 'ring-primary',
        'ring-blue-600': 'ring-primary',
        'focus:ring-blue-500': 'focus:ring-primary',
        'focus:border-blue-500': 'focus:border-primary',
        'from-indigo-600': 'from-primary',
        'to-purple-600': 'to-secondary'
    }

    original_content = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    # Regex for custom bg colours
    content = re.sub(r'bg-cyan-\d+', 'bg-secondary', content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))
