// State Management
const state = {
    tabs: [
        {
            id: 1,
            title: 'Dokumen 1',
            content: '',
            bookmarks: [],
            modified: false,
            paperColor: 'white'
        }
    ],
    currentTab: 1,
    currentTheme: 'light',
    currentPaperColor: 'white',
    currentHighlightColor: 'yellow',
    searchResults: [],
    currentMatchIndex: -1,
    undoStacks: {},
    redoStacks: {},
    maxUndoSteps: 100,
    undoTimeout: null,
    lastSaveTime: 0,
    isSidebarCollapsed: false,
    isMobile: window.innerWidth <= 768,
    lastSearchTerm: '',
    replaceCaseSensitive: false
};
// DOM Elements
const elements = {
    editor: document.getElementById('editor'),
    editorArea: document.getElementById('editorArea'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarMobileToggle: document.getElementById('sidebarMobileToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    themeToggle: document.getElementById('themeToggle'),
    tabsContainer: document.getElementById('tabsContainer'),
    addTabBtn: document.getElementById('addTabBtn'),
    bookmarkList: document.getElementById('bookmarkList'),
    addBookmarkBtn: document.getElementById('addBookmarkBtn'),
    highlightBtn: document.getElementById('highlightBtn'),
    removeHighlightBtn: document.getElementById('removeHighlightBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),
    searchNav: document.getElementById('searchNav'),
    prevMatch: document.getElementById('prevMatch'),
    nextMatch: document.getElementById('nextMatch'),
    replaceBtn: document.getElementById('replaceBtn'),
    replaceModal: document.getElementById('replaceModal'),
    closeReplaceModal: document.getElementById('closeReplaceModal'),
    replaceFind: document.getElementById('replaceFind'),
    replaceWith: document.getElementById('replaceWith'),
    replaceAllBtn: document.getElementById('replaceAllBtn'),
    replaceOneBtn: document.getElementById('replaceOneBtn'),
    cancelReplaceBtn: document.getElementById('cancelReplaceBtn'),
    caseSensitive: document.getElementById('caseSensitive'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    newFileBtn: document.getElementById('newFileBtn'),
    openFileBtn: document.getElementById('openFileBtn'),
    saveFileBtn: document.getElementById('saveFileBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    fontSelect: document.getElementById('fontSelect'),
    fontSizeSelect: document.getElementById('fontSizeSelect'),
    textColor: document.getElementById('textColor'),
    backgroundColor: document.getElementById('backgroundColor'),
    printBtn: document.getElementById('printBtn'),
    wordCountBtn: document.getElementById('wordCountBtn'),
    fileInput: document.getElementById('fileInput'),
    imageInput: document.getElementById('imageInput'),
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    lineCount: document.getElementById('lineCount'),
    pageCount: document.getElementById('pageCount'),
    lineNumbers: document.getElementById('lineNumbers'),
    copyBtn: document.getElementById('copyBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    cutBtn: document.getElementById('cutBtn'),
    transparentBgBtn: document.getElementById('transparentBgBtn'),
    pasteArea: document.getElementById('pasteArea')
};
// Setup PDF Export
function setupPdfExport() {
    elements.exportPdfBtn.addEventListener('click', exportToPdf);
}

// Initialize
function init() {
    loadState();
    setupEventListeners();
    setupColorPickers();
    initUndoRedo();
    renderTabs();
    updateEditorContent();
    addSaveOptions();
    updateStats();
    initUndoRedoForTab(state.currentTab);
    updateUndoRedoButtons();
    // Simpan konten awal ke undo stack
    const currentTab = getCurrentTab();
    if (currentTab && (!currentTab.content || currentTab.content === '')) {
        // Simpan konten default ke tab
        currentTab.content = elements.editor.innerHTML;
        saveToUndoStack();
    }
    showNotification('Application is ready to use. Double-click color picker for reset!', 'success');
    setupPdfExport();
    updateLineNumbers();
    setupHighlightColors();
    setupCopyPaste();
    updateSidebarForMobile();
    // Setup interval untuk update stats
    setInterval(updateStats, 1000);
    // Focus editor
    setTimeout(() => {
        elements.editor.focus();
    }, 500);
    // Inisialisasi konten awal ke undo stack
    setTimeout(() => {
        saveToUndoStack();
    }, 500);
    setTimeout(() => {
        setupPaperColors();
    }, 100);
}

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('notepadState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(state, parsed);
    }

    // Apply theme
    document.body.className = `${state.currentTheme}-theme`;
    elements.themeToggle.innerHTML = state.currentTheme === 'light' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';

    // Apply paper color from current tab
    const currentTab = getCurrentTab();
    if (currentTab && currentTab.paperColor) {
        applyPaperColor(currentTab.paperColor);
    }
    
    // Update active paper color in sidebar
    updateActivePaperColor();
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('notepadState', JSON.stringify(state));
}

// Main PDF Export Function
async function exportToPdf() {
    try {
        showNotification('🔄 Membuat PDF...', 'info');
        
        const currentTab = getCurrentTab();
        const fileName = (currentTab.title || 'Untitled').replace(/\.[^/.]+$/, "") + '.pdf';
        
        // Pilih metode export
        const method = await showPdfOptions();
        
        switch(method) {
            case 'simple':
                await generateSimplePdf(fileName);
                break;
            case 'styled':
                await generateStyledPdf(fileName);
                break;
            case 'custom':
                await generateCustomPdf(fileName);
                break;
            default:
                return;
        }
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showNotification('❌ Gagal membuat PDF: ' + error.message, 'error');
    }
}

// Show PDF Options Modal
function showPdfOptions() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="modal show" id="pdfOptionsModal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>📄 Export ke PDF</h3>
                        <button class="modal-close" onclick="closePdfModal()">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div class="pdf-option" onclick="selectPdfOption('simple')">
                            <div class="pdf-icon">📝</div>
                            <div>
                                <strong>Simple Text</strong>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                    Hanya teks tanpa formatting
                                </p>
                            </div>
                        </div>
                        
                        <div class="pdf-option" onclick="selectPdfOption('styled')">
                            <div class="pdf-icon">🎨</div>
                            <div>
                                <strong>Styled Text</strong>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                    Dengan formatting dasar (bold, italic)
                                </p>
                            </div>
                        </div>
                        
                        <div class="pdf-option" onclick="selectPdfOption('custom')">
                            <div class="pdf-icon">🖼️</div>
                            <div>
                                <strong>Custom dengan Gambar</strong>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                    Screenshot editor dengan styling
                                </p>
                            </div>
                        </div>
                        
                        <button class="btn btn-secondary" onclick="closePdfModal()" 
                                style="width: 100%; margin-top: 20px;">
                            Batal
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                .pdf-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .pdf-option:hover {
                    border-color: #3498db;
                    background: #f8fafc;
                    transform: translateY(-2px);
                }
                .pdf-icon {
                    font-size: 24px;
                }
            </style>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Tambah event listeners
        window.closePdfModal = function() {
            document.getElementById('pdfOptionsModal').remove();
            resolve(null);
        };
        
        window.selectPdfOption = function(option) {
            document.getElementById('pdfOptionsModal').remove();
            resolve(option);
        };
    });
}

// ==================== PDF GENERATION METHODS ====================

// Method 1: Simple Text PDF
async function generateSimplePdf(fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Konfigurasi
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    
    // Get content
    const content = getPlainTextContent();
    const lines = doc.splitTextToSize(content, pageWidth - (margin * 2));
    
    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ZenWrite Document', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
    
    // Add content
    let y = margin + 30;
    doc.setFontSize(12);
    
    for (let i = 0; i < lines.length; i++) {
        // Check for page break
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        
        doc.text(lines[i], margin, y);
        y += lineHeight;
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
        `Page 1 of 1 • Generated by ZenWrite`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
    );
    
    // Save PDF
    doc.save(fileName);
    showNotification('✅ PDF berhasil dibuat!', 'success');
}

// Method 2: Styled Text PDF
async function generateStyledPdf(fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Get styled content
    const content = getStyledTextContent();
    
    // Create HTML element for html2canvas
    const tempDiv = document.createElement('div');
    tempDiv.id = 'pdf-export-content';
    tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: ${pageWidth - (margin * 2)}mm;
        padding: 20px;
        background: white;
        color: black;
        font-family: 'Arial', sans-serif;
        font-size: 12pt;
        line-height: 1.6;
    `;
    
    tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 5px;">Notepad Pro</h1>
            <p style="color: #7f8c8d; font-size: 14px;">
                Document: ${fileName.replace('.pdf', '')}
            </p>
            <p style="color: #95a5a6; font-size: 12px;">
                ${new Date().toLocaleString('id-ID')}
            </p>
            <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
        </div>
        <div id="pdf-content">
            ${content}
        </div>
        <div style="margin-top: 50px; text-align: center; color: #bdc3c7; font-size: 11px;">
            <hr style="border: none; border-top: 1px dashed #ecf0f1; margin: 20px 0;">
            Generated by Notepad Pro • ${new Date().getFullYear()}
        </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
        // Convert to canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        // Add to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        // Save PDF
        doc.save(fileName);
        showNotification('✅ PDF berhasil dibuat dengan styling!', 'success');
        
    } catch (error) {
        throw error;
    } finally {
        // Clean up
        document.body.removeChild(tempDiv);
    }
}

// Method 3: Custom PDF dengan Screenshot
async function generateCustomPdf(fileName) {
    const { jsPDF } = window.jspdf;
    
    showNotification('📸 Mengambil screenshot...', 'info');
    
    try {
        // Ambil screenshot dari editor area
        const editorArea = elements.editorArea;
        
        // Simpan state styling sementara
        const originalStyles = {
            border: editorArea.style.border,
            boxShadow: editorArea.style.boxShadow
        };
        
        // Tambah border untuk screenshot
        editorArea.style.border = '1px solid #ddd';
        editorArea.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        // Ambil screenshot
        const canvas = await html2canvas(editorArea, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Kembalikan style asli
        editorArea.style.border = originalStyles.border;
        editorArea.style.boxShadow = originalStyles.boxShadow;
        
        // Buat PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        
        // Calculate image dimensions
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Notepad Pro', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text(fileName.replace('.pdf', ''), pageWidth / 2, 22, { align: 'center' });
        doc.text(new Date().toLocaleString('id-ID'), pageWidth / 2, 28, { align: 'center' });
        
        // Add image
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', margin, 35, imgWidth, imgHeight);
        
        // Add footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i} of ${totalPages} • Notepad Pro`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }
        
        // Save PDF
        doc.save(fileName);
        showNotification('✅ PDF berhasil diexport!', 'success');
        
    } catch (error) {
        console.error('Screenshot error:', error);
        showNotification('❌ Gagal mengambil screenshot editor', 'error');
        // Fallback ke simple PDF
        await generateSimplePdf(fileName);
    }
}

