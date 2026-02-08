===============================================================================
                               ZENWRITE v1.0
                  Modern Writing Web App - Documentation
===============================================================================

TABLE OF CONTENTS:
1. Overview
2. Features
3. Quick Start
4. File Structure
5. Customization Guide
6. Browser Support
7. Troubleshooting
8. License & Support
9. Changelog

===============================================================================
1. OVERVIEW
===============================================================================

ZenWrite is a lightweight, customizable writing web application built with 
pure vanilla JavaScript. No frameworks, no dependencies - just clean code 
and focused writing experience.

Perfect for:
   - Personal note-taking apps
   - In-browser text editors
   - Writing-focused web applications
   - Developer tools and utilities
   - Educational projects

Built With:
   - HTML5, CSS3, Vanilla JavaScript
   - LocalStorage for auto-save
   - Responsive design
   - Modular architecture

===============================================================================
2. FEATURES
===============================================================================

CORE FEATURES:
   • Multiple tab support
   • Real-time word/character count
   • Bookmarks & text highlighting
   • Search & replace functionality
   • Export to PDF/TXT/HTML formats
   • Dark/Light theme toggle
   • Custom paper colors

STYLING OPTIONS:
   • 6 paper colors (White, Natural, Sepia, Blue, Dark, Green)
   • 6 highlight colors
   • Custom font selection
   • Text and background color pickers

FILE MANAGEMENT:
   • Open .txt, .html, .md files
   • Save as .txt (Windows Notepad compatible)
   • Export to PDF with 3 methods
   • Auto-save to browser storage

PERFORMANCE:
   • Zero dependencies
   • Fast loading (< 2s)
   • Optimized for modern browsers
   • Mobile-responsive design

===============================================================================
3. QUICK START
===============================================================================

METHOD 1: Direct Use (Easiest)
--------------------------------
1. Extract the ZIP file
2. Open `index.html` in any modern browser
3. Start writing immediately!

METHOD 2: Integration into Your Project
----------------------------------------
1. Copy the entire folder to your project
2. Include these files in your HTML: <link rel="stylesheet" href="style.css"> <script src="script.js"></script>

METHOD 3: Custom Implementation
--------------------------------
1. Study the modular functions in script.js

2. Extract components you need

3. Integrate into your existing application

===============================================================================
4. FILE STRUCTURE
===============================================================================
zenwrite-project/
├── index.html # Main application file
├── style.css # All styles and themes
├── script.js # All JavaScript functionality
├── img/ # Images and icons
│ └── ico.png # Favicon
├── README.txt # This documentation file
└── license.txt # License information

DEPENDENCIES (CDN):
• jsPDF (PDF generation)
• html2canvas (screenshots)
• Font Awesome 6 (icons)

==============================================================================
5. CUSTOMIZATION GUIDE
==============================================================================
A. CHANGE COLOR THEME
	Edit in style.css:
	:root {
    		--primary-color: #3498db;    /* Change blue color */
    		--accent-color: #e74c3c;     /* Change accent color */
	}
B. ADD NEW PAPER COLOR
	1.Add CSS in style.css:
	.editor-area.paper-yourcolor {
    		background-color: YOUR_COLOR;
    		background-image: linear-gradient(...);
	}
	2. Add HTML in index.html:
	<div class="paper-color" data-color="yourcolor">
    		Your Color Name
	</div>
C. MODIFY TOOLBAR
	Edit the toolbar section in index.html:
	<div class="toolbar-group">
    		<!-- Add/remove buttons here -->
    		<button class="toolbar-btn" data-command="yourCommand">
        		<i class="fas fa-icon"></i>
    		</button>
	</div>
D. ADD NEW EXPORT FORMAT
	1.Add function in script.js:
	function exportToFormat() {
    		// Your export logic
	}
	2.Add button in HTML:
	<button onclick="exportToFormat()">Export</button>

============================================================================
6. BROWSER SUPPORT
============================================================================
FULLY SUPPORTED:
• Chrome 90+
• Firefox 88+
• Safari 14+
• Edge 90+

PARTIAL SUPPORT:
• IE 11 (limited functionality)
• Older mobile browsers

MOBILE SUPPORT:
• iOS Safari 12+
• Chrome Mobile 90+
• Responsive design included

============================================================================
7. TROUBLESHOOTING
============================================================================
PROBLEM 1: PDF Export not working

SOLUTION:
• Check internet connection (needs CDN)
• Try different PDF method (Simple/Styled/Custom)
• Update browser to latest version

----------------------------------------------------------------------------

PROBLEM 2: File save not working

SOLUTION:
• Ensure browser allows downloads
• Check browser storage permissions
• Try different browser

----------------------------------------------------------------------------

PROBLEM 3: Editor looks broken

SOLUTION:
• Clear browser cache (Ctrl+F5)
• Check console for errors (F12)
• Ensure all files are in same folder

----------------------------------------------------------------------------

PROBLEM 4: Mobile layout issues

SOLUTION:
• Use latest mobile browser
• Check viewport meta tag
• Test with different screen sizes

----------------------------------------------------------------------------

============================================================================
8. LICENSE SUPPORT
============================================================================
LICENSE: See license.txt for complete terms.

SUPPORT:

For support, questions, or custom development:
Email: zayn.fathur354@gmail.com
itch.io: https://zxns-starr.itch.io

COMMUNITY:

• GitHub: https://github.com/ZxnsStar

===========================================================================
9. CHANGELOG
===========================================================================
v1.0.0 - Initial Release

• Core editor functionality
• Multiple tab support
• PDF/TXT/HTML export
• Dark/Light themes
• Search & replace
• Bookmarks & highlights
• Statistics tracking
• Mobile responsive design

UPCOMING FEATURES:
• Cloud sync
• Collaboration tools
• Plugin system
• Mobile apps
• AI writing assistant

===============================================================================
CREDITS & ATTRIBUTIONS
===============================================================================

Developed by: Zxns starr
Icons: Font Awesome 6 (free tier)

SPECIAL THANKS:
Beta testers and early adopters
Open source community
All contributors and supporters
AI for debugging

===============================================================================
GETTING HELP
===============================================================================

For urgent issues:

Check Troubleshooting section above

Email with subject "ZenWrite Support"

===============================================================================
WRITE. ZEN.
===============================================================================

Thank you for choosing ZenWrite!
May your writing journey be focused and productive.

Happy Writing!

===============================================================================