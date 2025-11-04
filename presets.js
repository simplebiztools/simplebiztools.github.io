// ==========================================
// TOOL PRESETS SYSTEM
// Saves and loads tool configurations
// ==========================================

// Get all presets for a specific tool
function getPresets(toolName) {
    const key = `presets_${toolName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

// Save a new preset
function savePreset(toolName, presetName, presetData) {
    const presets = getPresets(toolName);
    
    // Check if preset name already exists
    const existingIndex = presets.findIndex(p => p.name === presetName);
    
    const newPreset = {
        name: presetName,
        data: presetData,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        // Update existing preset
        presets[existingIndex] = newPreset;
    } else {
        // Add new preset
        presets.push(newPreset);
    }
    
    const key = `presets_${toolName}`;
    localStorage.setItem(key, JSON.stringify(presets));
    
    return true;
}

// Load a preset by name
function loadPreset(toolName, presetName) {
    const presets = getPresets(toolName);
    const preset = presets.find(p => p.name === presetName);
    return preset ? preset.data : null;
}

// Delete a preset
function deletePreset(toolName, presetName) {
    let presets = getPresets(toolName);
    presets = presets.filter(p => p.name !== presetName);
    
    const key = `presets_${toolName}`;
    localStorage.setItem(key, JSON.stringify(presets));
    
    return true;
}

// Rename a preset
function renamePreset(toolName, oldName, newName) {
    const presets = getPresets(toolName);
    const preset = presets.find(p => p.name === oldName);
    
    if (preset) {
        preset.name = newName;
        preset.updated = new Date().toISOString();
        
        const key = `presets_${toolName}`;
        localStorage.setItem(key, JSON.stringify(presets));
        return true;
    }
    
    return false;
}

// Export all presets as JSON (for backup)
function exportPresets(toolName) {
    const presets = getPresets(toolName);
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${toolName}_presets_backup.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import presets from JSON file
function importPresets(toolName, fileInput, callback) {
    const file = fileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (Array.isArray(imported)) {
                const key = `presets_${toolName}`;
                localStorage.setItem(key, JSON.stringify(imported));
                
                if (callback) callback(true, imported.length);
            } else {
                if (callback) callback(false, 'Invalid preset file format');
            }
        } catch (err) {
            if (callback) callback(false, 'Error parsing preset file');
        }
    };
    
    reader.readAsText(file);
}

// Create preset UI elements
function createPresetUI(toolName, getCurrentDataFn, applyDataFn) {
    const container = document.createElement('div');
    container.className = 'preset-container';
    container.innerHTML = `
        <style>
            .preset-container {
                background: var(--bg-card);
                border: 2px solid var(--border-color);
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .preset-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .preset-header h4 {
                color: var(--text-primary);
                margin: 0;
            }
            
            .preset-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .preset-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9em;
            }
            
            .preset-btn-primary {
                background: #667eea;
                color: white;
            }
            
            .preset-btn-primary:hover {
                background: #5568d3;
            }
            
            .preset-btn-secondary {
                background: var(--border-color);
                color: var(--text-primary);
            }
            
            .preset-btn-secondary:hover {
                background: #cbd5e0;
            }
            
            .preset-select {
                flex: 1;
                min-width: 200px;
                padding: 8px;
                border: 2px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 0.9em;
            }
            
            .preset-controls {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            @media (max-width: 768px) {
                .preset-header {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .preset-controls {
                    flex-direction: column;
                }
                
                .preset-select {
                    width: 100%;
                }
            }
        </style>
        
        <div class="preset-header">
            <h4>💾 Saved Presets</h4>
            <div class="preset-actions">
                <button class="preset-btn preset-btn-secondary" onclick="presetExport_${toolName}()">
                    📥 Export
                </button>
            </div>
        </div>
        
        <div class="preset-controls">
            <select class="preset-select" id="preset-select-${toolName}">
                <option value="">-- Select a preset --</option>
            </select>
            <button class="preset-btn preset-btn-primary" onclick="presetLoad_${toolName}()">
                Load
            </button>
            <button class="preset-btn preset-btn-primary" onclick="presetSave_${toolName}()">
                Save Current
            </button>
            <button class="preset-btn preset-btn-secondary" onclick="presetDelete_${toolName}()">
                Delete
            </button>
        </div>
    `;
    
    // Create global functions for this tool
    window[`presetLoad_${toolName}`] = function() {
        const select = document.getElementById(`preset-select-${toolName}`);
        const presetName = select.value;
        
        if (!presetName) {
            alert('Please select a preset to load');
            return;
        }
        
        const data = loadPreset(toolName, presetName);
        if (data) {
            applyDataFn(data);
            alert(`✅ Loaded preset: ${presetName}`);
        } else {
            alert('❌ Error loading preset');
        }
    };
    
    window[`presetSave_${toolName}`] = function() {
        const presetName = prompt('Enter a name for this preset:');
        if (!presetName || presetName.trim() === '') {
            return;
        }
        
        const currentData = getCurrentDataFn();
        if (savePreset(toolName, presetName.trim(), currentData)) {
            alert(`✅ Preset saved: ${presetName}`);
            refreshPresetList(toolName);
        } else {
            alert('❌ Error saving preset');
        }
    };
    
    window[`presetDelete_${toolName}`] = function() {
        const select = document.getElementById(`preset-select-${toolName}`);
        const presetName = select.value;
        
        if (!presetName) {
            alert('Please select a preset to delete');
            return;
        }
        
        if (!confirm(`Delete preset "${presetName}"?`)) {
            return;
        }
        
        if (deletePreset(toolName, presetName)) {
            alert(`✅ Preset deleted: ${presetName}`);
            refreshPresetList(toolName);
        } else {
            alert('❌ Error deleting preset');
        }
    };
    
    window[`presetExport_${toolName}`] = function() {
        exportPresets(toolName);
    };
    
    // Populate preset list
    refreshPresetList(toolName);
    
    return container;
}

function refreshPresetList(toolName) {
    const select = document.getElementById(`preset-select-${toolName}`);
    if (!select) return;
    
    const presets = getPresets(toolName);
    
    select.innerHTML = '<option value="">-- Select a preset --</option>';
    
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name;
        option.textContent = preset.name;
        select.appendChild(option);
    });
}
