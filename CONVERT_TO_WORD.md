# Instructions: Converting Markdown to Word Document

## Quick Method (No Software Needed):

### Option 1: Copy & Paste into Word
1. Open `SUBMISSION_REPORT.md` in any text editor
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Open Microsoft Word
4. Paste (Ctrl+V)
5. Word will automatically format the markdown
6. Save as: `DevOps_Project_Submission.docx`

### Option 2: Online Converter (Recommended)
1. Go to: https://www.markdowntoword.com/
2. Open `SUBMISSION_REPORT.md` in notepad
3. Copy all content
4. Paste into the online converter
5. Click "Convert"
6. Download the generated Word file

### Option 3: Using Pandoc Command Line
After restarting PowerShell (to reload PATH):
```powershell
cd d:\DevOps\crud-nodejs-express-mysql
pandoc SUBMISSION_REPORT.md -o DevOps_Project_Submission.docx --toc --toc-depth=2 --reference-doc=custom-reference.docx
```

## Files to Submit:
1. DevOps_Project_Submission.docx (main report)
2. All YAML files (deployment.yaml, mysql.yaml, hpa.yaml)
3. Jenkinsfile
4. Source code (index.js, views/, public/)

## Your submission report is located at:
d:\DevOps\crud-nodejs-express-mysql\SUBMISSION_REPORT.md

Total pages: ~15-20 pages when converted to Word
