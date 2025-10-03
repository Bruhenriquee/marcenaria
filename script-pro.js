// =================================================================
// SIMULATOR PRO LOGIC
// This script is dedicated to the marceneiro.html page.
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    setupSimulator();
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `
        fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform translate-x-full
        ${type === 'success' ? 'bg-green-500 text-white' : 
          type === 'error' ? 'bg-red-500 text-white' : 
          'bg-blue-500 text-white'}
        transition-transform duration-300 ease-in-out
    `;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                type === 'error' ? 'fa-exclamation-circle' : 
                                'fa-info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function maskPhone(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    value = value.substring(0, 11);

    if (value.length > 6) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
    } else if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    }
    input.value = value;
}

function maskCpf(event) {
    let value = event.target.value.replace(/\D/g, '').substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    event.target.value = value;
}

function maskCep(event) {
    let value = event.target.value.replace(/\D/g, '').substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    event.target.value = value;
}

const SIMULATOR_CONFIG = {
    COMMON_COSTS: {
        'PROJECT_3D': 350,
    },
    WARDROBE: {
        MDF_SHEET_PRICING: {
            'Branco': 240,
            'Premium': 400,
        },
        MATERIAL_AREA_MULTIPLIER: 2.5,
        MDF_SHEET_SIZE: 5.09,
        HARDWARE: {
            HANDLE_BAR_COST: {
                    'aluminio': 0,
                'premium': 100.00
            },
            HANDLE_BAR_LENGTH: 3.0,
            HINGE_COST_PER_UNIT: { 'padrao': 2.50, 'softclose': 5.00 },
            SLIDE_COST_PER_DRAWER: 20.00,
        },
        EXTRAS_COST: {
            'Porta com Espelho': 700,
            'Gaveteiro com Chave': 200,
            'HARDWARE_SOFT_CLOSE_PER_UNIT': 80,
        }
    },
    KITCHEN: {
        // O preço da cozinha é calculado com base no CUSTO DAS CHAPAS de MDF.
        // Defina aqui o preço por CHAPA para cada tipo de material.
        MDF_SHEET_PRICING: {
            'Branco': 240, // Preço de uma chapa de MDF branco.
            'Premium': 400,  // Preço de uma chapa de MDF colorido/texturizado.
        },
        MDF_SHEET_SIZE: 5.09,
        HARDWARE: {
            HINGE_COST_PER_UNIT: { 'padrao': 2.50, 'softclose': 5.00 },
            SLIDE_COST_PER_DRAWER: 20.00, // O valor já estava em 20, mantido.
            HANDLE_BAR_COST: { 'aluminio': 75.00, 'premium': 100.00 },
            HANDLE_PREMIUM_EXTRA_PER_UNIT: 6.00,
            HANDLE_BAR_LENGTH: 3.0,
            UNIT_WIDTH: 0.4,
        },
        EXTRAS_COST: {
            'Porta-temperos': 350, // Custo FIXO para um porta-temperos embutido.
            'Lixeira Embutida': 400, // Custo FIXO para uma lixeira embutida.
            // Custo por METRO LINEAR de armário de pia (balcão inferior).
            'SINK_CABINET_PER_METER': 450,
            // Custo por METRO LINEAR de altura da torre quente (para forno/micro-ondas).
            'HOT_TOWER_PER_METER': 600
        }
    }
};

/**
 * Splits a large part into smaller pieces if it exceeds the sheet width.
 * @param {number} width - The width of the part.
 * @param {number} height - The height of the part.
 * @param {string} description - The description of the part.
 * @param {number} sheetWidthLimit - The maximum width of the sheet.
 * @returns {Array<Object>} An array of part objects.
 */
function splitLargePart(width, height, description, sheetWidthLimit = 2750) {
    if (width <= sheetWidthLimit) {
        return [{ w: width, h: height, description }];
    }
    const numPieces = Math.ceil(width / sheetWidthLimit);
    const pieceWidth = width / numPieces;
    return Array.from({ length: numPieces }, (_, i) => ({ w: pieceWidth, h: height, description: `${description} #${i + 1}` }));
}
function getWardrobeParts(walls, height, depth, numDrawers, hasDoors, numDoors, hasCorner) {
    const thickness = 15; // MDF thickness in mm
    const mdf15Parts = [];
    const mdf3Parts = [];

    mdf15Parts.push({ w: height, h: depth, description: 'Left Side' });
    const totalWidth = walls.reduce((acc, wall) => acc + wall.width, 0);
    mdf15Parts.push({ w: height, h: depth, description: 'Right Side' });
    mdf15Parts.push(...splitLargePart(totalWidth, depth, 'Top'));
    mdf15Parts.push(...splitLargePart(totalWidth, depth, 'Bottom'));

    // Se tiver canto, ajusta a largura da primeira parede para não sobrepor
    const effectiveWalls = walls.map((wall, index) => {
        const shouldAdjust = hasCorner && (index === 0 || index === 1);
        return { ...wall, width: shouldAdjust ? wall.width - 900 : wall.width };
    });

    const internalHeight = height - (2 * thickness); // Altura interna real (desconta tampo e base).
    const numModules = Math.ceil(totalWidth / 900); // Módulos de no máximo 90cm.
    const numDividers = numModules - 1;
    const internalModuleWidth = (totalWidth - (2 * thickness) - (numDividers * thickness)) / numModules;

    for (let i = 0; i < numDividers; i++) {
        mdf15Parts.push({ w: internalHeight, h: depth, description: `Divider ${i+1}` });
    }

    for (let i = 0; i < numModules; i++) {
        const numShelves = Math.floor(height / 800); // Shelves per module
        for (let s = 0; s < numShelves; s++) { 
            mdf15Parts.push({ w: internalModuleWidth, h: depth - 20, description: `Shelf ${i+1}-${s+1}` });
        }
    }

    // Doors
    if (hasDoors) {
        const doorWidth = totalWidth / numDoors; // Use the exact number of doors passed as parameter
        for (let i = 0; i < numDoors; i++) {
            mdf15Parts.push({ w: doorWidth, h: height, description: 'Door' });
        }
    }

    const drawerWidth = Math.min(500, internalModuleWidth - 40); // Use module width, max 50cm
    const drawerDepth = depth - 50;
    const drawerBoxWidth = drawerWidth - 40;
    const drawerBoxDepth = drawerDepth - 50;

    for (let i = 0; i < numDrawers; i++) {
        mdf15Parts.push({ w: drawerWidth, h: 200, description: 'Drawer Front' });
        mdf15Parts.push({ w: drawerBoxDepth, h: 180, description: 'Drawer Side' });
        mdf15Parts.push({ w: drawerBoxDepth, h: 180, description: 'Drawer Side' });
        mdf15Parts.push({ w: drawerBoxWidth, h: 180, description: 'Drawer Back' });
        mdf3Parts.push({ w: drawerBoxWidth, h: drawerBoxDepth, description: 'Drawer Bottom' });
    }

    effectiveWalls.forEach((wall, index) => {
        mdf3Parts.push(...splitLargePart(wall.width, height, `Back Panel Wall ${index + 1}`));
    });

    // Adiciona as peças do módulo de canto se selecionado
    if (hasCorner) {
        const cornerDim = 900; // Dimensão do canto: 90x90cm
        const cornerDoorWidth = 400; // Largura comum para cada folha da porta de canto

        // Estrutura do módulo de canto
        mdf15Parts.push({ w: cornerDim, h: cornerDim, description: 'Canto - Tampo' });
        mdf15Parts.push({ w: cornerDim, h: cornerDim, description: 'Canto - Base' });
        mdf15Parts.push({ w: internalHeight, h: depth, description: 'Canto - Divisória Interna' });
        mdf15Parts.push({ w: internalHeight, h: cornerDim - depth, description: 'Canto - Fechamento Lateral' });
        mdf15Parts.push({ w: cornerDim - thickness, h: depth - 20, description: 'Canto - Prateleira' });

        // Portas do módulo de canto (sistema bi-fold)
        mdf15Parts.push({ w: cornerDoorWidth, h: height, description: 'Canto - Porta' });
        mdf15Parts.push({ w: cornerDoorWidth, h: height, description: 'Canto - Porta' });

        // Fundo do módulo de canto
        mdf3Parts.push({ w: cornerDim, h: height, description: 'Canto - Fundo' });
        mdf3Parts.push({ w: cornerDim - depth, h: height, description: 'Canto - Fundo Lateral' });
    }
    // CORREÇÃO: Adiciona o painel de fundo para a lateral do móvel, que estava faltando.
    mdf3Parts.push({ w: depth, h: height, description: 'Back Panel Side' });

    return { mdf15Parts, mdf3Parts };
}

function getKitchenParts(walls, numDrawers) {
    const thickness = 15; // MDF thickness in mm
    const mdf15Parts = [];
    const mdf3Parts = [];
    let drawersToCreate = numDrawers;

    walls.forEach(wall => {
        const { width, height } = wall;
        const lowerCabinetHeight = 850; // Altura padrão do chão à bancada
        const spaceBetween = 650; // Espaço padrão entre bancada e armário superior
        const upperCabinetHeight = Math.max(0, height - lowerCabinetHeight - spaceBetween);
        const cabinetDepth = 600;

        // Upper cabinets
        if (upperCabinetHeight > 0) {
            const numUpperCabinets = Math.floor(width / 600); // Módulos de 60cm
            for (let i = 0; i < numUpperCabinets; i++) {
                const moduleWidth = 600;
                mdf15Parts.push({ w: moduleWidth, h: cabinetDepth, description: 'Upper Cabinet Top' });
                mdf15Parts.push({ w: moduleWidth, h: cabinetDepth, description: 'Upper Cabinet Bottom' });
                mdf15Parts.push({ w: upperCabinetHeight - (2 * thickness), h: cabinetDepth, description: 'Upper Cabinet Side' });
                mdf15Parts.push({ w: upperCabinetHeight - (2 * thickness), h: cabinetDepth, description: 'Upper Cabinet Side' });
                mdf15Parts.push({ w: moduleWidth - 4, h: upperCabinetHeight - 4, description: 'Upper Cabinet Door' });
                mdf3Parts.push({ w: moduleWidth, h: upperCabinetHeight, description: 'Upper Cabinet Back' });
            }
        }

        // Lower cabinets
        const numLowerCabinets = Math.floor(width / 600);
        for (let i = 0; i < numLowerCabinets; i++) { // Assume 60cm wide modules
            const moduleWidth = 600;
            const moduleDepth = cabinetDepth;
            const moduleHeight = lowerCabinetHeight;

            mdf15Parts.push({ w: moduleWidth, h: moduleDepth, description: 'Lower Cabinet Top' }); // Travessas
            mdf15Parts.push({ w: moduleWidth, h: moduleDepth, description: 'Lower Cabinet Bottom' }); // Base
            mdf15Parts.push({ w: moduleHeight - thickness, h: moduleDepth, description: 'Lower Cabinet Side' });
            mdf15Parts.push({ w: moduleHeight - thickness, h: moduleDepth, description: 'Lower Cabinet Side' });
            // CORREÇÃO: Adiciona o fundo do armário inferior.
            mdf3Parts.push({ w: moduleWidth, h: moduleHeight, description: 'Lower Cabinet Back' });

            if (drawersToCreate > 0) {
                const numDrawersInModule = Math.min(drawersToCreate, 3); // Max 3 drawers per module
                const drawerFrontHeight = (moduleHeight - (numDrawersInModule * 4)) / numDrawersInModule;
                const drawerBoxHeight = drawerFrontHeight - 20;

                for (let d = 0; d < numDrawersInModule; d++) {
                    const drawerBoxWidth = moduleWidth - 40;
                    const drawerBoxDepth = moduleDepth - 50;

                    mdf15Parts.push({ w: moduleWidth - 4, h: drawerFrontHeight, description: 'Drawer Front' });
                    mdf15Parts.push({ w: drawerBoxDepth, h: drawerBoxHeight, description: 'Drawer Side' });
                    mdf15Parts.push({ w: drawerBoxDepth, h: drawerBoxHeight, description: 'Drawer Side' });
                    mdf15Parts.push({ w: drawerBoxWidth, h: drawerBoxHeight, description: 'Drawer Back' });
                    mdf3Parts.push({ w: drawerBoxWidth, h: drawerBoxDepth, description: 'Drawer Bottom' });
                }
                drawersToCreate -= numDrawersInModule;
            } else {
                mdf15Parts.push({ w: moduleWidth - 4, h: moduleHeight - 4, description: 'Lower Cabinet Door' });
            }
        }
    });

    return { mdf15Parts, mdf3Parts };
}

function optimizeCutting(parts, sheetWidth, sheetHeight) {
    if (!parts || parts.length === 0) {
        return [];
    }

    const processedParts = parts.map(part => {
        const newPart = { ...part };
        if (newPart.h > sheetHeight && newPart.h <= sheetWidth && newPart.w <= sheetHeight) {
            [newPart.w, newPart.h] = [newPart.h, newPart.w];
            newPart.rotated = true; // Marca como rotacionada
        }
        return newPart;
    });

    processedParts.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));

    const sheets = [];
    let remainingParts = processedParts.map(p => ({ ...p }));

    while (remainingParts.length > 0) {
        const packer = new Packer(sheetWidth, sheetHeight);
        const packedParts = [];
        const unpackedParts = [];

        packer.fit(remainingParts);

        remainingParts.forEach(part => {
            if (part.fit) {
                packedParts.push(part);
            } else {
                delete part.fit;
                unpackedParts.push(part);
            }
        });

        if (packedParts.length === 0 && unpackedParts.length > 0) {
            console.warn("Não foi possível encaixar as peças restantes (mesmo após rotação):", unpackedParts);
            break;
        }

        if (packedParts.length > 0) {
            sheets.push(packedParts);
        }

        remainingParts = unpackedParts;
    }

    return sheets;
}