// ==================== HELPER FUNCTIONS ====================

// Get plain text content
function getPlainTextContent() {
    const editor = elements.editor;
    
    // Gunakan innerText untuk preserve line breaks
    let text = editor.innerText || editor.textContent || '';
    
    // Clean and format
    text = text
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    
    // Add header
    const header = 
        `====================\n` +
        `Title: ${getCurrentTab().title || 'Untitled'}\n` +
        `====================\n\n`;
    
    return header + text;
}

// Get styled HTML content
function getStyledTextContent() {
    const editor = elements.editor;
    let html = editor.innerHTML;
    
    // Preserve basic formatting
    html = html
        .replace(/<b>/g, '<strong>')
        .replace(/<\/b>/g, '</strong>')
        .replace(/<i>/g, '<em>')
        .replace(/<\/i>/g, '</em>')
        .replace(/<u>/g, '<span style="text-decoration: underline;">')
        .replace(/<\/u>/g, '</span>');
    
    // Preserve highlights
    const highlightColors = {
        'highlight-yellow': '#FFF176',
        'highlight-green': '#81C784',
        'highlight-blue': '#64B5F6',
        'highlight-pink': '#F48FB1',
        'highlight-orange': '#FFB74D',
        'highlight-purple': '#BA68C8'
    };
    
    Object.entries(highlightColors).forEach(([className, color]) => {
        const regex = new RegExp(`class="${className}"`, 'g');
        html = html.replace(regex, `style="background-color: ${color}; padding: 2px;"`);
    });
    
    return html;
}