function setupSimulator() {
    // --- STATE ---
    let currentStep = 1;
    const totalSteps = 6;
    const state = {
        quoteId: null, // To track saved quotes
        furnitureType: null,
        dimensions: { height: 2.75, depth: 60, walls: [{width: 3.0, height: 2.75}] },
        wardrobeFormat: null,
        material: null,
        kitchenScope: null,
        kitchenHasSinkCabinet: null,
        numDrawers: 4, // Default number of drawers
        sinkStoneWidth: 1.8,
        sinkCabinetWidth: 1.8,
        hasHotTower: null,
        hotTowerHeight: 2.2,
        stoveType: null,
        cooktopLocation: null,
        hardwareType: null,
        doorType: null,
        closetHasDoors: null,
        handleType: null,
        closetHasCorner: null,
        projectOption: null,
        projectFile: null,
        photos: [], // Para armazenar as fotos do local
        customColor: '',
        extras: [],
        customer: {
            name: '',
            email: '',
            phone: '',
            cpf: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: ''
        },
        quote: { area: 0, sheets: 0, total: 0, basePrice: 0, extrasPrice: 0, costPrice: 0, profitAmount: 0, extrasBreakdown: [], competitorPrice: 0 }
    };

    // --- DOM ELEMENTS ---
    let proControlsPanel;
    const steps = document.querySelectorAll('.form-step');
    const stepsContainer = document.getElementById('steps-container');
    const progressBarSteps = document.querySelectorAll('.progress-step');
    const progressBarLines = document.querySelectorAll('.progress-line');


    // --- INITIALIZATION ---
    function init() {
    proControlsPanel = document.getElementById('marceneiro-controls');
    setupProPanel();
        setupEventListeners();
        setupQuoteManagement();
        window.addEventListener('resize', debounce(updateContainerHeight, 200));
        updateUI(false);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function updateStateAndSave(newState) {
        Object.assign(state, newState);
    }
    function setupEventListeners() {
        document.getElementById('simulator-content').addEventListener('click', (e) => {
            if (e.target.closest('.next-btn')) {
                // Auto-correct any final commas before proceeding
                const activeStepInputs = e.target.closest('.form-step').querySelectorAll('input[type="number"]');
                activeStepInputs.forEach(input => {
                    if (input.value.includes(',')) {
                        input.value = input.value.replace(',', '.');
                    }
                });
                handleNextStep();
            } else if (e.target.closest('.prev-btn')) {
                handlePrevStep();
            } else if (e.target.closest('#restart-btn')) {
                handleRestart();
            } else if (e.target.closest('#reset-btn')) {
                handleReset();
            } else if (e.target.closest('.remove-wall-btn')) {
                handleRemoveWall(e.target.closest('.remove-wall-btn'));
            } else if (e.target.closest('#save-quote-btn')) {
                handleSaveQuote();
            }
        });

        // Event delegation to auto-correct comma to period in number inputs
        document.getElementById('simulador').addEventListener('input', (e) => {
            if (e.target.type === 'number' && e.key === ',') {
                e.target.value = e.target.value.replace(/,/g, '.');
            }
        });

        // Step 1: Furniture Type
        document.querySelectorAll('input[name="furnitureType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ furnitureType: e.target.value });
                updateUIForFurnitureType();
            });
        });

        document.querySelectorAll('#wardrobe-dims input').forEach(input => {
            input.addEventListener('input', updateDimensionsState);
        });
        document.querySelectorAll('#kitchen-dims input').forEach(input => {
            input.addEventListener('input', updateDimensionsState);
        });
        document.getElementById('add-wall-btn').addEventListener('click', addKitchenWall);
        document.getElementById('add-wardrobe-wall-btn').addEventListener('click', addWardrobeWall);

        document.querySelectorAll('input[name="wardrobeFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ wardrobeFormat: e.target.value });
                updateWardrobeSubSteps();
                updateContainerHeight();
            });
        });

        document.querySelectorAll('input[name="closetDoors"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ closetHasDoors: e.target.value === 'sim' });
                updateWardrobeRecommendation();
                updateWardrobeSubSteps(); // Re-check door type visibility
                updateContainerHeight();
            });
        });

        document.querySelectorAll('input[name="closetCorner"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ closetHasCorner: e.target.value === 'sim' });
                updateWardrobeSubSteps();
                updateContainerHeight();
            });
        });

        document.querySelectorAll('input[name="kitchenScope"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ kitchenScope: e.target.value });
                updateKitchenSubSteps();
                updateContainerHeight();
            });
        });

        document.getElementById('sinkStoneWidth').addEventListener('input', (e) => {
            const stoneWidth = e.target.value;
            const cabinetInput = document.getElementById('sinkCabinetWidth');
            if (cabinetInput.value === '' || parseFloat(cabinetInput.value) === parseFloat(state.sinkStoneWidth)) {
                cabinetInput.value = stoneWidth;
            }
        });
        document.querySelectorAll('input[name="hasHotTower"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ hasHotTower: e.target.value === 'sim' });
                updateContainerHeight();
            });
        });

        document.querySelectorAll('input[name="stoveType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ stoveType: e.target.value });
                document.getElementById('cooktop-location-step').classList.toggle('hidden', e.target.value !== 'cooktop');
                updateContainerHeight();
            });
        });

        document.querySelectorAll('input[name="cooktopLocation"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ cooktopLocation: e.target.value });
            });
        });

        document.querySelectorAll('input[name="projectOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ projectOption: e.target.value });
                document.getElementById('project-upload-container').classList.toggle('hidden', e.target.value !== 'upload');
                updateContainerHeight();
            });
        });
        document.getElementById('project-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                if (file.size > MAX_SIZE) {
                    alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
                    e.target.value = '';
                    return;
                }
                updateStateAndSave({ projectFile: file });
                document.getElementById('project-file-name').textContent = file.name;
            }
        });

        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ material: e.target.value });
                const showPremiumOptions = e.target.value === 'Premium' || e.target.value === 'Mesclada';
                document.getElementById('premium-options').classList.toggle('hidden', !showPremiumOptions);
                updateContainerHeight();
            });
        });
        document.getElementById('customColor').addEventListener('input', (e) => updateStateAndSave({ customColor: e.target.value }));

        document.querySelectorAll('input[name="doorType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ doorType: e.target.value });
            });
        });

        document.getElementById('numDrawers').addEventListener('input', (e) => {
            updateStateAndSave({
                numDrawers: parseInt(e.target.value) || 0
            });
        });

        document.getElementById('kitchenNumDrawers').addEventListener('input', (e) => {
            updateStateAndSave({
                numDrawers: parseInt(e.target.value) || 0
            });
        });
        document.querySelectorAll('input[name="hardwareType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ hardwareType: e.target.value });
            });
        });
        document.querySelectorAll('input[name="handleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ handleType: e.target.value });
            });
        });
        document.querySelectorAll('input[name="extras"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateStateAndSave({ extras: Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(cb => cb.value) });
            });
        });
        
        document.getElementById('view-quote-btn').addEventListener('click', () => handleViewQuote(false));
        document.getElementById('pdf-btn-internal').addEventListener('click', () => generatePDF('internal'));
        document.getElementById('pdf-btn-client').addEventListener('click', () => generatePDF('client'));
        document.getElementById('pdf-btn-contract').addEventListener('click', () => generatePDF('contract'));
        document.getElementById('pdf-btn-cutting').addEventListener('click', generateCuttingPlanPDF);
        document.getElementById('shopping-list-btn').addEventListener('click', handleGenerateShoppingList);
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);

        const toggleBtn = document.getElementById('toggle-breakdown-btn');
        const breakdownDiv = document.getElementById('result-breakdown');
        toggleBtn.addEventListener('click', () => {
            const isHidden = breakdownDiv.classList.toggle('hidden');
            toggleBtn.querySelector('i').classList.toggle('rotate-180', !isHidden);
            updateContainerHeight();
        });

        document.getElementById('attach-photo-input').addEventListener('change', handlePhotoUpload);
        document.getElementById('capture-photo-input').addEventListener('change', handlePhotoUpload);
        document.getElementById('photo-previews').addEventListener('click', handleRemovePhoto);

        document.getElementById('recalculate-btn').addEventListener('click', handleRecalculate);

        document.getElementById('cep-lookup-btn').addEventListener('click', handleCepLookup);

        // Listeners para o modal da lista de compras
        document.getElementById('shopping-list-modal-close').addEventListener('click', closeShoppingListModal);
        document.getElementById('print-shopping-list-btn').addEventListener('click', printShoppingList);
    }

    function setupQuoteManagement() {
        const tabBtnCosts = document.getElementById('tab-btn-costs');
        const tabBtnQuotes = document.getElementById('tab-btn-quotes');
        const tabContentCosts = document.getElementById('tab-content-costs');
        const tabContentQuotes = document.getElementById('tab-content-quotes');
        const searchInput = document.getElementById('search-quotes-input');

        tabBtnCosts.addEventListener('click', () => {
            tabContentCosts.classList.remove('hidden');
            tabContentQuotes.classList.add('hidden');
            tabBtnCosts.classList.add('bg-gold', 'text-charcoal');
            tabBtnQuotes.classList.remove('bg-gold', 'text-charcoal');
        });

        tabBtnQuotes.addEventListener('click', () => {
            tabContentQuotes.classList.remove('hidden');
            tabContentCosts.classList.add('hidden');
            tabBtnQuotes.classList.add('bg-gold', 'text-charcoal');
            tabBtnCosts.classList.remove('bg-gold', 'text-charcoal');
            renderSavedQuotes();
        });

        searchInput.addEventListener('input', () => renderSavedQuotes(searchInput.value));

        document.getElementById('saved-quotes-list').addEventListener('click', (e) => {
            const quoteId = e.target.closest('[data-quote-id]')?.dataset.quoteId;
            if (!quoteId) return;

            if (e.target.closest('.load-quote-btn')) {
                handleLoadQuote(quoteId);
            } else if (e.target.closest('.delete-quote-btn')) {
                handleDeleteQuote(quoteId);
            } else if (e.target.closest('.duplicate-quote-btn')) {
                handleDuplicateQuote(quoteId);
            }
        });

        renderSavedQuotes();
    }

    function getSavedQuotes() {
        try {
            const quotes = localStorage.getItem('roni_saved_quotes');
            return quotes ? JSON.parse(quotes) : [];
        } catch (e) {
            console.error("Error reading quotes from localStorage", e);
            return [];
        }
    }

    function saveQuotes(quotes) {
        try {
            localStorage.setItem('roni_saved_quotes', JSON.stringify(quotes));
        } catch (e) {
            console.error("Error saving quotes to localStorage", e);
            showNotification("Erro ao salvar orçamentos.", "error");
        }
    }

    function handleSaveQuote() {
        if (!state.customer.name) {
            showNotification("Preencha o nome do cliente para salvar.", "error");
            return;
        }

        const quotes = getSavedQuotes();
        const quoteData = JSON.parse(JSON.stringify(state)); // Deep copy of state

        if (state.quoteId) { // Update existing quote
            const index = quotes.findIndex(q => q.quoteId === state.quoteId);
            if (index !== -1) {
                quotes[index] = quoteData;
                showNotification("Orçamento atualizado com sucesso!", "success");
            }
        } else { // Save new quote
            quoteData.quoteId = Date.now();
            state.quoteId = quoteData.quoteId; // Update current state with new ID
            quotes.unshift(quoteData); // Add to the beginning of the list
            showNotification("Orçamento salvo com sucesso!", "success");
        }

        saveQuotes(quotes);
        document.getElementById('save-quote-btn').innerHTML = '<i class="fas fa-check mr-2"></i>Salvo!';
    }

    function handleDeleteQuote(quoteId) {
        if (confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
            let quotes = getSavedQuotes();
            quotes = quotes.filter(q => q.quoteId !== parseInt(quoteId));
            saveQuotes(quotes);
            showNotification("Orçamento excluído.", "info");
            renderSavedQuotes();
        }
    }

    function setupProPanel() {
        const toggleBtn = document.getElementById('toggle-controls-btn');
        const mainContent = document.getElementById('main-content');
        const closeBtn = document.getElementById('close-controls-btn');

        const openPanel = () => {
            proControlsPanel.classList.remove('-translate-x-full');
            toggleBtn.classList.add('hidden');
            if (window.innerWidth >= 768) {
                mainContent.style.marginLeft = proControlsPanel.offsetWidth + 'px';
            } else {
                document.body.style.overflow = 'hidden';
            }
        };

        const closePanel = () => {
            proControlsPanel.classList.add('-translate-x-full');
            mainContent.style.marginLeft = '0';
            toggleBtn.classList.remove('hidden');
            document.body.style.overflow = 'auto';
        };

        toggleBtn.addEventListener('click', () => {
            openPanel();
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closePanel);
        }

        const resetPanelBtn = document.getElementById('reset-panel-btn');
        if (resetPanelBtn) {
            resetPanelBtn.addEventListener('click', () => {
                document.getElementById('mdf-branco-cost').value = 240;
                document.getElementById('mdf-premium-cost').value = 400;
                document.getElementById('mdf-fundo-cost').value = 140;
                document.getElementById('edge-tape-cost').value = 2.5;
                document.getElementById('hinge-standard-cost').value = 2.5;
                document.getElementById('hinge-softclose-cost').value = 5;
                document.getElementById('slide-cost').value = 20;
                document.getElementById('cost-multiplier').value = 2;
                document.getElementById('discount-extra').value = 0;
                showNotification('Valores padrão restaurados!', 'success');
            });
        }
    }

    function handleReset() {
        state.quoteId = null; // Clear quote ID on reset
        currentStep = 1;
        resetState(); // Resets the internal state object
        resetFormUI(); // Resets the form inputs in the DOM
        updateUI(); 
    }

    function handleNextStep() {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
            }
        }
    }

    function handlePrevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    }

    function handleRestart() {
        if (confirm('Tem certeza que deseja recomeçar a simulação? Todos os dados preenchidos serão perdidos.')) {
            state.quoteId = null; // Clear quote ID on restart
            resetState();
            resetFormUI();
            currentStep = 1; 
            updateUI(false);
        }
    }

    function updateUI(shouldScroll = true) { // Add parameter with default value
        steps.forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            const isActive = stepNumber === currentStep;
            step.classList.toggle('active', isActive);

            const prevButton = step.querySelector('.prev-btn');
            if (prevButton) {
                prevButton.classList.toggle('hidden', currentStep === 1);
            } 

            if (stepNumber === totalSteps && isActive) {
                document.getElementById('lead-capture-form').classList.remove('hidden');
                document.getElementById('result-container').classList.add('hidden');
            }
        });
        progressBarSteps.forEach((step, index) => {
            step.classList.toggle('active', index < currentStep);
        });
        progressBarLines.forEach((line, index) => {
            line.classList.toggle('active', index < currentStep - 1);
        });

        updateContainerHeight();

        if (shouldScroll) { // Check the parameter before scrolling
            const simulatorSection = document.getElementById('simulador');
            if (simulatorSection) {
                simulatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    function updateUIForFurnitureType() {
        const isWardrobe = state.furnitureType === 'Guarda-Roupa';
        document.getElementById('wardrobe-dims').classList.toggle('hidden', !isWardrobe);
        document.getElementById('kitchen-dims').classList.toggle('hidden', isWardrobe);
        document.getElementById('wardrobe-options').classList.toggle('hidden', !isWardrobe);
        document.getElementById('kitchen-options').classList.toggle('hidden', isWardrobe);

        const handleTypeSection = document.getElementById('handle-type-section');
        if (isWardrobe) {
            updateWardrobeSubSteps();
        } else { // For Kitchen, it should always be visible in step 4
            handleTypeSection.classList.remove('hidden');
        }
        
        if (isWardrobe) {
            updateWardrobeRecommendation();
            updateDrawerRecommendation();
        } else {
            const recommendationDiv = document.getElementById('wardrobe-recommendation');
            if (recommendationDiv) recommendationDiv.classList.add('hidden');
        }
        updateContainerHeight();
    }

    function updateWardrobeSubSteps() {
        const isCloset = state.wardrobeFormat === 'closet';
        document.getElementById('closet-door-step').classList.toggle('hidden', !isCloset);
        document.getElementById('add-wardrobe-wall-btn').classList.toggle('hidden', !isCloset);
        // Mostra a pergunta sobre o canto apenas se for um closet com mais de uma parede
        const wallCount = document.getElementById('wardrobe-walls-container').children.length;
        document.getElementById('closet-corner-step').classList.toggle('hidden', !isCloset || wallCount < 2);

        const hasDoors = !(isCloset && !state.closetHasDoors);
        const handleTypeSection = document.getElementById('handle-type-section');
        handleTypeSection.classList.toggle('hidden', isCloset && !state.closetHasDoors);
        
        const doorTypeSection = document.getElementById('door-type-section');
        const isClosetOpen = isCloset && !state.closetHasDoors;

        doorTypeSection.classList.toggle('hidden', isClosetOpen);

        const mirrorDoorOption = document.getElementById('extra-mirror-door');
        if (mirrorDoorOption) {
            mirrorDoorOption.classList.toggle('hidden', isClosetOpen);
            if (isClosetOpen) {
                const mirrorCheckbox = mirrorDoorOption.querySelector('input[type="checkbox"]');
                if (mirrorCheckbox.checked) {
                    mirrorCheckbox.checked = false;
                    mirrorCheckbox.dispatchEvent(new Event('change')); 
                }
            }
        }
    }

    function updateKitchenSubSteps() {
        const scope = state.kitchenScope;
        const isFullKitchen = scope === 'completa';
        const isSinkOnly = scope === 'pia_apenas';

        // Mostra opções de cozinha completa (torre, fogão, etc.) e os inputs de parede
        document.getElementById('full-kitchen-options').classList.toggle('hidden', !isFullKitchen);
        document.getElementById('kitchen-walls-container').classList.toggle('hidden', !isFullKitchen);
        document.getElementById('add-wall-btn').classList.toggle('hidden', !isFullKitchen);

        // Mostra os inputs de medida da pia para AMBOS os casos (cozinha completa ou apenas pia)
        const showSinkInputs = isFullKitchen || isSinkOnly;
        document.getElementById('sink-stone-width-container').classList.toggle('hidden', !showSinkInputs);

        // Lógica de estado: se for apenas pia, limpa as paredes.
        if (isSinkOnly) {
            updateStateAndSave({ dimensions: { ...state.dimensions, walls: [] } });
        } 
        // Se for cozinha completa e não houver paredes definidas, adiciona a padrão.
        else if (isFullKitchen && state.dimensions.walls.length === 0) {
            updateStateAndSave({ dimensions: { ...state.dimensions, walls: [{width: 2.2, height: 2.7}] } });
        }
    }

    function addWardrobeWall() {
        const container = document.getElementById('wardrobe-walls-container');
        const wallCount = container.children.length + 1;
        if (wallCount > 3) return; // Max 3 walls for a closet (U-shape)
        const newWall = document.createElement('div');
    newWall.className = 'wall-entry flex items-end gap-4 pt-4 mt-4 border-t';
        newWall.innerHTML = `
            <div class="flex-grow">
                <label for="wardrobe-width${wallCount}" class="block mb-2 font-semibold">Largura Parede ${wallCount} (m)</label>
                <input type="number" id="wardrobe-width${wallCount}" name="wardrobe-width" step="0.1" min="0" value="0" class="form-input">
            </div>
        <button type="button" class="remove-wall-btn text-red-500 hover:text-red-700 transition-colors pb-2" aria-label="Remover parede">
                <i class="fas fa-times-circle text-2xl"></i>
            </button>
        `;
        container.appendChild(newWall);
        newWall.querySelector('input').addEventListener('input', updateDimensionsState);
        if (wallCount === 3) {
            document.getElementById('add-wardrobe-wall-btn').classList.add('hidden');
        }
        updateContainerHeight();
        updateWardrobeSubSteps(); // Adicionado para verificar a visibilidade do passo de canto
    }

    function addKitchenWall() {
        const container = document.getElementById('kitchen-walls-container');
        const wallCount = container.children.length + 1;
        if (wallCount > 3) return;
        const newWall = document.createElement('div');
        newWall.className = 'wall-entry flex items-end gap-4 border-t border-gray-200 pt-4 mt-4';
        newWall.innerHTML = `
            <div class="flex-grow">
                <label class="block mb-2 font-semibold">Parede ${wallCount} com armários</label>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="kitchen-wall-width${wallCount}" class="text-sm text-gray-600">Largura (m)</label>
                        <input type="number" id="kitchen-wall-width${wallCount}" name="kitchen-wall-width" step="0.1" min="0" value="0" class="form-input">
                    </div>
                    <div>
                        <label for="kitchen-wall-height${wallCount}" class="text-sm text-gray-600">Altura da parede (m)</label>
                        <input type="number" id="kitchen-wall-height${wallCount}" name="kitchen-wall-height" step="0.1" min="0" value="2.75" class="form-input">
                    </div>
                </div>
            </div>
            <button type="button" class="remove-wall-btn text-red-500 hover:text-red-700 transition-colors pb-2" aria-label="Remover parede">
                <i class="fas fa-times-circle text-2xl"></i>
            </button>
        `;
        container.appendChild(newWall);
        newWall.querySelectorAll('input').forEach(input => input.addEventListener('input', updateDimensionsState));
        if (wallCount === 3) {
            document.getElementById('add-wall-btn').classList.add('hidden');
        }
        updateContainerHeight();
    }

    function handleRemoveWall(button) {
        const wallEntry = button.closest('.wall-entry');
        if (wallEntry) {
            const container = wallEntry.parentElement;
            wallEntry.remove();
            updateDimensionsState();
            updateWardrobeSubSteps(); // Re-check visibility of corner step
            
            if (container.id === 'wardrobe-walls-container') {
                document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');
            } else if (container.id === 'kitchen-walls-container') {
                document.getElementById('add-wall-btn').classList.remove('hidden');
            }
            updateContainerHeight();
        }
    }

    function updateContainerHeight() {
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            setTimeout(() => {
                if (stepsContainer) { // Check if container exists
                    stepsContainer.style.height = `${activeStep.offsetHeight}px`;
                }
            }, 50); // A small delay is enough for the DOM to reflow.
        }
    }

    function updateDimensionsState() {
        if (state.furnitureType === 'Guarda-Roupa') {
            const widths = Array.from(document.querySelectorAll('#wardrobe-walls-container input[name="wardrobe-width"]')).map(input => parseFloat(input.value) || 0);
            const height = parseFloat(document.getElementById('wardrobe-height').value) || 0;
            state.dimensions.walls = widths.map(w => ({ width: w, height: height }));
            state.dimensions.height = height;
            updateDrawerRecommendation();
            updateWardrobeRecommendation();
        } else { // Cozinha
            const widths = Array.from(document.querySelectorAll('input[name="kitchen-wall-width"]')).map(input => parseFloat(input.value) || 0);
            const heights = Array.from(document.querySelectorAll('input[name="kitchen-wall-height"]')).map(input => parseFloat(input.value) || 0);
            state.dimensions.walls = widths.map((w, i) => ({ width: w, height: heights[i] || 0 }));
            state.sinkStoneWidth = parseFloat(document.getElementById('sinkStoneWidth').value) || 0;
            state.sinkCabinetWidth = parseFloat(document.getElementById('sinkCabinetWidth').value) || 0;
            const kitchenNumDrawersInput = document.getElementById('kitchenNumDrawers');
            if (kitchenNumDrawersInput) {
                state.numDrawers = parseInt(kitchenNumDrawersInput.value) || 0;
            }
        }
        updateKitchenDrawerRecommendation();
    }

    function validateStep(step) {
        if (step === 1 && !state.furnitureType) {
            showNotification('Por favor, escolha um tipo de móvel para continuar.', 'error');
            return false;
        }
        if (step === 2) {
            if (state.furnitureType === 'Guarda-Roupa') {
                const totalWidth = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
                const height = state.dimensions.height;
                if (totalWidth <= 0) {
                    const firstWidthInput = document.querySelector('#wardrobe-walls-container input[name="wardrobe-width"]');
                    showNotification('Por favor, preencha a largura do guarda-roupa.', 'error');
                    firstWidthInput?.focus();
                    firstWidthInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
                if (height <= 0) {
                    const heightInput = document.getElementById('wardrobe-height');
                    showNotification('Por favor, preencha a altura do guarda-roupa.', 'error');
                    heightInput?.focus();
                    heightInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
                if (state.wardrobeFormat === 'closet' && state.closetHasDoors === null) {
                    showNotification('Informe se o seu closet terá portas.', 'error');
                    return false;
                }
                const wallCount = state.dimensions.walls.filter(w => w.width > 0).length;
                if (state.wardrobeFormat === 'closet' && wallCount > 1 && state.closetHasCorner === null) {
                    showNotification('Informe se o projeto terá um módulo de canto.', 'error');
                    return false;
                }
            } else { // Cozinha
                const kitchenArea = state.dimensions.walls.reduce((acc, wall) => acc + (wall.width * wall.height), 0);
                if (state.kitchenScope === 'completa' && kitchenArea <= 0) {
                    const firstWidthInput = document.getElementById('kitchen-wall-width1');
                    showNotification('Por favor, adicione as medidas de pelo menos uma parede de armários.', 'error');
                    firstWidthInput?.focus();
                    firstWidthInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
                if (state.kitchenHasSinkCabinet === null) {
                    showNotification('Informe se o projeto incluirá um armário para a pia.', 'error');
                    return false;
                }
                if (state.kitchenHasSinkCabinet && state.kitchenScope === null) {
                    showNotification('Informe se o projeto terá apenas o armário da pia ou mais armários.', 'error');
                    return false;
                }
                if (state.hasHotTower === null) {
                    showNotification('Informe se o projeto terá Torre Quente.', 'error');
                    return false;
                }
                if (state.stoveType === null) {
                    showNotification('Por favor, escolha o tipo de fogão.', 'error');
                    return false;
                }
                if (state.kitchenScope === 'completa' && state.stoveType === 'cooktop' && state.cooktopLocation === null) {
                    showNotification('Informe onde o cooktop será instalado.', 'error');
                    return false;
                }
            }
        }
        if (step === 3 && !state.material) {
            showNotification('Por favor, escolha o material principal.', 'error');
            return false;
        }
        if (step === 4) {
            const isClosetOpen = state.wardrobeFormat === 'closet' && !state.closetHasDoors;
            if (state.furnitureType === 'Guarda-Roupa') {
                if (!isClosetOpen && !state.doorType) {
                    showNotification('Por favor, escolha o tipo de porta.', 'error');
                    return false;
                }
                if (!isClosetOpen && !state.handleType) {
                    showNotification('Por favor, escolha o tipo de puxador.', 'error');
                    return false;
                }
            } else { // Cozinha
                if (!state.handleType) {
                    showNotification('Por favor, escolha o tipo de puxador.', 'error');
                    return false;
                }
            }
            // Validação para tipo de ferragem
            if (!state.hardwareType) {
                showNotification('Por favor, escolha o tipo de acabamento interno (ferragens).', 'error');
                return false;
            }
        }
        if (step === 5 && !state.projectOption) {
            showNotification('Por favor, informe sobre o projeto 3D.', 'error');
            return false;
        }
        return true;
    }

    function getPanelCosts() {
        return {
            mdfBranco: parseFloat(document.getElementById('mdf-branco-cost').value) || 240,
            mdfPremium: parseFloat(document.getElementById('mdf-premium-cost').value) || 400,
            mdfFundo: parseFloat(document.getElementById('mdf-fundo-cost').value) || 140,
            edgeTapePerMeter: parseFloat(document.getElementById('edge-tape-cost').value) || 2.5,
            hingeStandard: parseFloat(document.getElementById('hinge-standard-cost').value) || 5,
            hingeSoftclose: parseFloat(document.getElementById('hinge-softclose-cost').value) || 20,
            slide: parseFloat(document.getElementById('slide-cost').value) || 25,
            handleAluminio: parseFloat(document.getElementById('handle-aluminio-cost').value) || 75,
            handleInoxCor: parseFloat(document.getElementById('handle-inox-cor-cost').value) || 100,
            handleConvencional: parseFloat(document.getElementById('handle-convencional-cost').value) || 15,
            multiplier: parseFloat(document.getElementById('cost-multiplier').value) || 2,
            discountExtra: parseFloat(document.getElementById('discount-extra').value) || 0,
            competitorPrice: parseFloat(document.getElementById('competitor-price').value) || 0
        };
    }

    function flashRecalculateButton() {
        const btn = document.getElementById('recalculate-btn');
        btn.classList.add('bg-green-500', 'animate-pulse');
        setTimeout(() => {
            btn.classList.remove('bg-green-500', 'animate-pulse');
        }, 1500);
    }
    async function recalculateAndRender() {
        try {
            state.quote = calculateQuote();
            renderResult();
            showNotification('Orçamento recalculado!', 'success');
        } catch (error) {
            console.error("Error recalculating quote:", error);
            showNotification('Ocorreu um erro ao recalcular o orçamento.', 'error');
        }
    }

    async function handleRecalculate() {
        const recalculateBtn = document.getElementById('recalculate-btn');
        const originalBtnHTML = recalculateBtn.innerHTML;
        recalculateBtn.disabled = true;
        recalculateBtn.innerHTML = '<div class="spinner mr-2"></div>Recalculando...';

        document.getElementById('marceneiro-controls').classList.add('-translate-x-full');
        document.getElementById('main-content').style.marginLeft = '0';
        await new Promise(resolve => setTimeout(resolve, 300));
        await recalculateAndRender();
        flashRecalculateButton();
        recalculateBtn.disabled = false;
        recalculateBtn.innerHTML = originalBtnHTML;

        // CORREÇÃO: Garante que o botão para abrir o painel reapareça.
        document.getElementById('toggle-controls-btn').classList.remove('hidden');
    }



    function updateWardrobeRecommendation() {
        const recommendationDiv = document.getElementById('wardrobe-recommendation');
        const recommendationText = document.getElementById('recommendation-text');
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);

        if (!recommendationDiv || !recommendationText || width <= 0) {
            if (recommendationDiv) recommendationDiv.classList.add('hidden');
            return;
        }

        const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);
        if (!hasDoors) {
            recommendationDiv.classList.add('hidden');
            return;
        }

        const hingedDoors = Math.max(2, Math.round(width / 0.50));
        const slidingDoors = Math.max(2, Math.round(width / 1.0));

        recommendationText.textContent = `Para esta largura, recomendamos aproximadamente ${hingedDoors} portas de abrir ou ${slidingDoors} portas de correr.`;
        recommendationDiv.classList.remove('hidden');
        updateContainerHeight();
    }

    function updateKitchenDrawerRecommendation() {
        if (state.furnitureType !== 'Cozinha') return;

        const recommendationDiv = document.getElementById('kitchen-drawer-recommendation');
        const recommendationText = document.getElementById('kitchen-drawer-recommendation-text');
        const totalWidth = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);

        if (!recommendationDiv || !recommendationText || totalWidth <= 0) {
            if (recommendationDiv) recommendationDiv.classList.add('hidden');
            return;
        }

        const minDrawers = Math.max(2, Math.floor(totalWidth * 2));
        const maxDrawers = Math.ceil(totalWidth * 3);

        recommendationText.textContent = `Para esta largura, recomendamos entre ${minDrawers} e ${maxDrawers} gavetas.`;
        recommendationDiv.classList.remove('hidden');
    }

    function updateDrawerRecommendation() {
        const recommendationDiv = document.getElementById('drawer-recommendation');
        const recommendationText = document.getElementById('drawer-recommendation-text');
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);

        if (!recommendationDiv || !recommendationText || width <= 0) {
            if (recommendationDiv) {
                recommendationDiv.classList.add('hidden');
            }
            return;
        }

        const minDrawers = Math.max(2, Math.floor(width * 2));
        const maxDrawers = Math.ceil(width * 3);

        recommendationText.textContent = `Para esta largura, recomendamos entre ${minDrawers} e ${maxDrawers} gavetas. O valor padrão é ${minDrawers}.`;
        recommendationDiv.classList.remove('hidden');
        document.getElementById('numDrawers').value = minDrawers;
        state.numDrawers = minDrawers;
    }

    function calculateEdgeTapeCost(parts, panelCosts) {
        const totalPerimeter = parts.reduce((acc, part) => acc + 2 * (part.w + part.h), 0) / 1000; // em metros
        const edgeTapeUsageFactor = 0.7; // Fator realista: assume que ~70% das bordas recebem fita.
        const edgeTapeCost = totalPerimeter * edgeTapeUsageFactor * panelCosts.edgeTapePerMeter;
        if (edgeTapeCost > 0) {
            return { label: 'Fita de Borda', quantity: Math.round(totalPerimeter * edgeTapeUsageFactor), cost: edgeTapeCost };
        }
        return null;
    }

    function calculateCommonExtrasCost(totalWidth) {
        const extras = [];
        if (state.projectOption === 'create') extras.push({ label: 'Criação do Projeto 3D', cost: SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D });
        return extras;
    }

    function calculateWardrobeQuote() {
        const panelCosts = getPanelCosts();

        const config = SIMULATOR_CONFIG.WARDROBE;

        const { height } = state.dimensions;
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        const frontArea = width * height;
        const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);

        let hingesPerDoor = 2; // Mínimo
        if (height > 1.5) hingesPerDoor = 3;
        if (height > 2.0) hingesPerDoor = 4;
        if (height > 2.5) hingesPerDoor = 5;

        let numDoors = 0;
        if (hasDoors) {
            if (state.doorType === 'correr') {
                numDoors = Math.max(2, Math.round(width / 1.0));
            } else { // 'abrir'
                numDoors = Math.max(2, Math.round(width / 0.50));
            }
        }

        const baseBreakdown = [];
        const extrasBreakdown = [];

        // 1. MDF Cost (com lógica para Mesclado)
        const { mdf15Parts: allParts, mdf3Parts: backAndBottomParts } = getWardrobeParts(state.dimensions.walls.map(w => ({ width: w.width * 1000, height: w.height * 1000 })), height * 1000, state.dimensions.depth * 10, state.numDrawers, hasDoors, numDoors, state.closetHasCorner);
        let sheets = [];

        if (state.material === 'Mesclada') {
            let premiumParts;
            let whiteParts;

            if (hasDoors) {
                premiumParts = allParts.filter(p => p.description.includes('Door'));
                whiteParts = allParts.filter(p => !p.description.includes('Door'));
            } else {
                premiumParts = allParts.filter(p => p.description.includes('Drawer Front'));
                whiteParts = allParts.filter(p => !p.description.includes('Drawer Front'));
            }

            const premiumSheets = optimizeCutting(premiumParts, 2750, 1850);
            const whiteSheets = optimizeCutting(whiteParts, 2750, 1850);
            
            const numPremiumSheets = premiumSheets.length;
            const numWhiteSheets = whiteSheets.length;

            if (numWhiteSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Branco (Interno)', quantity: numWhiteSheets, cost: numWhiteSheets * panelCosts.mdfBranco });
            if (numPremiumSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Premium (Frentes)', quantity: numPremiumSheets, cost: numPremiumSheets * panelCosts.mdfPremium });
            
            sheets = [...premiumSheets, ...whiteSheets];
        } else {
            sheets = optimizeCutting(allParts, 2750, 1850);
            const numSheets = sheets.length;
            const mdfCost = numSheets * (state.material === 'Branco' ? panelCosts.mdfBranco : panelCosts.mdfPremium);
            const materialLabel = state.material === 'Branco' ? 'Chapas de MDF Branco' : 'Chapas de MDF Premium';
            if (mdfCost > 0) baseBreakdown.push({ label: materialLabel, quantity: numSheets, cost: mdfCost });
        }

        state.quote.cuttingPlan = sheets;
        const totalMaterialArea = allParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000;

        const total3mmArea = backAndBottomParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000; // em m²
        const numBackPanelSheets = Math.ceil(total3mmArea / 5.09); // 5.09m² é a área da chapa

        if (numBackPanelSheets > 0) {
            baseBreakdown.push({ label: 'Chapas de Fundo (3mm)', quantity: numBackPanelSheets, cost: numBackPanelSheets * panelCosts.mdfFundo });
        }

        const numDrawers = state.numDrawers;
        const slideCost = numDrawers * panelCosts.slide;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        if (hasDoors) {
            if (state.doorType === 'abrir') {
                const totalHinges = numDoors * hingesPerDoor;
                const hingeCost = totalHinges * (state.hardwareType === 'softclose' ? panelCosts.hingeSoftclose : panelCosts.hingeStandard);
                const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
                if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });
            }

            if (state.handleType === 'convencional') {
                const cost = numDoors * panelCosts.handleConvencional;
                if (cost > 0) baseBreakdown.push({ label: `Puxadores Convencionais`, quantity: numDoors, cost: cost });
            } else { // Perfil Alumínio ou Inox/Cor
                const totalHandleLength = (state.doorType === 'correr' && numDoors >= 2) ? (2 * numDoors - 2) * height : numDoors * height;
                if (totalHandleLength > 0) {
                    const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
                    let handleCost = 0;
                    if (state.handleType === 'aluminio') handleCost = numBarsNeeded * panelCosts.handleAluminio;
                    if (state.handleType === 'inox_cor') handleCost = numBarsNeeded * panelCosts.handleInoxCor;
                    const label = state.handleType === 'aluminio' ? 'Barras de Puxador Perfil Alumínio' : 'Barras de Puxador Perfil (Inox/Cor)';
                    if (handleCost > 0) baseBreakdown.push({ label: label, quantity: numBarsNeeded, cost: handleCost });
                }
            }
        }

        const edgeTapeBreakdown = calculateEdgeTapeCost(allParts, panelCosts);
        if (edgeTapeBreakdown) baseBreakdown.push(edgeTapeBreakdown);

        extrasBreakdown.push(...calculateCommonExtrasCost(width));

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            if (cost > 0) extrasBreakdown.push({ label: extra, cost: cost });
        });

        return { baseBreakdown, extrasBreakdown, totalMaterialArea, cuttingPlan: sheets };
    }

    function calculateKitchenQuote() {
        const panelCosts = getPanelCosts();

        const config = SIMULATOR_CONFIG.KITCHEN;
        const baseBreakdown = []; // Renomeado para clareza
        const totalWidth = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        const numDrawers = state.numDrawers; // Usa o valor exato informado
        const extrasBreakdown = [];

        const { mdf15Parts: parts, mdf3Parts: backAndBottomParts } = getKitchenParts(state.dimensions.walls.map(wall => ({ width: wall.width * 1000, height: wall.height * 1000 })), numDrawers);

        let sheets = [];
        if (state.material === 'Mesclada') {
            const frontParts = parts.filter(p => p.description.includes('Door') || p.description.includes('Drawer Front'));
            const carcassParts = parts.filter(p => !p.description.includes('Door') && !p.description.includes('Drawer Front'));

            const premiumSheets = optimizeCutting(frontParts, 2750, 1850);
            const whiteSheets = optimizeCutting(carcassParts, 2750, 1850);

            if (whiteSheets.length > 0) {
                baseBreakdown.push({ label: 'Chapas de MDF Branco (Interno)', quantity: whiteSheets.length, cost: whiteSheets.length * panelCosts.mdfBranco });
            }
            if (premiumSheets.length > 0) {
                baseBreakdown.push({ label: 'Chapas de MDF Premium (Frentes)', quantity: premiumSheets.length, cost: premiumSheets.length * panelCosts.mdfPremium });
            }
            sheets = [...premiumSheets, ...whiteSheets];
        } else {
            sheets = optimizeCutting(parts, 2750, 1850);
            const mdfCost = sheets.length * (state.material === 'Branco' ? panelCosts.mdfBranco : panelCosts.mdfPremium);
            if (mdfCost > 0) baseBreakdown.push({ label: `Chapas de MDF ${state.material}`, quantity: sheets.length, cost: mdfCost });
        }

        state.quote.cuttingPlan = sheets;
        const totalMaterialArea = parts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000;

        // 1.5. Back Panel (Fundo) Cost for Kitchen - PRECISION IMPROVEMENT
        const total3mmArea = backAndBottomParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000; // em m²
        const numBackPanelSheets = Math.ceil(total3mmArea / 5.09); // 5.09m² é a área da chapa

        if (numBackPanelSheets > 0) {
            baseBreakdown.push({ label: 'Chapas de Fundo (3mm)', quantity: numBackPanelSheets, cost: numBackPanelSheets * panelCosts.mdfFundo });
        }

        if (state.kitchenHasSinkCabinet && state.sinkStoneWidth > 0) {
            const sinkCabinetWidth = Math.max(0, state.sinkStoneWidth - 0.05);
            const cost = sinkCabinetWidth * config.EXTRAS_COST.SINK_CABINET_PER_METER;
            if (cost > 0) extrasBreakdown.push({ label: 'Balcão de Pia', cost });
        }

        if (state.hasHotTower) {
            const hotTowerHeight = 2.2; // Use a fixed default height
            const cost = hotTowerHeight * config.EXTRAS_COST.HOT_TOWER_PER_METER;
            if (cost > 0) extrasBreakdown.push({ label: 'Torre Quente', cost });
        }

        // Contagem de portas a partir das peças geradas
        const numDoors = parts.filter(p => p.description.includes('Door')).length;

        const hingesPerDoor = 2;
        const totalHinges = numDoors * hingesPerDoor;
        const hingeCost = totalHinges * (state.hardwareType === 'softclose' ? panelCosts.hingeSoftclose : panelCosts.hingeStandard);
        const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
        if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });

        const slideCost = numDrawers * panelCosts.slide;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        // Kitchen handles are for both doors and drawers
        const totalHandleUnits = numDoors + numDrawers; 
        const UNIT_WIDTH = config.HARDWARE.UNIT_WIDTH;
        const totalHandleLength = totalHandleUnits * UNIT_WIDTH;
        const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);

        if (state.handleType === 'aluminio') {
            const cost = numBarsNeeded * panelCosts.handleAluminio;
            if (cost > 0) baseBreakdown.push({ label: 'Barras de Puxador Perfil Alumínio', quantity: numBarsNeeded, cost: cost });
        } else if (state.handleType === 'inox_cor') {
            const cost = numBarsNeeded * panelCosts.handleInoxCor;
            if (cost > 0) baseBreakdown.push({ label: `Barras de Puxador Perfil (Inox/Cor)`, quantity: numBarsNeeded, cost: cost });
        } else if (state.handleType === 'convencional') {
            const cost = totalHandleUnits * panelCosts.handleConvencional;
            if (cost > 0) baseBreakdown.push({ label: `Puxadores Convencionais`, quantity: totalHandleUnits, cost: cost });
        }

        // Edge Tape Cost
        const edgeTapeBreakdown = calculateEdgeTapeCost(parts, panelCosts);
        if (edgeTapeBreakdown) baseBreakdown.push(edgeTapeBreakdown);

        extrasBreakdown.push(...calculateCommonExtrasCost(totalWidth));

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            if (cost > 0) {
                extrasBreakdown.push({ label: extra, cost });
            }
        });

        return { baseBreakdown, extrasBreakdown, totalMaterialArea };
    }

    function calculateQuote() {
        let quoteDetails;
        if (state.furnitureType === 'Guarda-Roupa') {
            quoteDetails = calculateWardrobeQuote();
        } else { // Cozinha
            quoteDetails = calculateKitchenQuote();
        }
 
        const { baseBreakdown, extrasBreakdown, totalMaterialArea, cuttingPlan } = quoteDetails;
        const materialAndHardwareCost = baseBreakdown.reduce((acc, item) => acc + item.cost, 0);
        const extrasPrice = extrasBreakdown.reduce((acc, item) => acc + item.cost, 0);
 
        const panelCosts = getPanelCosts();
 
        const multipliedMaterialCost = materialAndHardwareCost * panelCosts.multiplier;
        const profitAmount = multipliedMaterialCost - materialAndHardwareCost;
        const costPrice = materialAndHardwareCost + extrasPrice + panelCosts.discountExtra; // Custo real (material + extras + ajuste)
        let finalTotal = multipliedMaterialCost + extrasPrice;
 
        // Desconto ou acréscimo
        finalTotal += panelCosts.discountExtra;
 
 
        const sheetSize = state.furnitureType === 'Cozinha' ? SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_SIZE : SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_SIZE;
 
        return {
            area: totalMaterialArea,
            sheets: Math.ceil(totalMaterialArea / sheetSize),
            total: finalTotal,
            costPrice: costPrice,
            profitAmount: profitAmount,
            basePrice: materialAndHardwareCost,
            baseBreakdown: baseBreakdown,
            extrasPrice: extrasPrice,
            extrasBreakdown: extrasBreakdown,
            discountExtra: panelCosts.discountExtra,
            competitorPrice: panelCosts.competitorPrice,
            cuttingPlan: cuttingPlan
        };
    }

    function resetState() {
        Object.assign(state, {
            quoteId: null,
            furnitureType: null,
            dimensions: { height: 2.75, depth: 60, walls: [{width: 3.0, height: 2.75}] },
            material: null,
            doorType: null,
            kitchenScope: null,
            wardrobeFormat: null,
            closetHasDoors: null,
            closetHasCorner: null,
            kitchenHasSinkCabinet: null,
            numDrawers: 4,
            sinkStoneWidth: 1.8,
            sinkCabinetWidth: 1.8,
            hasHotTower: null,
            stoveType: null,
            cooktopLocation: null,
            hardwareType: null,
            handleType: null,
            projectOption: null,
            projectFile: null,
            photos: [],
            customColor: '',
            extras: [],
            customer: {
                name: '', email: '', phone: '', cpf: '',
                cep: '', street: '', number: '', complement: '',
                neighborhood: '', city: '', state: ''
            },
            quote: { area: 0, sheets: 0, total: 0, basePrice: 0, costPrice: 0, profitAmount: 0, baseBreakdown: [], extrasPrice: 0, extrasBreakdown: [], competitorPrice: 0 }
        });
    }

    function resetFormUI() {
        document.querySelectorAll('#simulador input[type="radio"], #simulador input[type="checkbox"]').forEach(input => { input.checked = false; });

        document.getElementById('wardrobe-width1').value = 3.0;
        document.getElementById('wardrobe-height').value = 2.75;
        document.querySelectorAll('#wardrobe-walls-container input[name="wardrobe-width"]:not(#wardrobe-width1)').forEach(input => input.value = '0');
        document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');

        document.getElementById('sinkStoneWidth').value = 1.8;
        document.getElementById('cooktop-location-step').classList.add('hidden');
        document.getElementById('numDrawers').value = 4; // For wardrobe
        document.getElementById('kitchenNumDrawers').value = 4; // For kitchen
        document.getElementById('kitchen-wall-width1').value = 2.2;
        document.getElementById('kitchen-wall-height1').value = 2.75;

        document.getElementById('premium-options').classList.add('hidden');
        document.getElementById('customColor').value = '';
        document.getElementById('project-upload-container').classList.add('hidden');
        document.getElementById('project-file-input').value = '';
        document.getElementById('project-file-name').textContent = 'Escolher arquivo do projeto';
        document.getElementById('leadName').value = '';
        document.getElementById('leadEmail').value = '';
        document.getElementById('leadPhone').value = '';
        document.getElementById('leadCpf').value = '';
        document.getElementById('leadCep').value = '';
        document.getElementById('leadStreet').value = '';
        document.getElementById('leadNumber').value = '';
        document.getElementById('leadComplement').value = '';
        document.getElementById('leadNeighborhood').value = '';
        document.getElementById('leadCity').value = '';
        document.getElementById('leadState').value = '';
        document.getElementById('photo-previews').innerHTML = '';
        document.getElementById('competitor-price').value = 0;
    }

    async function handleViewQuote(isRecalculation = false) {
        const viewQuoteBtn = document.getElementById('view-quote-btn');
        const originalBtnText = viewQuoteBtn.innerHTML;
        const leadNameInput = document.getElementById('leadName');
        const leadPhoneInput = document.getElementById('leadPhone');
        const leadEmailInput = document.getElementById('leadEmail');

        [leadNameInput, leadPhoneInput, leadEmailInput].forEach(input => {
            input.classList.remove('invalid');
            input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
        });

        Object.assign(state.customer, {
            name: leadNameInput.value,
            email: leadEmailInput.value,
            phone: leadPhoneInput.value,
            cpf: document.getElementById('leadCpf').value,
            cep: document.getElementById('leadCep').value,
            street: document.getElementById('leadStreet').value,
            number: document.getElementById('leadNumber').value,
            complement: document.getElementById('leadComplement').value,
            neighborhood: document.getElementById('leadNeighborhood').value,
            city: document.getElementById('leadCity').value,
            state: document.getElementById('leadState').value,
        });

        if (!isRecalculation && !state.customer.name) {
            showNotification('Por favor, preencha o nome do cliente.', 'error');
            leadNameInput.classList.add('invalid');
            leadNameInput.focus();
            return;
        }

        const phoneDigits = state.customer.phone.replace(/\D/g, '');
        if (!isRecalculation && state.customer.phone && phoneDigits.length !== 11) {
            showNotification('Por favor, insira um WhatsApp válido com DDD (11 dígitos).', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        if (state.customer.cpf && !validateCpf(state.customer.cpf)) {
            showNotification('O CPF informado é inválido.', 'error');
            document.getElementById('leadCpf').classList.add('invalid');
            document.getElementById('leadCpf').focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (state.customer.email && !emailRegex.test(state.customer.email)) {
            showNotification('Por favor, insira um endereço de e-mail válido.', 'error');
            leadEmailInput.classList.add('invalid');
            leadEmailInput.focus();
            return;
        }

        viewQuoteBtn.disabled = true;
        viewQuoteBtn.innerHTML = '<div class="spinner mr-2"></div>Calculando...';

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            if (!state.hardwareType) {
                updateStateAndSave({ hardwareType: 'padrao' });
            }

            state.quote = calculateQuote();
            renderResult();
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight();

            const saveBtn = document.getElementById('save-quote-btn');
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Orçamento';
        } catch (error) {
            console.error("Error calculating quote:", error);
            showNotification('Ocorreu um erro ao calcular o orçamento. Tente novamente.', 'error');
        } finally {
            viewQuoteBtn.disabled = false;
            viewQuoteBtn.innerHTML = originalBtnText;
        }
    }

    function handlePhotoUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (e) => {
                const photoData = {
                    id: Date.now() + i,
                    src: e.target.result,
                    file: file
                };
                state.photos.push(photoData);
                renderPhotoPreviews();
            };

            reader.readAsDataURL(file);
        }
        event.target.value = '';
    }

    function renderPhotoPreviews() {
        const container = document.getElementById('photo-previews');
        container.innerHTML = '';
        state.photos.forEach(photo => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'relative w-24 h-24';
            previewDiv.innerHTML = `
                <img src="${photo.src}" class="w-full h-full object-cover rounded-lg shadow-md">
                <button class="remove-photo-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center" data-photo-id="${photo.id}">
                    <i class="fas fa-times text-xs"></i>
                </button>
            `;
            container.appendChild(previewDiv);
        });
        updateContainerHeight();
    }

    function handleRemovePhoto(event) {
        if (!event.target.closest('.remove-photo-btn')) return;
        const photoId = parseInt(event.target.closest('.remove-photo-btn').dataset.photoId);
        state.photos = state.photos.filter(p => p.id !== photoId);
        renderPhotoPreviews();
    }

    function validateCpf(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(10))) return false;
        return true;
    }

    async function handleCepLookup() {
        const cepInput = document.getElementById('leadCep');
        const cep = cepInput.value.replace(/\D/g, '');
        const lookupBtn = document.getElementById('cep-lookup-btn');
        const originalBtnHTML = lookupBtn.innerHTML;

        if (cep.length !== 8) {
            showNotification('Por favor, insira um CEP válido com 8 dígitos.', 'error');
            return;
        }

        lookupBtn.disabled = true;
        lookupBtn.innerHTML = '<div class="spinner-small"></div>';

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado.');
            
            const data = await response.json();
            if (data.erro) {
                showNotification('CEP não encontrado.', 'error');
            } else {
                document.getElementById('leadStreet').value = data.logradouro;
                document.getElementById('leadNeighborhood').value = data.bairro;
                document.getElementById('leadCity').value = data.localidade;
                document.getElementById('leadState').value = data.uf;
                document.getElementById('leadNumber').focus();
                showNotification('Endereço preenchido!', 'success');
            }
        } catch (error) {
            console.error("CEP lookup error:", error);
            showNotification('Erro ao buscar o CEP. Tente novamente.', 'error');
        } finally {
            lookupBtn.disabled = false;
            lookupBtn.innerHTML = originalBtnHTML;
            ['leadStreet', 'leadNeighborhood', 'leadCity', 'leadState'].forEach(id => {
                const el = document.getElementById(id);
                if (el.value) {
                    el.dispatchEvent(new Event('input'));
                }
            });
        }
    }

    async function handleLoadQuote(quoteId) {
        const quotes = getSavedQuotes();
        const quoteToLoad = quotes.find(q => q.quoteId === parseInt(quoteId));

        if (quoteToLoad) {
            // Deep copy to avoid modifying the saved object directly
            const loadedState = JSON.parse(JSON.stringify(quoteToLoad));
    
            Object.assign(state, loadedState);
    
            await updateFormFromState();
            
            currentStep = totalSteps;
            updateUI(false);
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight();

            showNotification(`Orçamento de "${state.customer.name}" carregado.`, "success");

            await recalculateAndRender(); 
            
            document.getElementById('marceneiro-controls').classList.add('-translate-x-full');
            document.getElementById('main-content').style.marginLeft = '0';
            document.getElementById('toggle-controls-btn').classList.remove('hidden');
        } else {
            showNotification("Orçamento não encontrado.", "error");
        }
    }

    async function handleDuplicateQuote(quoteId) {
        await handleLoadQuote(quoteId);
        // After loading, unset the ID and modify the name to indicate it's a copy
        state.quoteId = null;
        state.customer.name = `(Cópia) ${state.customer.name || ''}`;
        document.getElementById('leadName').value = state.customer.name;
        showNotification("Orçamento duplicado. Modifique e salve como um novo.", "info");
    }

    function updateFormFromState() {
        return new Promise(resolve => {
        document.querySelector(`input[name="furnitureType"][value="${state.furnitureType}"]`)?.click();

        if (state.furnitureType === 'Guarda-Roupa') {
            const wardrobeFormatRadio = document.querySelector(`input[name="wardrobeFormat"][value="${state.wardrobeFormat}"]`);
            if (wardrobeFormatRadio) wardrobeFormatRadio.click();

            if (state.wardrobeFormat === 'closet') {
                const closetDoorsRadio = document.querySelector(`input[name="closetDoors"][value="${state.closetHasDoors ? 'sim' : 'nao'}"]`);
                if (closetDoorsRadio) closetDoorsRadio.click();
            }
            document.getElementById('numDrawers').value = state.numDrawers || 4;

            if (state.closetHasCorner !== null) {
                const closetCornerRadio = document.querySelector(`input[name="closetCorner"][value="${state.closetHasCorner ? 'sim' : 'nao'}"]`);
                if (closetCornerRadio) closetCornerRadio.click();
            }
        } else { // Cozinha
            const kitchenSinkRadio = document.querySelector(`input[name="kitchenSink"][value="${state.kitchenHasSinkCabinet ? 'sim' : 'nao'}"]`);
            if (kitchenSinkRadio) kitchenSinkRadio.click();

            const hotTowerRadio = document.querySelector(`input[name="hasHotTower"][value="${state.hasHotTower ? 'sim' : 'nao'}"]`);
            if (hotTowerRadio) hotTowerRadio.click();

            const stoveTypeRadio = document.querySelector(`input[name="stoveType"][value="${state.stoveType}"]`);
            document.getElementById('sinkCabinetWidth').value = state.sinkCabinetWidth;
            if (stoveTypeRadio) stoveTypeRadio.click();

            if (state.stoveType === 'cooktop') {
                const cooktopLocationRadio = document.querySelector(`input[name="cooktopLocation"][value="${state.cooktopLocation}"]`);
                if (cooktopLocationRadio) cooktopLocationRadio.click();
            }
            document.getElementById('kitchenNumDrawers').value = state.numDrawers || 4;
        }

        // Step 4: Extras
        if (state.doorType) {
            const doorTypeRadio = document.querySelector(`input[name="doorType"][value="${state.doorType}"]`);
            if (handleTypeRadio) handleTypeRadio.click();
        }

        // Step 3: Material (can be done after UI is stable)
        document.querySelector(`input[name="material"][value="${state.material}"]`)?.click();

        document.querySelector(`input[name="projectOption"][value="${state.projectOption}"]`)?.click();

            setTimeout(() => {
                if (state.furnitureType === 'Guarda-Roupa') {
                    const wardrobeWallsContainer = document.getElementById('wardrobe-walls-container');
                    while (wardrobeWallsContainer.children.length > 1) {
                        wardrobeWallsContainer.lastChild.remove();
                    }
                    if (state.dimensions.walls && state.dimensions.walls.length > 1) {
                        state.dimensions.walls.slice(1).forEach(() => addWardrobeWall());
                    }
                    document.querySelectorAll('#wardrobe-walls-container input[name="wardrobe-width"]').forEach((input, i) => {
                        input.value = state.dimensions.walls[i]?.width || 0;
                    });
                    document.getElementById('wardrobe-height').value = state.dimensions.height || 2.75;
                } else { // Cozinha
                    document.getElementById('sinkStoneWidth').value = state.sinkStoneWidth;
                    const kitchenWallsContainer = document.getElementById('kitchen-walls-container');
                    while (kitchenWallsContainer.children.length > 1) {
                        kitchenWallsContainer.lastChild.remove();
                    }
                    if (state.dimensions.walls && state.dimensions.walls.length > 1) {
                        state.dimensions.walls.slice(1).forEach(() => addKitchenWall());
                    }
                    document.querySelectorAll('input[name="kitchen-wall-width"]').forEach((input, i) => input.value = state.dimensions.walls[i]?.width || 0);
                    document.querySelectorAll('input[name="kitchen-wall-height"]').forEach((input, i) => input.value = state.dimensions.walls[i]?.height || 0);
                }
                document.querySelector(`input[name="material"][value="${state.material}"]`)?.click();
                document.getElementById('customColor').value = state.customColor;

                state.extras.forEach(extra => {
                    const checkbox = document.querySelector(`input[name="extras"][value="${extra}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                document.getElementById('leadName').value = state.customer.name;
                document.getElementById('leadEmail').value = state.customer.email;
                document.getElementById('leadPhone').value = state.customer.phone;
                document.getElementById('leadCpf').value = state.customer.cpf || '';
                document.getElementById('leadCep').value = state.customer.cep || '';
                document.getElementById('leadStreet').value = state.customer.street || '';
                document.getElementById('leadNumber').value = state.customer.number || '';
                document.getElementById('leadComplement').value = state.customer.complement || '';
                document.getElementById('leadNeighborhood').value = state.customer.neighborhood || '';
                document.getElementById('leadCity').value = state.customer.city || '';
                document.getElementById('leadState').value = state.customer.state || '';

                // Restore photos
                renderPhotoPreviews();
                document.getElementById('competitor-price').value = state.quote.competitorPrice || 0;

                resolve();
            }, 100); // Aumentado para 100ms para garantir a renderização completa da UI.
        });
    }

    function renderResult() {
        const specsContainer = document.getElementById('result-specs');
        if (!specsContainer) return;

        specsContainer.innerHTML = '';

        const createSpecCard = (icon, label, value) => {
            if (!value) return ''; // Don't create a card if the value is null/empty
            return `
                <div class="spec-card">
                    <i class="fas ${icon} text-2xl text-gold mb-2"></i>
                    <span class="text-xs text-gray-500">${label}</span>
                    <p class="font-bold text-charcoal">${value}</p>
                </div>
            `;
        };

        let specsHTML = '';
        specsHTML += createSpecCard('fa-couch', 'Móvel', state.furnitureType);

        let dimsText = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            dimsText = `Paredes: ${state.dimensions.walls.map(w => w.width).join('m + ')}m | Altura: ${state.dimensions.height}m`;
        } else { // Cozinha
            dimsText = state.dimensions.walls.map(w => `${w.width}m x ${w.height}m`).join(' | ');
        }
        specsHTML += createSpecCard('fa-ruler-combined', 'Dimensões', dimsText);
        specsHTML += createSpecCard('fa-palette', 'Material', state.material);

        // Wardrobe specific details
        if (state.furnitureType === 'Guarda-Roupa') {
            let formatText = state.wardrobeFormat === 'reto' ? 'Reto' : 'Closet';
            if (state.wardrobeFormat === 'closet') {
                formatText += state.closetHasDoors ? ' (Fechado)' : ' (Aberto)';
            }
            if (state.closetHasCorner) {
                formatText += ' com Canto';
            }
            specsHTML += createSpecCard('fa-vector-square', 'Formato', formatText);

            const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);
            if (hasDoors) {
                specsHTML += createSpecCard('fa-door-open', 'Portas', state.doorType === 'abrir' ? 'De Abrir' : 'De Correr');
            }
        }

        // Common details
        const hasDoors = state.furnitureType === 'Cozinha' || (state.wardrobeFormat === 'reto' || (state.wardrobeFormat === 'closet' && state.closetHasDoors));
        if (hasDoors) {
            specsHTML += createSpecCard('fa-grip-horizontal', 'Puxador', `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
        }
        specsHTML += createSpecCard('fa-cogs', 'Ferragens', state.hardwareType === 'padrao' ? 'Padrão' : 'Soft-close');

        const extrasText = state.extras.length > 0 ? state.extras.join(', ') : 'Nenhum';
        specsHTML += createSpecCard('fa-plus-circle', 'Extras', extrasText);

        specsContainer.innerHTML = specsHTML;

        // Update total and breakdown
        const breakdownContainer = document.getElementById('result-breakdown');
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        document.getElementById('result-total').textContent = formatCurrency(state.quote.total);
        document.getElementById('result-cost-price').textContent = formatCurrency(state.quote.costPrice);
        document.getElementById('result-profit').textContent = formatCurrency(state.quote.profitAmount);

        breakdownContainer.innerHTML = '';
        let breakdownHTML = '';

        if (state.quote.baseBreakdown && state.quote.baseBreakdown.length > 0) {
            breakdownHTML += '<h5 class="font-semibold text-charcoal mb-2">Componentes do Projeto:</h5><div class="pl-4 border-l-2 border-gold/50 space-y-2">';
            state.quote.baseBreakdown.forEach(item => {
                const quantityText = item.quantity ? `<span class="text-gray-500 text-xs">(Qtd. Aprox: ${item.quantity})</span>` : '';
                breakdownHTML += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">${item.label} ${quantityText}</span>
                        <span class="font-semibold text-charcoal">${formatCurrency(item.cost)}</span>
                    </div>
                `;
            });
            breakdownHTML += '</div>';
        }

        if (state.quote.extrasBreakdown && state.quote.extrasBreakdown.length > 0) {
            breakdownHTML += '<h5 class="font-semibold text-charcoal mb-2 mt-4">Acabamentos e Personalização:</h5><div class="pl-4 border-l-2 border-gold/50 space-y-2">';
            state.quote.extrasBreakdown.forEach(item => {
                breakdownHTML += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">${item.label}</span>
                        <span class="font-semibold text-charcoal">+ ${formatCurrency(item.cost)}</span>
                    </div>
                `;
            });
            breakdownHTML += '</div>';
        }

        // Desconto/acréscimo
        if (state.quote.discountExtra && state.quote.discountExtra !== 0) {
            breakdownHTML += `<div class="flex justify-between items-center text-sm mt-4">
                <span class="text-gray-600">Desconto/Acréscimo</span>
                <span class="font-semibold text-blue-700">${state.quote.discountExtra > 0 ? '+' : ''}${formatCurrency(state.quote.discountExtra)}</span>
            </div>`;
        }

        // Comparativo de materiais
        breakdownHTML += '<div class="mt-6 p-4 bg-gray-50 rounded-lg"><h5 class="font-semibold text-charcoal mb-2">Comparativo de Materiais:</h5>';
        const mdfBranco = document.getElementById('mdf-branco-cost').value;
        const mdfPremium = document.getElementById('mdf-premium-cost').value;
        breakdownHTML += `<div class="flex justify-between text-sm"><span>MDF Branco</span><span class="font-semibold">${formatCurrency(Number(mdfBranco))} / chapa</span></div>`;
        breakdownHTML += `<div class="flex justify-between text-sm"><span>MDF Premium</span><span class="font-semibold">${formatCurrency(Number(mdfPremium))} / chapa</span></div>`;
        breakdownHTML += '</div>';

        // Análise da concorrência
        const competitorCard = document.getElementById('competitor-analysis-card');
        const competitorResult = document.getElementById('competitor-analysis-result');
        if (state.quote.competitorPrice > 0) {
            competitorCard.classList.remove('hidden');
            const difference = state.quote.total - state.quote.competitorPrice;
            const percentageDiff = (difference / state.quote.competitorPrice) * 100;

            if (percentageDiff > 0) {
                competitorResult.textContent = `+${percentageDiff.toFixed(1)}%`;
                competitorResult.className = 'font-montserrat font-bold text-3xl text-red-600 my-2'; // Mais caro
            } else {
                competitorResult.textContent = `${percentageDiff.toFixed(1)}%`;
                competitorResult.className = 'font-montserrat font-bold text-3xl text-green-600 my-2'; // Mais barato
            }
        } else {
            competitorCard.classList.add('hidden');
        }

        breakdownContainer.innerHTML = breakdownHTML;

        // A seção do plano de corte foi removida da tela para manter a interface limpa.
    }

    function renderSavedQuotes(searchTerm = '') {
        const listContainer = document.getElementById('saved-quotes-list');
        const quotes = getSavedQuotes();
        const filteredQuotes = quotes.filter(q => 
            q.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredQuotes.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">Nenhum orçamento salvo.</p>';
            return;
        }

        listContainer.innerHTML = filteredQuotes.map(q => {
            const quoteDate = new Date(q.quoteId).toLocaleDateString('pt-BR');
            const quoteTotal = q.quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `
                <div class="bg-gray-800 p-3 rounded-lg border-l-4 border-transparent hover:border-gold transition-all" data-quote-id="${q.quoteId}">
                    <div class="flex justify-between items-center">
                        <div class="flex-grow overflow-hidden">
                            <p class="font-semibold text-white truncate">${q.customer.name}</p>
                            <div class="flex items-center gap-x-3 text-xs text-gray-400 mt-1">
                                <span><i class="fas fa-calendar-alt fa-fw mr-1"></i>${quoteDate}</span>
                                <span class="font-bold text-gold">${quoteTotal}</span>
                            </div>
                        </div>
                        <div class="flex-shrink-0 flex items-center gap-1">
                            <button class="quote-action-btn text-blue-400 hover:bg-blue-500/20 load-quote-btn" title="Carregar"><i class="fas fa-folder-open"></i></button>
                            <button class="quote-action-btn text-green-400 hover:bg-green-500/20 duplicate-quote-btn" title="Duplicar"><i class="fas fa-copy"></i></button>
                            <button class="quote-action-btn text-red-400 hover:bg-red-500/20 delete-quote-btn" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getQuoteAsText() {
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        let dimsText = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            dimsText = `Paredes: ${state.dimensions.walls.map(w => w.width).join('m + ')}m | Altura: ${state.dimensions.height}m`;
        } else { // Cozinha
            dimsText = state.dimensions.walls.map(w => `${w.width}m x ${w.height}m`).join(' | ');
        }
        let details = `*Dimensões:* ${dimsText}`;
        let kitchenDetails = '';
        let formatDetails = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            if (state.wardrobeFormat === 'closet') {
                formatDetails = `\n*Formato:* Closet ${state.closetHasDoors ? 'Fechado' : 'Aberto'}`;
            }
            if (state.closetHasDoors) {
                formatDetails += `\n*Tipo de Porta:* ${state.doorType === 'abrir' ? 'De Abrir' : 'De Correr'}`;
            }
        } else { // Cozinha
            if (state.kitchenHasSinkCabinet) {
                kitchenDetails = `\n*Armário de Pia:* Sim (para pedra de ${state.sinkStoneWidth}m)`;
            }
            if (state.hasHotTower) {
                kitchenDetails += `\n*Torre Quente:* Sim`;
            }
            if (state.stoveType === 'cooktop') {
                const location = state.cooktopLocation === 'pia' ? 'na pedra da pia' : 'em bancada separada';
                kitchenDetails += `\n*Tipo de Fogão:* Cooktop (${location})`;
            } else {
                kitchenDetails += `\n*Tipo de Fogão:* De Piso`;
            }
        }

        let projectDetails = '';
        if (state.projectOption === 'create') projectDetails = '\n*Projeto 3D:* Sim (incluso no valor)';
        if (state.projectOption === 'upload' && state.projectFile) projectDetails = '\n*Projeto 3D:* Cliente anexou o arquivo.';
        if (state.projectOption === 'upload' && !state.projectFile) projectDetails = '\n*Projeto 3D:* Cliente informou que tem o projeto.';

        let handleName = 'Não aplicável';
        if (state.handleType === 'aluminio') {
            handleName = 'Perfil Alumínio';
        } else if (state.handleType === 'inox_cor') {
            handleName = 'Perfil Inox/Cor';
        } else if (state.handleType === 'convencional') {
            handleName = 'Convencional';
        }

        // Cria uma descrição de material mais detalhada e vendedora
        let materialDescription = '';
        if (state.material === 'Branco') materialDescription = 'Projeto 100% em MDF Branco TX.';
        if (state.material === 'Mesclada') materialDescription = `Estrutura interna em MDF Branco e frentes no padrão *${state.customColor || 'a definir'}*.`;
        if (state.material === 'Premium') materialDescription = `Projeto 100% no padrão MDF Premium *${state.customColor || 'a definir'}*.`;

        const hardwareDescription = state.hardwareType === 'softclose' 
            ? 'Dobradiças com amortecimento (soft-close).'
            : 'Ferragens de alta resistência.';

        // Memorial Descritivo para agregar valor técnico e profissional
        const descriptiveMemorial = `
*Memorial Descritivo do Projeto:*
- *Material:* ${materialDescription}
- *Acabamento Interno:* ${hardwareDescription}
- *Puxadores:* ${handleName}.
- *Itens Adicionais:* ${state.extras.join(', ') || 'Nenhum'}.
`;

        const servicesIncluded = `
*Serviços e Garantia:*
Sua proposta inclui nossa consultoria completa, visita técnica para medição de precisão, entrega, montagem por equipe própria e a limpeza do ambiente após a instalação. Oferecemos garantia total de 5 anos para móveis e ferragens.
`;

        // Mensagem final com uma chamada para ação mais forte
        const closingMessage = `
*Proposta de Investimento: ${formatCurrency(state.quote.total)}*

Esta proposta foi elaborada para oferecer a melhor combinação de qualidade, design e durabilidade. Para garantir estas condições, basta me confirmar por aqui para formalizarmos o seu pedido. Fico à disposição!
`;

        return `*Proposta de Móveis Planejados*\n---------------------------------\n*Cliente:* ${state.customer.name}\n*Móvel:* ${state.furnitureType}${formatDetails}${kitchenDetails}\n${details}${projectDetails}\n---------------------------------\n${descriptiveMemorial}\n${servicesIncluded}\n---------------------------------\n${closingMessage}`;
    }

    async function generatePDF(type = 'client') {
        let pdfBtn;
        if (type === 'internal') {
            pdfBtn = document.getElementById('pdf-btn-internal');
        } else if (type === 'client') {
            pdfBtn = document.getElementById('pdf-btn-client');
        } else if (type === 'contract') {
            pdfBtn = document.getElementById('pdf-btn-contract');
        }

        if (!pdfBtn) return;

        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Preparando...';

        const quoteId = state.quoteId || Date.now().toString().slice(-6);
        document.getElementById('pdf-quote-id').textContent = quoteId;
        document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('pt-BR');
        
        document.getElementById('pdf-name').textContent = state.customer.name;
        document.getElementById('pdf-email').textContent = state.customer.email || 'Não informado';
        document.getElementById('pdf-phone').textContent = state.customer.phone;

        // Populate Address and CPF
        const addressBlock = document.getElementById('pdf-address-block');
        if (state.customer.street || state.customer.cpf) {
            addressBlock.classList.remove('hidden');
            document.getElementById('pdf-cpf').textContent = state.customer.cpf ? `CPF: ${state.customer.cpf}` : '';
            const addressLine1 = `${state.customer.street || ''}${state.customer.number ? ', ' + state.customer.number : ''}`;
            const addressLine2 = `${state.customer.neighborhood || ''}${state.customer.city ? ' - ' + state.customer.city : ''}${state.customer.state ? '/' + state.customer.state : ''}`;
            document.getElementById('pdf-address-line1').textContent = addressLine1.trim() === ',' ? '' : addressLine1;
            document.getElementById('pdf-address-line2').textContent = addressLine2.trim() === '-/' ? '' : addressLine2;
        } else {
            addressBlock.classList.add('hidden');
        }

        // Populate Specs Table
        const specsContainer = document.getElementById('pdf-specs-table');
        specsContainer.innerHTML = ''; // Clear previous
        const createSpecRow = (label, value) => {
            if (!value) return '';
            return `<div class="pdf-spec-item"><span>${label}:</span> <span class="font-bold">${value}</span></div>`;
        };
        
        let specsHTML = '';
        specsHTML += createSpecRow('Tipo de Móvel', state.furnitureType);
        
        let dimsText = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            dimsText = `Paredes: ${state.dimensions.walls.map(w => w.width).join('m + ')}m | Altura: ${state.dimensions.height}m`;
        } else { // Cozinha
            dimsText = state.dimensions.walls.map(w => `${w.width}m x ${w.height}m`).join(' | ');
        }
        specsHTML += createSpecRow('Dimensões', dimsText);
        specsHTML += createSpecRow('Material', state.material);
        if (state.customColor && (state.material === 'Premium' || state.material === 'Mesclada')) {
            specsHTML += createSpecRow('Cor Personalizada', state.customColor);
        }
        const hasDoors = state.furnitureType === 'Cozinha' || (state.wardrobeFormat === 'reto' || (state.wardrobeFormat === 'closet' && state.closetHasDoors));
        if (hasDoors) {
            specsHTML += createSpecRow('Tipo de Porta', state.doorType === 'abrir' ? 'De Abrir' : 'De Correr');
            specsHTML += createSpecRow('Puxador', `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
        }
        specsHTML += createSpecRow('Ferragens', state.hardwareType === 'padrao' ? 'Padrão' : 'Soft-close');
        specsHTML += createSpecRow('Projeto 3D', state.projectOption === 'create' ? 'Sim' : (state.projectOption === 'upload' ? 'Fornecido pelo cliente' : 'Não'));
        if (state.extras.length > 0) {
            specsHTML += createSpecRow('Adicionais', state.extras.join(', '));
        }
        specsContainer.innerHTML = specsHTML;

        // Populate Pricing
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const extrasContainer = document.getElementById('pdf-extras-breakdown');

        if (type === 'internal') {
            document.getElementById('pdf-doc-title').textContent = 'ORDEM DE SERVIÇO';
            document.getElementById('pdf-pricing-title').textContent = 'Detalhamento de Custos e Lucro';
            document.getElementById('pdf-cost-section').classList.remove('hidden');
            document.getElementById('pdf-contract-clauses').classList.add('hidden');
            document.getElementById('pdf-signature-section').classList.add('hidden');
            document.getElementById('pdf-total-label').textContent = 'PREÇO FINAL (CLIENTE)';

            document.getElementById('pdf-base-price').textContent = formatCurrency(state.quote.costPrice);
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            let pdfBreakdownHTML = '';

            // Full breakdown for internal PDF
            if (state.quote.baseBreakdown?.length) {
                pdfBreakdownHTML += '<h3>Custos Base:</h3>';
                state.quote.baseBreakdown.forEach(item => {
                    pdfBreakdownHTML += `<div class="pdf-price-row text-sm"><span>${item.label}</span><span class="font-bold">${formatCurrency(item.cost)}</span></div>`;
                });
            }
            if (state.quote.extrasBreakdown?.length) {
                pdfBreakdownHTML += '<h3 style="margin-top: 8mm;">Custos de Acabamentos e Despesas:</h3>';
                state.quote.extrasBreakdown.forEach(item => {
                    pdfBreakdownHTML += `<div class="pdf-price-row text-sm"><span>${item.label}</span><span class="font-bold">+ ${formatCurrency(item.cost)}</span></div>`;
                });
            }
            extrasContainer.innerHTML = pdfBreakdownHTML;

        } else if (type === 'client') {
            document.getElementById('pdf-doc-title').textContent = 'ORÇAMENTO';
            document.getElementById('pdf-pricing-title').textContent = 'Valor do Investimento';
            document.getElementById('pdf-cost-section').classList.add('hidden');
            document.getElementById('pdf-contract-clauses').classList.add('hidden');
            document.getElementById('pdf-signature-section').classList.add('hidden');
            document.getElementById('pdf-total-label').textContent = 'VALOR TOTAL';
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            extrasContainer.innerHTML = '<p class="text-sm">Serviços como visita técnica, entrega, montagem e garantia de 5 anos estão inclusos.</p>';
        } else { // Contract PDF
            document.getElementById('pdf-doc-title').textContent = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
            document.getElementById('pdf-pricing-title').textContent = 'Valor do Investimento';
            document.getElementById('pdf-cost-section').classList.add('hidden');
            document.getElementById('pdf-contract-clauses').classList.remove('hidden');
            document.getElementById('pdf-signature-section').classList.remove('hidden');
            document.getElementById('pdf-total-label').textContent = 'VALOR TOTAL';
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            document.getElementById('pdf-contract-total').textContent = formatCurrency(state.quote.total);
            document.getElementById('pdf-signature-client-name').textContent = state.customer.name;
            extrasContainer.innerHTML = '<p class="text-sm">As especificações detalhadas do projeto estão descritas acima.</p>';
        }

        // --- Add Photos to PDF ---
        const photosSection = document.getElementById('pdf-photos-section');
        const photosContainer = document.getElementById('pdf-photos-container');
        photosContainer.innerHTML = '';
        if (state.photos && state.photos.length > 0) {
            photosSection.classList.remove('hidden');
            state.photos.forEach(photo => {
                const imgElement = document.createElement('img');
                imgElement.src = photo.src;
                imgElement.className = 'w-full object-contain border rounded-lg';
                photosContainer.appendChild(imgElement);
            });
        } else {
            photosSection.classList.add('hidden');
        }

        return { pdfBtn, originalBtnHTML, quoteId };
    }

    function populatePdfTemplate(type) {
        let pdfBtn;
        if (type === 'internal') {
            pdfBtn = document.getElementById('pdf-btn-internal');
        } else if (type === 'client') {
            pdfBtn = document.getElementById('pdf-btn-client');
        } else if (type === 'contract') {
            pdfBtn = document.getElementById('pdf-btn-contract');
        }

        if (!pdfBtn) return {};

        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Preparando...';

        const quoteId = state.quoteId || Date.now().toString().slice(-6);
        document.getElementById('pdf-quote-id').textContent = quoteId;
        document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('pt-BR');
        
        document.getElementById('pdf-name').textContent = state.customer.name;
        document.getElementById('pdf-email').textContent = state.customer.email || 'Não informado';
        document.getElementById('pdf-phone').textContent = state.customer.phone;

        // Populate Address and CPF
        const addressBlock = document.getElementById('pdf-address-block');
        if (state.customer.street || state.customer.cpf) {
            addressBlock.classList.remove('hidden');
            document.getElementById('pdf-cpf').textContent = state.customer.cpf ? `CPF: ${state.customer.cpf}` : '';
            const addressLine1 = `${state.customer.street || ''}${state.customer.number ? ', ' + state.customer.number : ''}`;
            const addressLine2 = `${state.customer.neighborhood || ''}${state.customer.city ? ' - ' + state.customer.city : ''}${state.customer.state ? '/' + state.customer.state : ''}`;
            document.getElementById('pdf-address-line1').textContent = addressLine1.trim() === ',' ? '' : addressLine1;
            document.getElementById('pdf-address-line2').textContent = addressLine2.trim() === '-/' ? '' : addressLine2;
        } else {
            addressBlock.classList.add('hidden');
        }

        // Populate Specs Table
        const specsContainer = document.getElementById('pdf-specs-table');
        specsContainer.innerHTML = ''; // Clear previous
        const createSpecRow = (label, value) => {
            if (!value) return '';
            return `<div class="pdf-spec-item"><span>${label}:</span> <span class="font-bold">${value}</span></div>`;
        };
        
        let specsHTML = '';
        specsHTML += createSpecRow('Tipo de Móvel', state.furnitureType);
        
        let dimsText = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            dimsText = `Paredes: ${state.dimensions.walls.map(w => w.width).join('m + ')}m | Altura: ${state.dimensions.height}m`;
        } else { // Cozinha
            dimsText = state.dimensions.walls.map(w => `${w.width}m x ${w.height}m`).join(' | ');
        }
        specsHTML += createSpecRow('Dimensões', dimsText);
        specsHTML += createSpecRow('Material', state.material);
        if (state.customColor && (state.material === 'Premium' || state.material === 'Mesclada')) {
            specsHTML += createSpecRow('Cor Personalizada', state.customColor);
        }
        const hasDoors = state.furnitureType === 'Cozinha' || (state.wardrobeFormat === 'reto' || (state.wardrobeFormat === 'closet' && state.closetHasDoors));
        if (hasDoors) {
            specsHTML += createSpecRow('Tipo de Porta', state.doorType === 'abrir' ? 'De Abrir' : 'De Correr');
            specsHTML += createSpecRow('Puxador', `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
        }
        specsHTML += createSpecRow('Ferragens', state.hardwareType === 'padrao' ? 'Padrão' : 'Soft-close');
        specsHTML += createSpecRow('Projeto 3D', state.projectOption === 'create' ? 'Sim' : (state.projectOption === 'upload' ? 'Fornecido pelo cliente' : 'Não'));
        if (state.extras.length > 0) {
            specsHTML += createSpecRow('Adicionais', state.extras.join(', '));
        }
        specsContainer.innerHTML = specsHTML;

        // Populate Pricing
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const extrasContainer = document.getElementById('pdf-extras-breakdown');

        if (type === 'internal') {
            document.getElementById('pdf-doc-title').textContent = 'ORDEM DE SERVIÇO';
            document.getElementById('pdf-pricing-title').textContent = 'Detalhamento de Custos e Lucro';
            document.getElementById('pdf-cost-section').classList.remove('hidden');
            document.getElementById('pdf-contract-clauses').classList.add('hidden');
            document.getElementById('pdf-signature-section').classList.add('hidden');
            document.getElementById('pdf-total-label').textContent = 'PREÇO FINAL (CLIENTE)';

            document.getElementById('pdf-base-price').textContent = formatCurrency(state.quote.costPrice);
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            let pdfBreakdownHTML = '';

            // Full breakdown for internal PDF
            if (state.quote.baseBreakdown?.length) {
                pdfBreakdownHTML += '<h3>Custos Base:</h3>';
                state.quote.baseBreakdown.forEach(item => {
                    pdfBreakdownHTML += `<div class="pdf-price-row text-sm"><span>${item.label}</span><span class="font-bold">${formatCurrency(item.cost)}</span></div>`;
                });
            }
            if (state.quote.extrasBreakdown?.length) {
                pdfBreakdownHTML += '<h3 style="margin-top: 8mm;">Custos de Acabamentos e Despesas:</h3>';
                state.quote.extrasBreakdown.forEach(item => {
                    pdfBreakdownHTML += `<div class="pdf-price-row text-sm"><span>${item.label}</span><span class="font-bold">+ ${formatCurrency(item.cost)}</span></div>`;
                });
            }
            extrasContainer.innerHTML = pdfBreakdownHTML;

        } else if (type === 'client') {
            document.getElementById('pdf-doc-title').textContent = 'ORÇAMENTO';
            document.getElementById('pdf-pricing-title').textContent = 'Valor do Investimento';
            document.getElementById('pdf-cost-section').classList.add('hidden');
            document.getElementById('pdf-contract-clauses').classList.add('hidden');
            document.getElementById('pdf-signature-section').classList.add('hidden');
            document.getElementById('pdf-total-label').textContent = 'VALOR TOTAL';
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            extrasContainer.innerHTML = '<p class="text-sm">Serviços como visita técnica, entrega, montagem e garantia de 5 anos estão inclusos.</p>';
        } else { // Contract PDF
            document.getElementById('pdf-doc-title').textContent = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
            document.getElementById('pdf-pricing-title').textContent = 'Valor do Investimento';
            document.getElementById('pdf-cost-section').classList.add('hidden');
            document.getElementById('pdf-contract-clauses').classList.remove('hidden');
            document.getElementById('pdf-signature-section').classList.remove('hidden');
            document.getElementById('pdf-total-label').textContent = 'VALOR TOTAL';
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
            document.getElementById('pdf-contract-total').textContent = formatCurrency(state.quote.total);
            document.getElementById('pdf-signature-client-name').textContent = state.customer.name;
            extrasContainer.innerHTML = '<p class="text-sm">As especificações detalhadas do projeto estão descritas acima.</p>';
        }

        // --- Add Photos to PDF ---
        const photosSection = document.getElementById('pdf-photos-section');
        const photosContainer = document.getElementById('pdf-photos-container');
        photosContainer.innerHTML = '';
        if (state.photos && state.photos.length > 0) {
            photosSection.classList.remove('hidden');
            state.photos.forEach(photo => {
                const imgElement = document.createElement('img');
                imgElement.src = photo.src;
                imgElement.className = 'w-full object-contain border rounded-lg';
                photosContainer.appendChild(imgElement);
            });
        } else {
            photosSection.classList.add('hidden');
        }

        return { pdfBtn, originalBtnHTML, quoteId };
    }

    async function generatePDF(type = 'client') {
        const { pdfBtn, originalBtnHTML, quoteId } = populatePdfTemplate(type);
        if (!pdfBtn) return;

        try {
            const { jsPDF } = window.jspdf;
            const pdfTemplate = document.getElementById('pdf-template');
            pdfTemplate.classList.remove('hidden');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
    
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10; // Margem de 10mm
            const contentWidth = pageW - (margin * 2);
            const pageContentHeight = pageH - (margin * 2);
            let cursorY = margin;

            const container = pdfTemplate.querySelector('.pdf-container');

            // Renderiza o container inteiro de uma vez para manter o layout e evitar linhas
            const canvas = await html2canvas(container, {
                scale: 3, // Aumenta a resolução para melhor qualidade
                useCORS: true,
                logging: false,
                windowWidth: container.scrollWidth,
                windowHeight: container.scrollHeight
            });
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
            heightLeft -= pageContentHeight;

            while (heightLeft > 0) {
                position -= pageContentHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
                heightLeft -= pageContentHeight;
            }

            const fileName = `orcamento_${type}_${(state.customer.name || 'cliente').replace(/\s/g, '_')}_${quoteId}.pdf`;
            pdf.save(fileName);
    
            pdfTemplate.classList.add('hidden');
        } catch (error) {
            console.error("PDF Generation Error:", error);
            showNotification("Erro ao gerar o PDF. Tente novamente.", "error");
        } finally {
            pdfBtn.disabled = false;
            pdfBtn.innerHTML = originalBtnHTML;
        }
    }

    async function generateCuttingPlanPDF() {
        const pdfBtn = document.getElementById('pdf-btn-cutting');
        if (!state.quote.cuttingPlan || state.quote.cuttingPlan.length === 0) {
            showNotification("Nenhum plano de corte para gerar.", "error");
            return;
        }

        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Gerando PDF...';

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape', // Melhor para visualizar as chapas
                unit: 'mm',
                format: 'a4'
            });

            const quoteId = state.quoteId || Date.now().toString().slice(-6);
            const clientName = state.customer.name || 'Cliente';

            const sheetW_mm = 2750;
            const sheetH_mm = 1850;

            for (let i = 0; i < state.quote.cuttingPlan.length; i++) {
                const sheet = state.quote.cuttingPlan[i];
                if (i > 0) {
                    pdf.addPage();
                }

                // --- Agrupar e contar peças idênticas para a lista ---
                const partsList = sheet.reduce((acc, part) => {
                    const key = `${part.description}_${part.w}x${part.h}`;
                    if (!acc[key]) {
                        acc[key] = { ...part, count: 0 };
                    }
                    acc[key].count++;
                    return acc;
                }, {});

                // Adiciona um cabeçalho em cada página
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`Plano de Corte - Chapa ${i + 1} de ${state.quote.cuttingPlan.length}`, 10, 15);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Projeto: ${clientName} | Orçamento: ${quoteId} | Chapa: ${sheetW_mm} x ${sheetH_mm} mm`, 10, 22);

                const canvas = document.createElement('canvas');
                canvas.width = sheetW_mm; // Alta resolução
                canvas.height = sheetH_mm;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                let totalAreaUsed = 0;

                sheet.forEach(part => {
                    if (part.fit) {
                        totalAreaUsed += part.w * part.h;
                        ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
                        ctx.strokeStyle = '#8B4513';
                        ctx.lineWidth = 3;
                        ctx.fillRect(part.fit.x, part.fit.y, part.w, part.h);
                        ctx.strokeRect(part.fit.x, part.fit.y, part.w, part.h);
                        ctx.fillStyle = '#2F2F2F';
                        ctx.font = 'bold 40px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const text = `${part.description} ${part.rotated ? ' (R)' : ''}`;
                        const text2 = `${part.w}x${part.h}`;
                        
                        // Centraliza o texto na peça
                        const centerX = part.fit.x + part.w / 2;
                        const centerY = part.fit.y + part.h / 2;

                        ctx.fillText(text, centerX, centerY - 25);
                        ctx.fillText(text2, centerX, centerY + 25);
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const imageWidth = 190; // Largura da imagem no PDF
                const imageHeight = (canvas.height * imageWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 10, 30, imageWidth, imageHeight);

                let listY = 35;
                const listX = 210;
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Lista de Peças da Chapa:', listX, 30);
                pdf.setFont('courier', 'normal');
                pdf.setFontSize(9);
                Object.values(partsList).forEach(p => {
                    const translatedDescription = translatePartDescription(p.description);
                    const text = `${String(p.count).padStart(2, ' ')}x - ${translatedDescription.padEnd(18, ' ')} ${String(p.w).padStart(4, ' ')} x ${String(p.h).padStart(4, ' ')} mm ${p.rotated ? '(R)' : ''}`;
                    pdf.text(text, listX, listY);
                    listY += 4;
                });

                // --- Adiciona resumo de aproveitamento ---
                const utilization = (totalAreaUsed / (sheetW_mm * sheetH_mm)) * 100;
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text(`Aproveitamento: ${utilization.toFixed(2)}%`, listX, listY + 5);
            }

            pdf.save(`plano_corte_${clientName.replace(/\s/g, '_')}.pdf`);

        } catch (error) {
            console.error("Cutting Plan PDF Generation Error:", error);
            showNotification("Erro ao gerar o PDF do plano de corte.", "error");
        } finally {
            pdfBtn.disabled = false;
            pdfBtn.innerHTML = originalBtnHTML;
        }
    }

    function translatePartDescription(description) {
        const translations = {
            'Left Side': 'Lateral Esq.',
            'Right Side': 'Lateral Dir.',
            'Top': 'Tampo',
            'Bottom': 'Base',
            'Divider': 'Divisória',
            'Shelf': 'Prateleira',
            'Door': 'Porta',
            'Drawer Front': 'Frente Gaveta',
            'Drawer Side': 'Lateral Gaveta',
            'Drawer Back': 'Fundo Gaveta',
            'Drawer Bottom': 'Fundo Gaveta(3mm)',
            'Upper Cabinet Top': 'Tampo Superior',
            'Upper Cabinet Bottom': 'Base Superior',
            'Upper Cabinet Side': 'Lateral Superior',
            'Upper Cabinet Door': 'Porta Superior',
            'Lower Cabinet Top': 'Tampo Inferior',
            'Lower Cabinet Bottom': 'Base Inferior',
            'Lower Cabinet Side': 'Lateral Inferior',
            'Lower Cabinet Door': 'Porta Inferior',
        };

        // Tenta encontrar uma tradução exata
        if (translations[description]) {
            return translations[description];
        }

        for (const key in translations) {
            if (description.startsWith(key)) {
                return description.replace(key, translations[key]);
            }
        }

        return description;
    }

    function generateWhatsAppLink() {
        let text = getQuoteAsText();
        if (state.projectOption === 'upload' && state.projectFile) {
            text += '\n\n*(Anexei o arquivo do meu projeto no simulador. Por favor, me informe como posso enviá-lo.)*';
        }
        window.open(`https://wa.me/5518997312957?text=${encodeURIComponent(text)}`, '_blank');
    }

    init();

    // --- Shopping List Modal Functions ---
    function handleGenerateShoppingList() {
        const modal = document.getElementById('shopping-list-modal');
        const contentDiv = document.getElementById('shopping-list-content');
        modal.classList.remove('hidden');
        contentDiv.innerHTML = '<div class="text-center text-gray-500"><div class="spinner mx-auto"></div><p>Gerando lista...</p></div>';

        const consolidatedList = {};

        state.quote.baseBreakdown.forEach(item => {
            const cleanLabel = item.label.replace(/\s*\(.*\)\s*$/, '').trim();
            if (!consolidatedList[cleanLabel]) {
                consolidatedList[cleanLabel] = { quantity: 0, unit: '' };
            }
            consolidatedList[cleanLabel].quantity += item.quantity || 1;
            
            if (cleanLabel.toLowerCase().includes('chapa')) consolidatedList[cleanLabel].unit = 'unid.';
            if (cleanLabel.toLowerCase().includes('fita de borda')) consolidatedList[cleanLabel].unit = 'metros';
            if (cleanLabel.toLowerCase().includes('corrediça')) consolidatedList[cleanLabel].unit = 'pares';
            if (cleanLabel.toLowerCase().includes('dobradiça')) consolidatedList[cleanLabel].unit = 'unid.';
            if (cleanLabel.toLowerCase().includes('puxador')) consolidatedList[cleanLabel].unit = 'barras';
        });

        // Process extras breakdown
        state.extras.forEach(extra => {
            if (!consolidatedList[extra]) {
                consolidatedList[extra] = { quantity: 0, unit: 'unid.' };
            }
            consolidatedList[extra].quantity += 1;
        });

        // Generate HTML
        let listHTML = `
            <div class="space-y-4">
                <h4 class="text-lg font-bold text-charcoal border-b pb-2">Materiais e Ferragens</h4>
                <ul class="space-y-2 list-none">
        `;

        Object.entries(consolidatedList).forEach(([label, data]) => {
            listHTML += `
                <li class="flex items-center justify-between p-2 rounded-md even:bg-gray-50">
                    <span class="text-gray-700">${label}</span>
                    <span class="font-bold text-charcoal">${Math.ceil(data.quantity)} ${data.unit}</span>
                </li>
            `;
        });

        listHTML += `</ul></div>`;
        contentDiv.innerHTML = listHTML;
    }

    function closeShoppingListModal() {
        document.getElementById('shopping-list-modal').classList.add('hidden');
    }

    function printShoppingList() {
        const content = document.getElementById('shopping-list-content').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Lista de Compras</title>');
        printWindow.document.write('<link href="https://cdn.tailwindcss.com" rel="stylesheet">'); // For basic styling
        printWindow.document.write('<style>body { padding: 2rem; font-family: sans-serif; } @page { size: auto; margin: 20mm; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Lista de Compras - ${state.customer.name || 'Projeto'}</h1>`);
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}