// Paper Color Functions - FIXED
function setupPaperColors() {
    document.querySelectorAll('.paper-color').forEach(color => {
        color.addEventListener('click', () => {
            const paperColor = color.dataset.color;
            
            // Update current tab's paper color
            const currentTab = getCurrentTab();
            if (currentTab) {
                currentTab.paperColor = paperColor;
            }
            
            // Apply paper color to editor
            applyPaperColor(paperColor);
            
            // Update active state in sidebar
            updateActivePaperColor();
            
            state.currentPaperColor = paperColor;
            saveState();
            showNotification(`Warna kertas diubah ke ${color.textContent.trim()}`);
        });
    });
}
function applyPaperColor(color) {
    // Remove all paper color classes
    const classesToRemove = [
        'paper-white', 'paper-natural', 'paper-sepia', 
        'paper-blue', 'paper-dark', 'paper-green'
    ];
    
    classesToRemove.forEach(cls => {
        elements.editorArea.classList.remove(cls);
    });
    
    // Add the selected color class
    elements.editorArea.classList.add(`paper-${color}`);
    
    // Update editor border color
    const accentColors = {
        'white': '#e74c3c',
        'natural': '#d84315',
        'sepia': '#bf360c',
        'blue': '#0277bd',
        'dark': '#90caf9',
        'green': '#2e7d32'
    };
    document.documentElement.style.setProperty('--accent-color', accentColors[color] || '#e74c3c');
    // Update current tab
    const currentTab = getCurrentTab();
    if (currentTab) {
        currentTab.paperColor = color;
    }
}
function updateActivePaperColor() {
    const currentTab = getCurrentTab();
    const currentColor = currentTab?.paperColor || 'white';
    
    document.querySelectorAll('.paper-color').forEach(color => {
        color.classList.toggle('active', color.dataset.color === currentColor);
    });
}
// Update sidebar for mobile/desktop
function updateSidebarForMobile() {
    const isMobile = window.innerWidth <= 768;
    state.isMobile = isMobile;
    
    if (isMobile) {
        // Mobile: sidebar always starts hidden
        elements.sidebar.classList.remove('collapsed');
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        elements.sidebarToggle.style.display = 'block';
        elements.sidebarToggle.innerHTML = '<i class="fas fa-times"></i>';
        elements.sidebarToggle.title = 'Tutup Sidebar';
    } else {
        // Desktop: show sidebar based on state
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        elements.sidebarToggle.style.display = 'block';
        
        if (state.isSidebarCollapsed) {
            elements.sidebar.classList.add('collapsed');
            elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            elements.sidebarToggle.title = 'Tampilkan Sidebar';
        } else {
            elements.sidebar.classList.remove('collapsed');
            elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
            elements.sidebarToggle.title = 'Sembunyikan Sidebar';
        }
    }
}
// Event Listeners
function setupEventListeners() {
    // Editor input dengan debounce untuk undo
    let typingTimer;
    elements.editor.addEventListener('input', function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            saveToUndoStack();
            updateStats();
        }, 1000); // Simpan setiap 1 detik setelah berhenti mengetik
    });
    
    // Simpan ke undo stack untuk aksi penting
    elements.editor.addEventListener('keydown', function(e) {
        // Simpan untuk tombol penting
        const importantKeys = ['Enter', 'Delete', 'Backspace', 'Tab'];
        if (importantKeys.includes(e.key)) {
            setTimeout(saveToUndoStack, 10);
        }
    });
    
    // Simpan saat melakukan formatting
    document.querySelectorAll('[data-command]').forEach(btn => {
        btn.addEventListener('click', function() {
            setTimeout(saveToUndoStack, 100);
        });
    });
    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
    // Selection change for better toolbar updates
    elements.editor.addEventListener('selectionchange', () => {
        setTimeout(updateToolbarState, 10);
    });
    // Remove Background Toggle
    elements.transparentBgBtn.addEventListener('click', removeBackgroundColor);
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', handleSidebarToggle);
    elements.sidebarMobileToggle.addEventListener('click', toggleSidebarMobile);
    elements.sidebarOverlay.addEventListener('click', hideSidebarMobile);
    // Tab management
    elements.addTabBtn.addEventListener('click', addNewTab);
    // Editor events
    elements.editor.addEventListener('input', handleEditorInput);
    elements.editor.addEventListener('keydown', handleEditorKeydown);
    elements.editor.addEventListener('mouseup', updateToolbarState);
    elements.editor.addEventListener('paste', handlePaste);
    elements.editor.addEventListener('copy', handleCopy);
    elements.editor.addEventListener('cut', handleCut);
    // Bookmark
    elements.addBookmarkBtn.addEventListener('click', addBookmark);
    // Highlight
    elements.highlightBtn.addEventListener('click', applyHighlight);
    elements.removeHighlightBtn.addEventListener('click', removeHighlight);
    // Search
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') performSearch();
    });
    elements.prevMatch.addEventListener('click', navigateToPrevMatch);
    elements.nextMatch.addEventListener('click', navigateToNextMatch);
    elements.replaceBtn.addEventListener('click', openReplaceModal);
    // Replace modal
    elements.closeReplaceModal.addEventListener('click', () => {
        elements.replaceModal.classList.remove('show');
    });
    elements.replaceAllBtn.addEventListener('click', replaceAll);
    elements.replaceOneBtn.addEventListener('click', replaceOne);
    elements.cancelReplaceBtn.addEventListener('click', () => {
        elements.replaceModal.classList.remove('show');
    });
    elements.caseSensitive.addEventListener('change', function() {
        state.replaceCaseSensitive = this.checked;
    });
    // File operations
    elements.newFileBtn.addEventListener('click', createNewFile);
    elements.openFileBtn.addEventListener('click', () => elements.fileInput.click());
    elements.saveFileBtn.addEventListener('click', saveToFile);
    elements.fileInput.addEventListener('change', openFile);
    elements.printBtn.addEventListener('click', printDocument);
    elements.wordCountBtn.addEventListener('click', showWordCountModal);
    // Formatting
    elements.fontSelect.addEventListener('change', applyFont);
    elements.fontSizeSelect.addEventListener('change', applyFontSize);
    elements.textColor.addEventListener('change', applyTextColor);
    elements.backgroundColor.addEventListener('change', applyBackgroundColor);
    // Toolbar buttons
    document.querySelectorAll('[data-command]').forEach(btn => {
        btn.addEventListener('click', e => {
            execCommand(e.target.closest('[data-command]').dataset.command);
        });
    });
    // Copy/Paste/Cut buttons
    elements.copyBtn.addEventListener('click', handleCopyButton);
    elements.pasteBtn.addEventListener('click', handlePasteButton);
    elements.cutBtn.addEventListener('click', handleCutButton);
    // Auto-save
    setInterval(() => {
        saveCurrentTabContent();
        saveState();
    }, 30000);
    // Window events
    window.addEventListener('beforeunload', e => {
        if (getCurrentTab().modified) {
            e.preventDefault();
            e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?';
        }
    });
    // Window resize
    window.addEventListener('resize', () => {
        updateSidebarForMobile();
    });
    // Window resize untuk mobile detection
    window.addEventListener('resize', handleWindowResize);
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (state.isMobile && 
            !elements.sidebar.contains(e.target) && 
            !elements.sidebarMobileToggle.contains(e.target) &&
            elements.sidebar.classList.contains('show')) {
            hideSidebarMobile();
        }
    });
}
// Window resize for mobile
function handleWindowResize() {
    const wasMobile = state.isMobile;
    state.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== state.isMobile) {
        updateSidebarForMobile();
    }
}
// Sidebar Functions
function handleSidebarToggle() {
    if (state.isMobile) {
        // Mobile: close sidebar
        hideSidebarMobile();
    } else {
        // Desktop: toggle collapsed state
        toggleSidebarDesktop();
    }
}
function toggleSidebarDesktop() {
    state.isSidebarCollapsed = !state.isSidebarCollapsed;
    
    if (state.isSidebarCollapsed) {
        elements.sidebar.classList.add('collapsed');
        elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
        elements.sidebarToggle.title = 'Tampilkan Sidebar';
        showNotification('Sidebar disembunyikan');
    } else {
        elements.sidebar.classList.remove('collapsed');
        elements.sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
        elements.sidebarToggle.title = 'Sembunyikan Sidebar';
        showNotification('Sidebar ditampilkan');
    }
    
    saveState();
}
function toggleSidebarMobile() {
    elements.sidebar.classList.add('show');
    elements.sidebarOverlay.classList.add('show');
    elements.sidebarToggle.innerHTML = '<i class="fas fa-times"></i>';
    elements.sidebarToggle.title = 'Tutup Sidebar';
}
function hideSidebarMobile() {
    elements.sidebar.classList.remove('show');
    elements.sidebarOverlay.classList.remove('show');
    elements.sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
    elements.sidebarToggle.title = 'Buka Sidebar';
}
// Theme Functions
function toggleTheme() {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `${state.currentTheme}-theme`;
    elements.themeToggle.innerHTML = state.currentTheme === 'light' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
    saveState();
    showNotification(`Mode ${state.currentTheme === 'light' ? 'terang' : 'gelap'} diaktifkan`);
}
// Tab Functions
function getCurrentTab() {
    return state.tabs.find(tab => tab.id === state.currentTab);
}
function renderTabs() {
    elements.tabsContainer.innerHTML = '';
    state.tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${tab.id === state.currentTab ? 'active' : ''} ${tab.modified ? 'modified' : ''}`;
        tabElement.innerHTML = `
            <div class="tab-content">
                <i class="fas fa-file-alt"></i>
                <span>${tab.title}</span>
                <span class="tab-close" data-tab-id="${tab.id}">&times;</span>
            </div>
        `;
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close') && !e.target.closest('.tab-close')) {
                switchTab(tab.id);
            }
        });
        const closeBtn = tabElement.querySelector('.tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        elements.tabsContainer.appendChild(tabElement);
    });
}
function addNewTab() {
    const newTabId = Date.now();
    state.tabs.push({
        id: newTabId,
        title: `Dokumen ${state.tabs.length + 1}`,
        content: '',
        bookmarks: [],
        modified: false,
        paperColor: 'white'
    });
    switchTab(newTabId);
}
function switchTab(tabId) {
    // Save current tab content before switching
    saveCurrentTabContent();
    
    // Switch tab
    state.currentTab = tabId;

    // Update konten editor
    updateEditorContent();
    
    // Update UI
    renderTabs();
    updateEditorContent();
    updateBookmarks();
    updateStats();
    updateLineNumbers();
    updateUndoRedoButtons();
    
    // Apply tab's paper color
    const currentTab = getCurrentTab();
    if (currentTab && currentTab.paperColor) {
        applyPaperColor(currentTab.paperColor);
        updateActivePaperColor();
    }
    
    // Update color pickers berdasarkan tema
    updateColorPickersForTheme();
    
    // Focus editor
    elements.editor.focus();
}

function updateColorPickersForTheme() {
    const defaultTextColor = state.currentTheme === 'dark' ? '#e4e6eb' : '#333333';
    const defaultBgColor = state.currentTheme === 'dark' ? '#0f3460' : '#ffffff';
    
    // Only update if not manually changed
    if (elements.textColor.value === '#000000' || 
        elements.textColor.value === '#ffffff00' ||
        elements.textColor.value === '') {
        elements.textColor.value = defaultTextColor;
    }
    
    if (elements.backgroundColor.value === '#ffffff' || 
        elements.backgroundColor.value === '') {
        elements.backgroundColor.value = defaultBgColor;
    }
}

function closeTab(tabId) {
    if (state.tabs.length <= 1) {
        showNotification('Tidak dapat menutup semua tab', 'warning');
        return;
    }
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab.modified) {
        if (!confirm('Dokumen memiliki perubahan yang belum disimpan. Yakin ingin menutup?')) {
            return;
        }
    }
    state.tabs = state.tabs.filter(t => t.id !== tabId);
    if (tabId === state.currentTab) {
        state.currentTab = state.tabs[0].id;
    }
    renderTabs();
    updateEditorContent();
    
    // Apply new tab's paper color
    const currentTab = getCurrentTab();
    if (currentTab && currentTab.paperColor) {
        applyPaperColor(currentTab.paperColor);
        updateActivePaperColor();
    }
}

// Editor Functions
function handleEditorInput() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    // Gunakan debounce yang lebih baik
    clearTimeout(state.undoTimeout);
    state.undoTimeout = setTimeout(() => {
        const newContent = elements.editor.innerHTML;
        
        // Hanya simpan jika konten berubah
        if (currentTab.content !== newContent) {
            currentTab.content = newContent;
            currentTab.modified = true;
            
            // Simpan ke undo stack
            saveToUndoStack();
            
            // Update UI
            updateStats();
            updateLineNumbers();
            renderTabs();
        }
    }, 500); // 500ms debounce
}

function handleEditorKeydown(e) {
    // Undo/Redo dengan Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }
    }
    
    // Save to undo stack untuk tombol penting
    const importantKeys = ['Enter', 'Delete', 'Backspace', 'Tab'];
    if (importantKeys.includes(e.key) || (e.key.length === 1 && !e.ctrlKey)) {
        // Gunakan timeout pendek untuk menangkap perubahan
        setTimeout(() => {
            saveToUndoStack();
        }, 10);
    }
}

function updateEditorContent() {
    const currentTab = getCurrentTab();
    elements.editor.innerHTML = currentTab.content || '';
}
function saveCurrentTabContent() {
    const currentTab = getCurrentTab();
    if (currentTab) {
        currentTab.content = elements.editor.innerHTML;
    }
}
// Undo/Redo System
function saveToUndoStack() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const currentContent = elements.editor.innerHTML;
    
    // Inisialisasi stack jika belum ada
    if (!state.undoStacks[tabId]) {
        state.undoStacks[tabId] = [];
        state.redoStacks[tabId] = [];
    }
    
    // Hindari menyimpan state yang sama berturut-turut
    if (state.undoStacks[tabId].length === 0 || 
        state.undoStacks[tabId][state.undoStacks[tabId].length - 1] !== currentContent) {
        
        // Simpan state saat ini
        state.undoStacks[tabId].push(currentContent);
        
        // Batasi stack size
        if (state.undoStacks[tabId].length > state.maxUndoSteps) {
            state.undoStacks[tabId].shift();
        }
        
        // Kosongkan redo stack saat ada perubahan baru
        state.redoStacks[tabId] = [];
        
        // Update tombol
        updateUndoRedoButtons();
    }
}
function undo() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const undoBtn = document.getElementById('undoBtn');

    
    // Periksa apakah bisa undo
    if (!state.undoStacks[tabId] || state.undoStacks[tabId].length < 2) {
        showNotification('Tidak ada aksi untuk di-undo', 'info');
        return;
    }

    // Animate
    if (undoBtn) {
        undoBtn.classList.add('undo-animation');
        setTimeout(() => undoBtn.classList.remove('undo-animation'), 500);
    }
    
    // Simpan konten saat ini ke redo stack
    const currentContent = elements.editor.innerHTML;
    if (!state.redoStacks[tabId]) state.redoStacks[tabId] = [];
    state.redoStacks[tabId].push(currentContent);
    
    // Ambil state sebelumnya dari undo stack
    state.undoStacks[tabId].pop(); // Hapus state saat ini
    const previousState = state.undoStacks[tabId].pop(); // Ambil state sebelumnya
    
    if (previousState !== undefined) {
        // Update konten
        elements.editor.innerHTML = previousState;
        currentTab.content = previousState;
        
        // Kembalikan state sebelumnya ke undo stack
        state.undoStacks[tabId].push(previousState);
        
        // Update UI
        updateStats();
        updateLineNumbers();
        updateUndoRedoButtons();
        
        // Fokus ke editor
        elements.editor.focus();
        
        showNotification('Undo berhasil', 'success');
    }
}
function redo() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const redoBtn = document.getElementById('redoBtn');
    
    // Periksa apakah bisa redo
    if (!state.redoStacks[tabId] || state.redoStacks[tabId].length === 0) {
        showNotification('Tidak ada aksi untuk di-redo', 'info');
        return;
    }

    // Animate
    if (redoBtn) {
        redoBtn.classList.add('redo-animation');
        setTimeout(() => redoBtn.classList.remove('redo-animation'), 500);
    }
    
    // Simpan konten saat ini ke undo stack
    const currentContent = elements.editor.innerHTML;
    state.undoStacks[tabId].push(currentContent);
    
    // Ambil state dari redo stack
    const nextState = state.redoStacks[tabId].pop();
    
    if (nextState !== undefined) {
        // Update konten
        elements.editor.innerHTML = nextState;
        currentTab.content = nextState;
        
        // Update UI
        updateStats();
        updateLineNumbers();
        updateUndoRedoButtons();
        
        // Fokus ke editor
        elements.editor.focus();
        
        showNotification('Redo berhasil', 'success');
    }
}
function updateUndoRedoButtons() {
    const currentTab = getCurrentTab();
    if (!currentTab) return;
    
    const tabId = currentTab.id;
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        const canUndo = state.undoStacks[tabId] && state.undoStacks[tabId].length > 1;
        undoBtn.disabled = !canUndo;
        undoBtn.style.opacity = canUndo ? '1' : '0.5';
        undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';
        undoBtn.title = canUndo ? 'Undo (Ctrl+Z)' : 'Tidak ada aksi untuk di-undo';
    }
    
    if (redoBtn) {
        const canRedo = state.redoStacks[tabId] && state.redoStacks[tabId].length > 0;
        redoBtn.disabled = !canRedo;
        redoBtn.style.opacity = canRedo ? '1' : '0.5';
        redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
        redoBtn.title = canRedo ? 'Redo (Ctrl+Y)' : 'Tidak ada aksi untuk di-redo';
    }
}
// Initialize undo/redo untuk tab
function initUndoRedoForTab(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    
    // Inisialisasi stacks jika belum ada
    if (!state.undoStacks[tabId]) {
        state.undoStacks[tabId] = [];
    }
    
    if (!state.redoStacks[tabId]) {
        state.redoStacks[tabId] = [];
    }
    
    // Kosongkan redo stack ketika beralih tab
    state.redoStacks[tabId] = [];
    
    // Simpan initial state jika ada konten
    if (tab && tab.content && state.undoStacks[tabId].length === 0) {
        state.undoStacks[tabId].push(tab.content);
    } else if (state.undoStacks[tabId].length === 0) {
        // Simpan state kosong jika tidak ada konten
        state.undoStacks[tabId].push('');
    }
    
    updateUndoRedoButtons();
}
// Inisialisasi undo/redo stacks untuk setiap tab
function initUndoRedo() {
    state.tabs.forEach(tab => {
        if (!state.undoStacks[tab.id]) {
            state.undoStacks[tab.id] = [];
        }
        if (!state.redoStacks[tab.id]) {
            state.redoStacks[tab.id] = [];
        }
        
        // Simpan state awal
        if (state.undoStacks[tab.id].length === 0 && tab.content) {
            state.undoStacks[tab.id].push(tab.content);
        }
    });
}
// Copy/Paste Functions
function setupCopyPaste() {
    // Event listener untuk paste
    elements.editor.addEventListener('paste', handlePaste);
    // Handle paste to remove formatting
    elements.editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, text);
    });
}
function handleCopy(e) {
    // Allow default copy behavior but also show notification
    setTimeout(() => {
        showNotification('Teks disalin ke clipboard');
    }, 100);
}
function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    showNotification('Teks ditempel (format dihapus)');
}
function handleCut(e) {
    // Allow default cut behavior but also show notification
    setTimeout(() => {
        showNotification('Teks dipotong');
    }, 100);
}
function handleCopyButton() {
    document.execCommand('copy');
    showNotification('Teks disalin');
}
function handlePasteButton() {
    // Focus editor first
    elements.editor.focus();
    
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText()
            .then(text => {
                document.execCommand('insertText', false, text);
                showNotification('Teks ditempel (format dihapus)');
            })
            .catch(err => {
                console.error('Clipboard error:', err);
                fallbackPaste();
            });
    } else {
        fallbackPaste();
    }
}
function fallbackPaste() {
    // Fallback method
    elements.pasteArea.focus();
    elements.pasteArea.value = '';
    
    setTimeout(() => {
        document.execCommand('paste');
        setTimeout(() => {
            const text = elements.pasteArea.value;
            if (text) {
                elements.editor.focus();
                document.execCommand('insertText', false, text);
                showNotification('Teks ditempel (format dihapus)');
            }
            elements.pasteArea.value = '';
        }, 100);
    }, 100);
}

function handleCutButton() {
    document.execCommand('cut');
    showNotification('Teks dipotong');
}
// Formatting Functions
function execCommand(command) {
    document.execCommand(command, false, null);
    elements.editor.focus();
    updateToolbarState();
}
function updateToolbarState() {
    // Update active state of formatting buttons
    document.querySelectorAll('[data-command]').forEach(btn => {
        const command = btn.dataset.command;
        btn.classList.toggle('active', document.queryCommandState(command));
    });
    // Update color pickers based on selection
    updateColorPickersFromSelection();
}
function updateColorPickersFromSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.isCollapsed) return;
    
    try {
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer;
        
        // Get text color
        const textColor = window.getComputedStyle(element).color;
        if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
            elements.textColor.value = rgbToHex(textColor);
        }
        
        // Get background color
        const bgColor = window.getComputedStyle(element).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            elements.backgroundColor.value = rgbToHex(bgColor);
        }
    } catch (error) {
        console.log('Error updating color pickers:', error);
    }
}
// Helper function to convert RGB to HEX
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function applyFont() {
    const font = elements.fontSelect.value;
    document.execCommand('fontName', false, font);
}
function applyFontSize() {
    const size = elements.fontSizeSelect.value;
    document.execCommand('fontSize', false, '7'); // HTML font size
    // Apply actual font size
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        span.appendChild(range.extractContents());
        range.insertNode(span);
        // Normalize the HTML to prevent nested spans
        elements.editor.normalize();
    }
}
function applyTextColor() {
    const color = elements.textColor.value;
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0 || selection.isCollapsed) {
        // No text selected, set default color for future text
        document.execCommand('foreColor', false, color);
        showNotification(`Warna teks default diatur ke ${color}`);
        return;
    }
    
    // Save to undo stack before making changes
    saveToUndoStack();
    
    // Apply color to selected text
    const range = selection.getRangeAt(0);
    
    // Check if we're inside an element with color
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
    }
    
    // If element already has color style, update it
    if (element.style && element.style.color) {
        element.style.color = color;
    } else {
        // Create new span with color
        const span = document.createElement('span');
        span.style.color = color;
        
        // Preserve other styles if any
        if (element.getAttribute('style')) {
            const existingStyles = element.getAttribute('style');
            if (!existingStyles.includes('color:')) {
                span.setAttribute('style', existingStyles + '; color: ' + color);
            }
        }
        
        // Extract and wrap content
        span.appendChild(range.extractContents());
        range.insertNode(span);
        
        // Select the new span
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
    }
    
    // Clean up empty spans
    cleanEditorContent();
    
    // Update tab content
    saveCurrentTabContent();
    
    elements.editor.focus();
    showNotification(`Warna teks diterapkan: ${color}`);
}
function applyBackgroundColor() {
    const color = elements.backgroundColor.value;
    // Apply background color
    document.execCommand('backColor', false, color);
    // Cek jika ingin transparan
    if (color === '#ffffff00' || color === 'transparent') {
        removeBackgroundColor();
        return;
    }
    // Fallback untuk browser yang tidak mendukung
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer.parentElement;

        // Hapus background color yang sudah ada
        removeBackgroundFromElement(selectedElement);

        // Tambahkan background color baru
        document.execCommand('backColor', false, color);
    }

    elements.editor.focus();
    showNotification(`Warna latar belakang diubah`);
}
// Enhanced clean function
function cleanEditorContent() {
    // Remove empty spans
    const emptySpans = elements.editor.querySelectorAll('span');
    emptySpans.forEach(span => {
        if (!span.hasAttribute('style') || span.getAttribute('style').trim() === '') {
            span.replaceWith(...span.childNodes);
        } else if (span.hasAttribute('style')) {
            const style = span.getAttribute('style');
            // Remove color:transparent or color:#00000000
            const newStyle = style
                .replace(/color:\s*transparent\s*;?/gi, '')
                .replace(/color:\s*#ffffff00\s*;?/gi, '')
                .replace(/color:\s*#00000000\s*;?/gi, '')
                .replace(/;+/g, ';')
                .trim();
            
            if (newStyle === '' || newStyle === ';') {
                span.removeAttribute('style');
                if (span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE) {
                    span.replaceWith(...span.childNodes);
                }
            } else {
                span.setAttribute('style', newStyle);
            }
        }
    });
    
    // Normalize the content
    elements.editor.normalize();
}

// Panggil fungsi ini secara periodic atau saat save
setInterval(() => {
    cleanEditorContent();
}, 60000); // Setiap 1 menit

function removeBackgroundColor() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer.parentElement;
        
        if (selectedElement) {
            // Hapus background color dari elemen
            removeBackgroundFromElement(selectedElement);
            
            // Juga hapus dari child elements
            const childrenWithBg = selectedElement.querySelectorAll('[style*="background"]');
            childrenWithBg.forEach(el => {
                el.style.backgroundColor = '';
            });
        }
    }
    
    elements.editor.focus();
    showNotification('Warna latar belakang dihapus (transparan)');
}

function removeBackgroundFromElement(element) {
    if (element.style) {
        element.style.backgroundColor = '';
        element.style.background = '';
    }
    
    // Hapus juga dari inline style
    if (element.hasAttribute('style')) {
        const style = element.getAttribute('style');
        const newStyle = style
            .replace(/background-color:[^;]+;?/gi, '')
            .replace(/background:[^;]+;?/gi, '')
            .trim();
        
        if (newStyle) {
            element.setAttribute('style', newStyle);
        } else {
            element.removeAttribute('style');
        }
    }
}

// Enhanced Text Color Functions
function setupColorPickers() {
    // Setup text color picker with double-click reset
    setupTextColorPicker();
    
    // Setup background color picker
    setupBackgroundColorPicker();
}

function setupTextColorPicker() {
    const textColorPicker = elements.textColor;
    let clickCount = 0;
    let clickTimer;
    
    // Single click - apply color
    textColorPicker.addEventListener('input', applyTextColor);
    textColorPicker.addEventListener('change', applyTextColor);
    
    // Double click - reset to default
    textColorPicker.addEventListener('click', function(e) {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(function() {
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            
            // Reset to default color based on theme
            const defaultColor = state.currentTheme === 'dark' ? '#e4e6eb' : '#333333';
            textColorPicker.value = defaultColor;
            resetTextColor();
        }
    });
    
    // Add transparent option for dark theme
    if (state.currentTheme === 'dark') {
        textColorPicker.setAttribute('list', 'text-color-presets');
        
        // Create datalist for color presets
        if (!document.getElementById('text-color-presets')) {
            const datalist = document.createElement('datalist');
            datalist.id = 'text-color-presets';
            
            const colors = [
                { value: '#e4e6eb', label: 'Default (Putih)' },
                { value: '#ffffff', label: 'Putih Murni' },
                { value: '#3498db', label: 'Biru' },
                { value: '#2ecc71', label: 'Hijau' },
                { value: '#e74c3c', label: 'Merah' },
                { value: '#f39c12', label: 'Kuning' },
                { value: '#9b59b6', label: 'Ungu' }
            ];
            
            colors.forEach(color => {
                const option = document.createElement('option');
                option.value = color.value;
                option.label = color.label;
                datalist.appendChild(option);
            });
            
            document.body.appendChild(datalist);
        }
    }
}

function resetTextColor() {
    const selection = window.getSelection();
    
    if (selection.rangeCount === 0 || selection.isCollapsed) {
        // Reset default color
        const defaultColor = state.currentTheme === 'dark' ? '#e4e6eb' : '#333333';
        document.execCommand('foreColor', false, defaultColor);
        showNotification('Warna teks direset ke default');
        return;
    }
    
    // Save to undo stack
    saveToUndoStack();
    
    // Remove color from selected text
    const range = selection.getRangeAt(0);
    const selectedText = range.extractContents();
    
    // Create text node without color
    const textNode = document.createTextNode(selectedText.textContent);
    range.insertNode(textNode);
    
    // Clean up
    cleanEditorContent();
    
    // Update tab content
    saveCurrentTabContent();
    
    elements.editor.focus();
    showNotification('Warna teks direset ke default');
}

function setupBackgroundColorPicker() {
    const bgColorPicker = elements.backgroundColor;
    
    // Single click - apply color
    bgColorPicker.addEventListener('input', applyBackgroundColor);
    bgColorPicker.addEventListener('change', applyBackgroundColor);
    
    // Double click - set transparent
    bgColorPicker.addEventListener('dblclick', function() {
        this.value = '#ffffff00';
        removeBackgroundColor();
        showNotification('Latar belakang diatur ke transparan');
    });
    
    // Add transparent pattern for visual feedback
    bgColorPicker.addEventListener('mouseenter', function() {
        if (this.value === '#ffffff00') {
            this.classList.add('transparent');
        }
    });
    
    bgColorPicker.addEventListener('mouseleave', function() {
        this.classList.remove('transparent');
    });
}

function setupTransparentOption() {
    // Buat custom color picker dengan opsi transparan
    const bgColorPicker = elements.backgroundColor;
    
    // Tambahkan event untuk reset ke transparan dengan klik ganda
    let clickCount = 0;
    let clickTimer;
    
    bgColorPicker.addEventListener('click', function(e) {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(function() {
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            
            // Set ke transparan
            bgColorPicker.value = '#ffffff00';
            applyBackgroundColor();
        }
    });
}

// Bookmark Functions
function addBookmark() {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
        showNotification('Pilih teks terlebih dahulu untuk bookmark', 'warning');
        return;
    }
    const currentTab = getCurrentTab();
    const bookmark = {
        id: Date.now(),
        text: selection.toString().trim().substring(0, 50),
        position: selection.anchorOffset,
        timestamp: new Date().toLocaleTimeString()
    };
    currentTab.bookmarks.push(bookmark);
    updateBookmarks();
    showNotification('Bookmark berhasil ditambahkan');
}
function updateBookmarks() {
    const currentTab = getCurrentTab();
    elements.bookmarkList.innerHTML = '';
    if (currentTab.bookmarks.length === 0) {
        elements.bookmarkList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark"></i>
                <p>Tidak ada bookmark</p>
            </div>
        `;
        return;
    }
    currentTab.bookmarks.forEach(bookmark => {
        const bookmarkElement = document.createElement('div');
        bookmarkElement.className = 'bookmark-item';
        bookmarkElement.innerHTML = `
            <div class="bookmark-text">${bookmark.text}</div>
            <div class="bookmark-actions">
                <button class="toolbar-btn" data-bookmark-id="${bookmark.id}" title="Navigasi">
                    <i class="fas fa-location-arrow"></i>
                </button>
                <button class="toolbar-btn" data-bookmark-id="${bookmark.id}" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        const navigateBtn = bookmarkElement.querySelector('[title="Navigasi"]');
        const deleteBtn = bookmarkElement.querySelector('[title="Hapus"]');
        navigateBtn.addEventListener('click', () => {
            // In real implementation, would navigate to position
            showNotification(`Navigasi ke: ${bookmark.text}`);
        });
        deleteBtn.addEventListener('click', () => {
            currentTab.bookmarks = currentTab.bookmarks.filter(b => b.id !== bookmark.id);
            updateBookmarks();
            showNotification('Bookmark dihapus');
        });
        elements.bookmarkList.appendChild(bookmarkElement);
    });
}
// Highlight Functions
function setupHighlightColors() {
    document.querySelectorAll('.highlight-color').forEach(color => {
        color.addEventListener('click', () => {
            document.querySelectorAll('.highlight-color').forEach(c => {
                c.classList.toggle('active', c === color);
            });
            state.currentHighlightColor = color.dataset.color;
        });
    });
}
function applyHighlight() {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
        showNotification('Pilih teks terlebih dahulu', 'warning');
        return;
    }
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `highlight-${state.currentHighlightColor}`;
    span.style.backgroundColor = getHighlightColor(state.currentHighlightColor);
    span.style.padding = '0 2px';
    span.style.borderRadius = '3px';
    
    span.appendChild(range.extractContents());
    range.insertNode(span);
    
    selection.removeAllRanges();
    showNotification(`Teks disorot dengan warna ${state.currentHighlightColor}`);
}
function removeHighlight() {
    const selection = window.getSelection();
    if (!selection.toString().trim()) {
        showNotification('Pilih teks yang disorot', 'warning');
        return;
    }
    const range = selection.getRangeAt(0);
    const selectedElement = range.commonAncestorContainer.parentElement;
    
    if (selectedElement.className.startsWith('highlight-')) {
        const text = selectedElement.textContent;
        selectedElement.parentNode.replaceChild(document.createTextNode(text), selectedElement);
        showNotification('Stabilo dihapus');
    } else {
        showNotification('Teks tidak memiliki stabilo', 'warning');
    }
}
function getHighlightColor(name) {
    const colors = {
        yellow: '#FFF176',
        green: '#81C784',
        blue: '#64B5F6',
        pink: '#F48FB1',
        orange: '#FFB74D',
        purple: '#BA68C8'
    };
    return colors[name] || colors.yellow;
}
// Search Functions
function performSearch() {
    const searchTerm = elements.searchInput.value.trim();
    if (!searchTerm) {
        showNotification('Masukkan kata kunci pencarian', 'warning');
        return;
    }
    state.lastSearchTerm = searchTerm;
    const content = elements.editor.textContent || elements.editor.innerText;
    const regex = new RegExp(searchTerm, 'gi');
    state.searchResults = [];
    
    let match;
    while ((match = regex.exec(content)) !== null) {
        state.searchResults.push({
            index: match.index,
            length: match[0].length
        });
    }
    if (state.searchResults.length === 0) {
        elements.searchResults.textContent = `Tidak ditemukan hasil untuk "${searchTerm}"`;
        elements.searchNav.style.display = 'none';
        removeSearchHighlights();
        return;
    }
    elements.searchResults.textContent = `Ditemukan ${state.searchResults.length} hasil untuk "${searchTerm}"`;
    elements.searchNav.style.display = 'flex';
    state.currentMatchIndex = -1;
    
    highlightSearchMatches(searchTerm);
    navigateToNextMatch();
}
function highlightSearchMatches(searchTerm) {
    removeSearchHighlights();
    if (!searchTerm) return;
    
    try {
        const content = elements.editor.innerHTML;
        // Escape karakter khusus untuk regex
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        const highlightedContent = content.replace(regex, (match) => {
            return `<mark class="search-match">${match}</mark>`;
        });
        
        elements.editor.innerHTML = highlightedContent;
    } catch (error) {
        console.error('Error highlighting search:', error);
    }
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function removeSearchHighlights() {
    const matches = elements.editor.querySelectorAll('.search-match');
    matches.forEach(match => {
        const parent = match.parentNode;
        parent.replaceChild(document.createTextNode(match.textContent), match);
    });
}
function navigateToPrevMatch() {
    if (state.searchResults.length === 0) return;
    
    state.currentMatchIndex = (state.currentMatchIndex - 1 + state.searchResults.length) % state.searchResults.length;
    navigateToMatch(state.currentMatchIndex);
}
function navigateToNextMatch() {
    if (state.searchResults.length === 0) return;
    
    state.currentMatchIndex = (state.currentMatchIndex + 1) % state.searchResults.length;
    navigateToMatch(state.currentMatchIndex);
}
function navigateToMatch(index) {
    if (index < 0 || index >= state.searchResults.length) return;
    
    const searchTerm = elements.searchInput.value.trim();
    const match = state.searchResults[index];
    
    // Create range and select the match
    const textNode = elements.editor.childNodes[0];
    if (!textNode) return;
    
    const range = document.createRange();
    
    // Find the actual position considering HTML tags
    let currentPos = 0;
    let found = false;
    
    function walkNodes(node) {
        if (found) return;
        
        if (node.nodeType === 3) { // Text node
            if (currentPos + node.textContent.length >= match.index) {
                const positionInNode = match.index - currentPos;
                range.setStart(node, positionInNode);
                range.setEnd(node, positionInNode + match.length);
                found = true;
            }
            currentPos += node.textContent.length;
        } else if (node.nodeType === 1) { // Element node
            for (const child of node.childNodes) {
                walkNodes(child);
                if (found) break;
            }
        }
    }
    
    walkNodes(elements.editor);
    
    if (found) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Scroll to match
        range.getBoundingClientRect();
        elements.editor.scrollTop = range.getBoundingClientRect().top - elements.editor.getBoundingClientRect().top + elements.editor.scrollTop - 100;
        
        elements.searchResults.textContent = `Hasil ${index + 1} dari ${state.searchResults.length}`;
    }
}
// Replace Functions
function openReplaceModal() {
    if (state.searchResults.length === 0 && state.lastSearchTerm) {
        elements.replaceFind.value = state.lastSearchTerm;
    }
    elements.replaceModal.classList.add('show');
}
function replaceAll() {
    const find = elements.replaceFind.value.trim();
    const replace = elements.replaceWith.value;
    
    if (!find) {
        showNotification('Masukkan teks yang akan diganti', 'warning');
        return;
    }
    const flags = state.replaceCaseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(find), flags);
    const content = elements.editor.innerHTML;
    const newContent = content.replace(regex, replace);
    
    elements.editor.innerHTML = newContent;
    
    // Update current tab content
    const currentTab = getCurrentTab();
    if (currentTab) {
        currentTab.content = newContent;
        currentTab.modified = true;
        renderTabs();
    }
    
    const count = (content.match(regex) || []).length;
    showNotification(`${count} kemunculan "${find}" diganti dengan "${replace}"`);
    elements.replaceModal.classList.remove('show');
}
function replaceOne() {
    const find = elements.replaceFind.value.trim();
    const replace = elements.replaceWith.value;
    
    if (!find) {
        showNotification('Masukkan teks yang akan diganti', 'warning');
        return;
    }
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        showNotification('Tidak ada teks yang dipilih', 'warning');
        return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Check if selected text matches the find text (case insensitive if not case sensitive)
    const matchText = state.replaceCaseSensitive ? selectedText : selectedText.toLowerCase();
    const findText = state.replaceCaseSensitive ? find : find.toLowerCase();
    
    if (matchText === findText) {
        // Replace the selected text
        range.deleteContents();
        range.insertNode(document.createTextNode(replace));
        
        // Update current tab content
        const currentTab = getCurrentTab();
        if (currentTab) {
            currentTab.content = elements.editor.innerHTML;
            currentTab.modified = true;
            renderTabs();
        }
        
        showNotification(`"${find}" diganti dengan "${replace}"`);
        
        // Clear selection
        selection.removeAllRanges();
    } else {
        showNotification('Teks yang dipilih tidak sesuai dengan yang akan diganti', 'warning');
    }
}
// File Operations
function createNewFile() {
    if (getCurrentTab().modified) {
        if (!confirm('Dokumen saat ini memiliki perubahan yang belum disimpan. Buat file baru?')) {
            return;
        }
    }
    
    addNewTab();
    showNotification('File baru dibuat');
}
function openFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        getCurrentTab().content = content.replace(/\n/g, '<br>');
        getCurrentTab().title = file.name;
        getCurrentTab().modified = false;
        updateEditorContent();
        renderTabs();
        updateStats();
        showNotification(`File "${file.name}" berhasil dibuka`);
    };
    
    reader.readAsText(file);
    elements.fileInput.value = '';
}
function updateStats() {
    const content = elements.editor.textContent || elements.editor.innerText;
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = content.length;
    const lines = content.split('\n').length;
    const pages = Math.ceil(words.length / 250) || 1; // ~250 kata per halaman
    
    // Update DOM elements
    if (elements.wordCount) elements.wordCount.textContent = words.length;
    if (elements.charCount) elements.charCount.textContent = chars;
    if (elements.lineCount) elements.lineCount.textContent = lines;
    if (elements.pageCount) elements.pageCount.textContent = pages;
}
function saveToFile() {
    const currentTab = getCurrentTab();
    
    // 1. Konversi HTML ke Plain Text dengan format terjaga
    const plainText = convertToWindowsNotepadFormat(elements.editor.innerHTML);
    
    // 2. Buat nama file
    let fileName = currentTab.title || 'Untitled';
    if (!fileName.toLowerCase().endsWith('.txt')) {
        fileName += '.txt';
    }

    // 3. Download file
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 4. Update status
    currentTab.modified = false;
    renderTabs();
    showNotification(`✅ File "${fileName}" tersimpan (bisa dibuka di Notepad Windows)`);
}

function convertToWindowsNotepadFormat(html) {
    // Step 1: Normalize HTML
    html = normalizeHTML(html);
    
    // Step 2: Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Step 3: Traverse dan konversi
    let lines = [];
    let currentLine = '';
    let isInBlockElement = false;
    let listDepth = 0;
    
    function processNode(node, options = {}) {
        const {
            isList = false,
            isListItem = false,
            listType = '',
            listIndex = 0,
            isPreformatted = false
        } = options;
        
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent
                .replace(/\u00A0/g, ' ')  // Replace &nbsp;
                .replace(/\s+/g, ' ')     // Normalize spaces
                .trim();
            
            if (text) {
                // Tambah prefix untuk list
                let prefix = '';
                if (isListItem) {
                    if (listType === 'ul') {
                        prefix = '• ';
                    } else if (listType === 'ol') {
                        prefix = (listIndex + 1) + '. ';
                    }
                    // Indent untuk nested lists
                    prefix = '  '.repeat(listDepth - 1) + prefix;
                }
                
                currentLine += prefix + text;
            }
            return listIndex;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const isBlock = isBlockElement(tagName);
            
            // Jika menemukan block element baru, selesaikan line saat ini
            if (isBlock && currentLine && !isListItem) {
                lines.push(currentLine);
                currentLine = '';
                isInBlockElement = true;
            }
            
            switch(tagName) {
                case 'br':
                    // Line break eksplisit
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    } else {
                        lines.push(''); // Baris kosong
                    }
                    break;
                    
                case 'p':
                case 'div':
                    // Process children
                    Array.from(node.childNodes).forEach((child, idx) => {
                        processNode(child, {
                            ...options,
                            isListItem: false
                        });
                        
                        // Setelah paragraf, tambah line break
                        if (idx === node.childNodes.length - 1) {
                            lines.push(currentLine);
                            currentLine = '';
                            lines.push(''); // Baris kosong antar paragraf
                        }
                    });
                    break;
                    
                case 'b':
                case 'strong':
                    currentLine += '*';
                    Array.from(node.childNodes).forEach(child => 
                        processNode(child, options));
                    currentLine += '*';
                    break;
                    
                case 'i':
                case 'em':
                    currentLine += '/';
                    Array.from(node.childNodes).forEach(child => 
                        processNode(child, options));
                    currentLine += '/';
                    break;
                    
                case 'u':
                    currentLine += '_';
                    Array.from(node.childNodes).forEach(child => 
                        processNode(child, options));
                    currentLine += '_';
                    break;
                    
                case 'ul':
                    listDepth++;
                    Array.from(node.children).forEach((li, idx) => {
                        processNode(li, {
                            ...options,
                            isList: true,
                            isListItem: true,
                            listType: 'ul',
                            listIndex: idx
                        });
                    });
                    listDepth--;
                    // Setelah list, tambah line break
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    lines.push('');
                    break;
                    
                case 'ol':
                    listDepth++;
                    Array.from(node.children).forEach((li, idx) => {
                        processNode(li, {
                            ...options,
                            isList: true,
                            isListItem: true,
                            listType: 'ol',
                            listIndex: idx
                        });
                    });
                    listDepth--;
                    // Setelah list, tambah line break
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    lines.push('');
                    break;
                    
                case 'li':
                    // Process list item content
                    Array.from(node.childNodes).forEach((child, idx) => {
                        processNode(child, {
                            ...options,
                            isListItem: true
                        });
                        
                        // Setelah list item, pindah ke line baru
                        if (idx === node.childNodes.length - 1) {
                            lines.push(currentLine);
                            currentLine = '';
                        }
                    });
                    break;
                    
                default:
                    // Process other elements
                    Array.from(node.childNodes).forEach(child => 
                        processNode(child, options));
            }
            
            // Setelah block element, tambah line break
            if (isBlock && tagName !== 'li' && !isListItem) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = '';
                }
                lines.push('');
            }
        }
        
        return listIndex;
    }
    
    // Mulai processing
    Array.from(doc.body.childNodes).forEach(node => {
        processNode(node);
    });
    
    // Tambah line terakhir jika ada
    if (currentLine) {
        lines.push(currentLine);
    }
    
    // Bersihkan hasil
    return formatLinesForNotepad(lines);
}

function normalizeHTML(html) {
    // Normalize line breaks dan whitespace
    return html
        // Ganti multiple <br> dengan single <br>
        .replace(/(<br\s*\/?>\s*){2,}/gi, '<br><br>')
        // Normalize paragraph tags
        .replace(/<p[^>]*>/gi, '<p>')
        .replace(/<\/p>/gi, '</p>')
        // Remove empty tags
        .replace(/<[^>]+>\s*<\/[^>]+>/g, '')
        // Clean up whitespace
        .trim();
}

function isBlockElement(tagName) {
    const blockElements = [
        'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'hr'
    ];
    return blockElements.includes(tagName);
}

function formatLinesForNotepad(lines) {
    // 1. Bersihkan array lines
    let cleanedLines = [];
    let previousWasEmpty = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '' || line === null || line === undefined) {
            // Hindari multiple empty lines berurutan
            if (!previousWasEmpty && cleanedLines.length > 0) {
                cleanedLines.push('');
                previousWasEmpty = true;
            }
        } else {
            cleanedLines.push(line);
            previousWasEmpty = false;
        }
    }
    
    // 2. Tambah header
    const header = [
        '='.repeat(50),
        'Dokumen dibuat dengan Notepad Pro',
        'Tanggal: ' + new Date().toLocaleString('id-ID'),
        '='.repeat(50),
        ''
    ];
    
    // 3. Gabungkan dengan line endings untuk Windows
    const allLines = [...header, ...cleanedLines, '', getFooter()];
    
    // 4. Gunakan Windows line endings (\r\n)
    return allLines.join('\r\n');
}

function getFooter() {
    return '='.repeat(50) + '\r\n' +
           'Notepad Pro - Modern Web Text Editor\r\n' +
           '='.repeat(50);
}

// ==================== FUNGSI CLEANUP ====================
function cleanTextResult(text) {
    return text
        // Hapus baris kosong berlebihan
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Hapus spasi di awal baris
        .replace(/^\s+/gm, '')
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Tambah header
        .trim() + '\n\n' + getFileFooter();
}

// ==================== FOOTER FILE ====================
function getFileFooter() {
    return `════════════════════════════════════════
Dibuat dengan ZenWrite
${new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}
════════════════════════════════════════`;
}

// ==================== TAMBAHKAN SAVE OPTIONS ====================
function addSaveOptions() {
    // Ganti tombol Save dengan versi lebih baik
    elements.saveFileBtn.innerHTML = '<i class="fas fa-file-export"></i> <span>Export File</span>';
    elements.saveFileBtn.title = 'Export ke berbagai format';
    
    // Hapus event listener lama
    elements.saveFileBtn.replaceWith(elements.saveFileBtn.cloneNode(true));
    elements.saveFileBtn = document.getElementById('saveFileBtn');
    
    // Tambah event listener baru dengan options
    elements.saveFileBtn.addEventListener('click', showExportOptions);
}

// ==================== SHOW EXPORT OPTIONS ====================
function showExportOptions() {
    const modalHTML = `
        <div class="modal show" id="exportModal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📁 Export File</h3>
                    <button class="modal-close" onclick="closeExportModal()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div class="export-option" onclick="exportFile('txt')">
                        <div class="export-icon">📄</div>
                        <div>
                            <strong>Notepad Windows (.txt)</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                Format plain text yang bisa dibuka di semua aplikasi
                            </p>
                        </div>
                    </div>
                    
                    <div class="export-option" onclick="exportFile('html')">
                        <div class="export-icon">🌐</div>
                        <div>
                            <strong>Web Page (.html)</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                Simpan dengan format HTML lengkap
                            </p>
                        </div>
                    </div>
                    
                    <div class="export-option" onclick="exportFile('md')">
                        <div class="export-icon">📝</div>
                        <div>
                            <strong>Markdown (.md)</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                Untuk GitHub, dokumentasi, dll
                            </p>
                        </div>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="closeExportModal()" 
                            style="width: 100%; margin-top: 20px;">
                        Batal
                    </button>
                </div>
            </div>
        </div>
        
        <style>
            .export-option {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .export-option:hover {
                border-color: #3498db;
                background: #f8fafc;
                transform: translateY(-2px);
            }
            .export-icon {
                font-size: 24px;
            }
        </style>
    `;
    
    // Tambah modal ke body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Tambah fungsi global untuk close
    window.closeExportModal = function() {
        document.getElementById('exportModal').remove();
    };
}

// ==================== EXPORT FILE FUNCTION ====================
window.exportFile = function(format) {
    const currentTab = getCurrentTab();
    let content, fileName, mimeType;
    
    switch(format) {
        case 'txt':
            content = convertToWindowsNotepadFormat(elements.editor.innerHTML);
            fileName = (currentTab.title || 'Untitled').replace(/\.[^/.]+$/, "") + '.txt';
            mimeType = 'text/plain';
            break;
            
        case 'html':
            content = exportAsHTML(elements.editor.innerHTML);
            fileName = (currentTab.title || 'Untitled').replace(/\.[^/.]+$/, "") + '.html';
            mimeType = 'text/html';
            break;
            
        case 'md':
            content = exportAsMarkdown(elements.editor.innerHTML);
            fileName = (currentTab.title || 'Untitled').replace(/\.[^/.]+$/, "") + '.md';
            mimeType = 'text/markdown';
            break;
    }
    
    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close modal
    window.closeExportModal();
    
    showNotification(`✅ File berhasil di-export sebagai ${fileName}`);
};

// ==================== EXPORT AS HTML ====================
function exportAsHTML(html) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getCurrentTab().title || 'Dokumen Notepad Pro'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            margin: 40px auto;
            max-width: 800px;
            padding: 20px;
            background: #ffffff;
            color: #333333;
        }
        .content {
            white-space: pre-wrap;
            font-size: 16px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="content">
        ${html}
    </div>
    <div class="footer">
        Dibuat dengan Notepad Pro • ${new Date().toLocaleString('id-ID')}
    </div>
</body>
</html>`;
}

// ==================== EXPORT AS MARKDOWN ====================
function exportAsMarkdown(html) {
    // Simple HTML to Markdown conversion
    let md = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<b>/gi, '**')
        .replace(/<\/b>/gi, '**')
        .replace(/<strong>/gi, '**')
        .replace(/<\/strong>/gi, '**')
        .replace(/<i>/gi, '*')
        .replace(/<\/i>/gi, '*')
        .replace(/<em>/gi, '*')
        .replace(/<\/em>/gi, '*')
        .replace(/<u>/gi, '__')
        .replace(/<\/u>/gi, '__')
        .replace(/<ul>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ol>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<li>/gi, '* ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Remove remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    
    // Add metadata
    return `# ${getCurrentTab().title || 'Dokumen'}\n\n${md}\n\n---\n*Dibuat dengan Notepad Pro*\n*${new Date().toLocaleString('id-ID')}*`;
}


function printDocument() {
    const printContent = elements.editor.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="font-family: Arial; padding: 20mm; line-height: 1.6;">
            ${printContent}
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    updateEditorContent();
    showNotification('Dokumen dicetak');
}

function showWordCountModal() {
    const content = elements.editor.textContent || elements.editor.innerText;
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const chars = content.length;
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const pages = Math.ceil(words.length / 500) || 1;
    
    alert(`Statistik Dokumen:
    Kata: ${words.length}
    Karakter: ${chars}
    Baris: ${lines.length}
    Halaman: ${pages}
    Karakter (tanpa spasi): ${content.replace(/\s/g, '').length}`);
}

// Line Numbers
function updateLineNumbers() {
    const content = elements.editor.textContent || '';
    const lineCount = Math.max(content.split('\n').length, 1);
    
    let numbers = '';
    for (let i = 1; i <= lineCount; i++) {
        numbers += `${i}<br>`;
    }
    
    elements.lineNumbers.innerHTML = numbers;
}

// Utility Functions
function getCursorPosition() {
    // Simplified cursor position
    const selection = window.getSelection();
    return selection.rangeCount > 0 ? selection.getRangeAt(0).startOffset : 0;
}

function showNotification(message, type = 'success') {
    elements.notificationText.textContent = message;
    elements.notification.className = 'notification';
    
    if (type === 'error') {
        elements.notification.classList.add('error');
        elements.notification.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
    } else if (type === 'warning') {
        elements.notification.classList.add('warning');
        elements.notification.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
    } else {
        elements.notification.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    }
    
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

function showKeyboardHelp() {
    document.getElementById('keyboardHelp').classList.add('show');
}

function closeKeyboardHelp() {
    document.getElementById('keyboardHelp').classList.remove('show');
}

// Tambahkan keyboard shortcut untuk help
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        showKeyboardHelp();
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Tunggu sedikit untuk memastikan semua elemen siap
    setTimeout(init, 100);
});

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
    }, 500);
});