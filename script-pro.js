// =================================================================
// SIMULATOR PRO LOGIC
// This script is dedicated to the marceneiro.html page.
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    setupSimulator();
});

// Notification system (kept for user feedback)
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
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Phone mask function
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

// --- CONFIGURATION OBJECT ---
// Valores PADRÃO de custo. Na versão PRO, esses valores são sobrescritos pelos inputs do painel.
const SIMULATOR_CONFIG = {
    // =========================================================================
    // CUSTOS COMUNS (Aplicável a Guarda-Roupa e Cozinha)
    // Na versão PRO, a margem de lucro é adicionada sobre estes custos.
    // =========================================================================
    COMMON_COSTS: {
        // Custo fixo cobrado se o cliente optar pela criação de um projeto 3D.
        'PROJECT_3D': 350,
        // Custo por METRO LINEAR de fita de LED instalada.
        // O cálculo multiplica este valor pela largura total do móvel.
            // =========================================================================
        'Iluminação LED': 350,
    },
    // =========================================================================
    // CONFIGURAÇÕES DE CÁLCULO PARA GUARDA-ROUPA
    // =========================================================================
    WARDROBE: {
        // O preço do guarda-roupa é calculado com base na ÁREA FRONTAL (largura x altura).
        // O preço por m² é usado como base para o custo de produção.
        PRODUCTION_COST_PER_M2: 450, // Custo de fabricação, montagem, etc. por m² de área frontal.
        // Preço por CHAPA de MDF.
        MDF_SHEET_PRICING: {
            'Branco': 240,
            'Premium': 400,
        },
        // Fator de multiplicação para estimar a área total de material (carcaça, prateleiras) a partir da área frontal.
        // Ex: 2.5 significa que a área total de MDF é 2.5x a área frontal.
        MATERIAL_AREA_MULTIPLIER: 2.5,
        // Área total de uma chapa de MDF (padrão 2.75m * 1.85m = 5.0875 m²). Usado para estimar a quantidade de chapas.
        MDF_SHEET_SIZE: 5.09,
        // Custos de ferragens e puxadores para guarda-roupa.
        HARDWARE: {
            HANDLE_BAR_COST: {
                    'aluminio': 0, // Custo da barra de alumínio (padrão, já incluso no preço/m²).
                'premium': 100.00   // Custo ADICIONAL por BARRA de 3m para puxadores premium (inox, preto, dourado).
            },
            // Comprimento padrão de uma barra de puxador em metros. Usado para calcular quantas barras são necessárias.
            HANDLE_BAR_LENGTH: 3.0,
            // Custo por UNIDADE de dobradiça. O sistema calcula a quantidade com base na altura da porta.
            HINGE_COST_PER_UNIT: { 'padrao': 5.00, 'softclose': 20.00 },
            // Custo do PAR de corrediças por GAVETA.
            SLIDE_COST_PER_DRAWER: 20.00,
        },
        // Custos de itens extras específicos para guarda-roupa.
        EXTRAS_COST: {
            // Custo FIXO por CADA porta que tiver espelho.
            'Porta com Espelho': 700,
            // Custo FIXO por CADA gaveteiro que tiver chave.
            'Gaveteiro com Chave': 200,
            // Custo ADICIONAL por UNIDADE (porta ou gaveta) para adicionar amortecedores (soft-close).
            'HARDWARE_SOFT_CLOSE_PER_UNIT': 80,
        }
    },
    // =========================================================================
    // CONFIGURAÇÕES DE CÁLCULO PARA COZINHA
    // =========================================================================
    KITCHEN: {
        // O preço da cozinha é calculado com base no CUSTO DAS CHAPAS de MDF.
        // Defina aqui o preço por CHAPA para cada tipo de material.
        MDF_SHEET_PRICING: {
            'Branco': 240, // Preço de uma chapa de MDF branco.
            'Premium': 400,  // Preço de uma chapa de MDF colorido/texturizado.
        },
        // Área total de uma chapa de MDF (padrão 2.75m * 1.85m = 5.0875 m²). Usado para calcular a quantidade de chapas.
        MDF_SHEET_SIZE: 5.09,
        // Custos detalhados de ferragens e puxadores.
        HARDWARE: {
            // Custo por UNIDADE de dobradiça. Para cozinhas, o padrão é 2 por porta.
            HINGE_COST_PER_UNIT: { 'padrao': 5.00, 'softclose': 20.00 },
            // Custo do PAR de corrediças por GAVETA.
            SLIDE_COST_PER_DRAWER: 20.00,
            // Custo por BARRA de 3 metros de puxador perfil.
            HANDLE_BAR_COST: { 'aluminio': 75.00, 'premium': 100.00 },
            // Custo ADICIONAL por porta/gaveta ao usar puxador premium (se houver algum custo de mão de obra extra).
            HANDLE_PREMIUM_EXTRA_PER_UNIT: 6.00,
            // Comprimento padrão de uma barra de puxador em metros.
            HANDLE_BAR_LENGTH: 3.0,
            // Largura média de uma porta/gaveta em metros. Usado para estimar a quantidade de ferragens.
            UNIT_WIDTH: 0.4,
        },
        // Custos de itens extras específicos para cozinha.
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

function setupSimulator() {
    // --- STATE ---
    let currentStep = 1;
    const totalSteps = 6;
    const state = {
        quoteId: null, // To track saved quotes
        furnitureType: null,
        dimensions: { height: 2.7, depth: 60, walls: [{width: 3.0, height: 2.7}] },
        wardrobeFormat: null,
        material: null,
        kitchenHasSinkCabinet: null,
        sinkStoneWidth: 1.8,
        hasHotTower: null,
        hotTowerHeight: 2.2,
        stoveType: null,
        cooktopLocation: null,
        hardwareType: null,
        doorType: null,
        closetHasDoors: null,
        handleType: null,
        projectOption: null,
        projectFile: null,
        customColor: '',
        extras: [],
        customer: { name: '', email: '', phone: '' },
        quote: { area: 0, sheets: 0, total: 0, basePrice: 0, extrasPrice: 0, costPrice: 0, profitAmount: 0, extrasBreakdown: [] }
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
        setupPdfViewer();
        // Recalculate height on window resize to handle responsive changes. Debounce is defined inline.
        window.addEventListener('resize', debounce(updateContainerHeight, 200));
        updateUI(false); // Pass false to prevent scrolling on initial load
    }

    /**
     * Utility function to limit the rate at which a function gets called.
     */
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
        // Event delegation for navigation buttons
        document.getElementById('simulator-content').addEventListener('click', (e) => {
            if (e.target.closest('.next-btn')) {
                handleNextStep();
            } else if (e.target.closest('.prev-btn')) {
                handlePrevStep();
            } else if (e.target.closest('#restart-btn')) {
                handleRestart();
            } else if (e.target.closest('#reset-btn')) {
                handleReset();
            } else if (e.target.closest('.remove-wall-btn')) {
                handleRemoveWall(e.target.closest('.remove-wall-btn'));
            } else if (e.target.closest('#recalculate-btn')) {
                handleRecalculate();
            } else if (e.target.closest('#save-quote-btn')) {
                handleSaveQuote();
            }
        });

        // Step 1: Furniture Type
        document.querySelectorAll('input[name="furnitureType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ furnitureType: e.target.value });
                // This function will now also trigger a height update
                updateUIForFurnitureType();
            });
        });

        // Step 2: Dimensions
        document.querySelectorAll('#wardrobe-dims input').forEach(input => {
            input.addEventListener('input', updateDimensionsState);
        });
        document.querySelectorAll('#kitchen-dims input').forEach(input => {
            input.addEventListener('input', updateDimensionsState);
        });
        document.getElementById('add-wall-btn').addEventListener('click', addKitchenWall);
        document.getElementById('add-wardrobe-wall-btn').addEventListener('click', addWardrobeWall);

        // Step 2.1: Wardrobe Format
        document.querySelectorAll('input[name="wardrobeFormat"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ wardrobeFormat: e.target.value });
                updateWardrobeSubSteps();
                updateContainerHeight();
            });
        });

        // Step 2.2: Closet Doors
        document.querySelectorAll('input[name="closetDoors"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ closetHasDoors: e.target.value === 'sim' });
                updateWardrobeRecommendation();
                updateWardrobeSubSteps(); // Re-check door type visibility
                updateContainerHeight();
            });
        });

        // Step 2: Kitchen Sink
        document.querySelectorAll('input[name="kitchenSink"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ kitchenHasSinkCabinet: e.target.value === 'sim' });
                updateKitchenSubSteps();
                updateContainerHeight();
            });
        });

        // Step 2: Kitchen Hot Tower
        document.querySelectorAll('input[name="hasHotTower"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ hasHotTower: e.target.value === 'sim' });
                updateContainerHeight();
            });
        });

        // Step 2: Kitchen Stove Type
        document.querySelectorAll('input[name="stoveType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ stoveType: e.target.value });
                document.getElementById('cooktop-location-step').classList.toggle('hidden', e.target.value !== 'cooktop');
                updateContainerHeight();
            });
        });

        // Step 2: Cooktop Location
        document.querySelectorAll('input[name="cooktopLocation"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ cooktopLocation: e.target.value });
            });
        });

        // Step 6 (old Step 5): 3D Project
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
                    e.target.value = ''; // Clear the input
                    return;
                }
                updateStateAndSave({ projectFile: file });
                document.getElementById('project-file-name').textContent = file.name;
            }
        });

        // Step 3: Material
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ material: e.target.value });
                const showPremiumOptions = e.target.value === 'Premium' || e.target.value === 'Mesclada';
                document.getElementById('premium-options').classList.toggle('hidden', !showPremiumOptions);
                updateContainerHeight();
            });
        });
        document.getElementById('customColor').addEventListener('input', (e) => updateStateAndSave({ customColor: e.target.value }));

        // Step 4: Door Type (Wardrobe)
        document.querySelectorAll('input[name="doorType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ doorType: e.target.value });
            });
        });

        // Step 4: Hardware Type
        document.querySelectorAll('input[name="hardwareType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ hardwareType: e.target.value });
            });
        });
        // Step 4: Handle Type
        document.querySelectorAll('input[name="handleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ handleType: e.target.value });
            });
        });
        // Step 4: Extras
        document.querySelectorAll('input[name="extras"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateStateAndSave({ extras: Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(cb => cb.value) });
            });
        });
        
        // Step 6: Lead Capture & Result
        document.getElementById('view-quote-btn').addEventListener('click', () => handleViewQuote(false));
        document.getElementById('pdf-btn-internal').addEventListener('click', () => generatePDF('internal'));
        document.getElementById('pdf-btn-client').addEventListener('click', () => generatePDF('client'));
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);

        // Step 6: Breakdown toggle
        const toggleBtn = document.getElementById('toggle-breakdown-btn');
        const breakdownDiv = document.getElementById('result-breakdown');
        toggleBtn.addEventListener('click', () => {
            const isHidden = breakdownDiv.classList.toggle('hidden');
            toggleBtn.querySelector('i').classList.toggle('rotate-180', !isHidden);
            updateContainerHeight();
        });
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

        // Delegate events for saved quote actions
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

    // --- LocalStorage Quote Functions ---
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

    // PDF Viewer Modal Logic
    function setupPdfViewer() {
        const pdfModal = document.getElementById('pdf-viewer-modal');
        const closeBtn = document.getElementById('pdf-viewer-close');
        const pdfIframe = document.getElementById('pdf-viewer-iframe');
        const pdfTitle = document.getElementById('pdf-viewer-title');

        if (!pdfModal || !closeBtn || !pdfIframe || !pdfTitle) return;

        const openPdfViewer = (url, title) => {
            if (!url) {
                console.error('PDF URL is missing.');
                alert('Desculpe, o catálogo não está disponível no momento.');
                return;
            }
            pdfIframe.src = url;
            pdfTitle.textContent = title || 'Catálogo';
            pdfModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const closePdfViewer = () => {
            pdfModal.classList.add('hidden');
            pdfIframe.src = ''; // Stop loading PDF to save resources
            document.body.style.overflow = 'auto';
        };

        // Use event delegation on the document body
        document.body.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-pdf-src]');
            if (trigger) {
                const url = trigger.dataset.pdfSrc;
                const title = trigger.dataset.pdfTitle;
                openPdfViewer(url, title);
            }
        });

        closeBtn.addEventListener('click', closePdfViewer);
        pdfModal.addEventListener('click', (e) => {
            if (e.target === pdfModal) {
                closePdfViewer();
            }
        });
    }

    function setupProPanel() {
        const toggleBtn = document.getElementById('toggle-controls-btn');
        const mainContent = document.getElementById('main-content');
        const closeBtn = document.getElementById('close-controls-btn');

        toggleBtn.addEventListener('click', () => {
            let panel = proControlsPanel || document.getElementById('marceneiro-controls');
            if (!panel) return;
            panel.classList.remove('-translate-x-full');
            panel.classList.add('translate-x-0');
            // Para desktop, aplica margem; para mobile, não mexe na margem
            if (window.innerWidth >= 768) {
                mainContent.style.marginLeft = '320px';
            } else {
                mainContent.style.marginLeft = '0';
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                let panel = proControlsPanel || document.getElementById('marceneiro-controls');
                if (!panel) return;
                panel.classList.remove('translate-x-0');
                panel.classList.add('-translate-x-full');
                mainContent.style.marginLeft = '0';
            });
        }

        // Botão de reset dos valores do painel
        const resetPanelBtn = document.getElementById('reset-panel-btn');
        if (resetPanelBtn) {
            resetPanelBtn.addEventListener('click', () => {
                document.getElementById('mdf-branco-cost').value = 240;
                document.getElementById('mdf-premium-cost').value = 400;
                document.getElementById('edge-tape-cost').value = 2.5;
                document.getElementById('hinge-cost').value = 20;
                document.getElementById('slide-cost').value = 25;
                document.getElementById('shipping-cost').value = 150;
                document.getElementById('daily-rate-cost').value = 200;
                document.getElementById('profit-margin').value = 80;
                document.getElementById('discount-extra').value = 0;
                showNotification('Valores padrão restaurados!', 'success');
            });
        }
    }

    // --- UI & NAVIGATION ---
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

            // Correctly show/hide the previous button within the active step
            const prevButton = step.querySelector('.prev-btn');
            if (prevButton) {
                prevButton.classList.toggle('hidden', currentStep === 1);
            } 

            // When returning to the last step, show the lead form again
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

        // Adjust container height after the correct step is made active
        updateContainerHeight();

        // Scroll to the top of the simulator section for better UX
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

        // Explicitly manage handle section visibility when furniture type changes
        const handleTypeSection = document.getElementById('handle-type-section');
        if (isWardrobe) {
            // For wardrobe, its visibility depends on whether it's an open closet, which is handled in updateWardrobeSubSteps
            updateWardrobeSubSteps();
        } else { // For Kitchen, it should always be visible in step 4
            handleTypeSection.classList.remove('hidden');
        }
        
        if (isWardrobe) {
            updateWardrobeRecommendation();
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

        // Hide handle selection if it's an open closet
        const handleTypeSection = document.getElementById('handle-type-section');
        handleTypeSection.classList.toggle('hidden', isCloset && !state.closetHasDoors);
        
        // Hide door type selection if it's an open closet
        const doorTypeSection = document.getElementById('door-type-section');
        const isClosetOpen = isCloset && !state.closetHasDoors;
        doorTypeSection.classList.toggle('hidden', isClosetOpen);

        // Hide mirror door option if it's an open closet
        const mirrorDoorOption = document.getElementById('extra-mirror-door');
        if (mirrorDoorOption) {
            mirrorDoorOption.classList.toggle('hidden', isClosetOpen);
            // If it's hidden, also uncheck it and remove from state
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
        const hasSinkCabinet = state.kitchenHasSinkCabinet;
        document.getElementById('sink-stone-width-container').classList.toggle('hidden', !hasSinkCabinet);
        // No need to call updateContainerHeight here, the event listener that calls this function will do it.
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
                        <input type="number" id="kitchen-wall-height${wallCount}" name="kitchen-wall-height" step="0.1" min="0" value="2.7" class="form-input">
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
            updateDimensionsState(); // Recalculate state
            
            if (container.id === 'wardrobe-walls-container') {
                document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');
            } else if (container.id === 'kitchen-walls-container') {
                document.getElementById('add-wall-btn').classList.remove('hidden');
            }
            updateContainerHeight(); // Adjust container height
        }
    }

    function updateContainerHeight() {
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            // Use a small timeout to allow the DOM to update (e.g., for smooth-toggle animations to start)
            // before measuring the new height.
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
            updateWardrobeRecommendation();
        } else {
            const widths = Array.from(document.querySelectorAll('input[name="kitchen-wall-width"]')).map(input => parseFloat(input.value) || 0);
            const heights = Array.from(document.querySelectorAll('input[name="kitchen-wall-height"]')).map(input => parseFloat(input.value) || 0);
            state.dimensions.walls = widths.map((w, i) => ({ width: w, height: heights[i] || 0 }));
            state.sinkStoneWidth = parseFloat(document.getElementById('sinkStoneWidth').value) || 0;
        }
        // Save state after dimension update
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
                if (state.wardrobeFormat === null) {
                    showNotification('Por favor, escolha o formato do projeto.', 'error');
                    return false;
                }
            } else { // Cozinha
                const kitchenArea = state.dimensions.walls.reduce((acc, wall) => acc + (wall.width * wall.height), 0);
                if (kitchenArea <= 0 && !state.kitchenHasSinkCabinet) {
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
                if (state.hasHotTower === null) {
                    showNotification('Informe se o projeto terá Torre Quente.', 'error');
                    return false;
                }
                if (state.stoveType === null) {
                    showNotification('Por favor, escolha o tipo de fogão.', 'error');
                    return false;
                }
                if (state.stoveType === 'cooktop' && state.cooktopLocation === null) {
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
        }
        if (step === 5 && !state.projectOption) {
            showNotification('Por favor, informe sobre o projeto 3D.', 'error');
            return false;
        }
        return true;
    }

    function handleRecalculate() {
        if (currentStep === totalSteps && !document.getElementById('result-container').classList.contains('hidden')) {
            showNotification('Recalculando com novos custos...', 'info');
            handleViewQuote(true); // Passa um flag para indicar que é um recálculo
        } else {
            showNotification('Vá até a tela de resultados para recalcular.', 'error');
        }
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

        // Simple logic: hinged doors ~50cm, sliding doors ~100cm. Minimum of 2 doors.
        const hingedDoors = Math.max(2, Math.round(width / 0.45));
        const slidingDoors = Math.max(2, Math.round(width / 1.0));

        recommendationText.textContent = `Para esta largura, recomendamos aproximadamente ${hingedDoors} portas de abrir ou ${slidingDoors} portas de correr.`;
        recommendationDiv.classList.remove('hidden');
        updateContainerHeight();
    }

    function calculateWardrobeQuote() {
        // Sobrescreve a configuração com os valores do painel Pro
        const mdfBrancoCost = parseFloat(document.getElementById('mdf-branco-cost').value);
        const mdfPremiumCost = parseFloat(document.getElementById('mdf-premium-cost').value);

        // Get new costs from panel
        const hingeCostPerUnit = parseFloat(document.getElementById('hinge-cost').value) || 0;
        const slideCostPerDrawer = parseFloat(document.getElementById('slide-cost').value) || 0;
        const edgeTapeCostPerMeter = parseFloat(document.getElementById('edge-tape-cost').value) || 0;
        const shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
        const dailyRateCost = parseFloat(document.getElementById('daily-rate-cost').value) || 0;

        if (!isNaN(mdfBrancoCost)) {
            SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_PRICING['Branco'] = mdfBrancoCost;
            SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_PRICING['Branco'] = mdfBrancoCost;
        }
        if (!isNaN(mdfPremiumCost)) {
            SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_PRICING['Premium'] = mdfPremiumCost;
            SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_PRICING['Premium'] = mdfPremiumCost;
        }
        SIMULATOR_CONFIG.WARDROBE.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType] = hingeCostPerUnit;
        SIMULATOR_CONFIG.WARDROBE.HARDWARE.SLIDE_COST_PER_DRAWER = slideCostPerDrawer;

        const config = SIMULATOR_CONFIG.WARDROBE;

        const { height } = state.dimensions;
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        const frontArea = width * height;
        const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);

        // Lógica aprimorada para quantidade de dobradiças por porta, com base na altura.
        let hingesPerDoor = 2; // Mínimo
        if (height > 1.5) hingesPerDoor = 3;
        if (height > 2.0) hingesPerDoor = 4;
        if (height > 2.5) hingesPerDoor = 5;

        const baseBreakdown = [];
        const extrasBreakdown = [];

        // 1. MDF Cost
        const totalMaterialArea = frontArea * config.MATERIAL_AREA_MULTIPLIER;
        if (state.material === 'Mesclada') {
            // Lógica aprimorada: MDF Premium para a área frontal (portas) e Branco para a estrutura interna.
            const internalArea = frontArea * (config.MATERIAL_AREA_MULTIPLIER - 1);
            const numWhiteSheets = Math.ceil(internalArea / config.MDF_SHEET_SIZE);
            const numColoredSheets = Math.ceil(frontArea / config.MDF_SHEET_SIZE);

            if (numWhiteSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Branco (Interno)', quantity: numWhiteSheets, cost: numWhiteSheets * config.MDF_SHEET_PRICING['Branco'] });
            if (numColoredSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Premium (Portas)', quantity: numColoredSheets, cost: numColoredSheets * config.MDF_SHEET_PRICING['Premium'] });
        } else {
            const numSheets = Math.ceil(totalMaterialArea / config.MDF_SHEET_SIZE);
            const mdfCost = numSheets * config.MDF_SHEET_PRICING[state.material];
            const materialLabel = state.material === 'Branco' ? 'Chapas de MDF Branco' : 'Chapas de MDF Premium';
            if (mdfCost > 0) baseBreakdown.push({ label: materialLabel, quantity: numSheets, cost: mdfCost });
        }

        // 2. Hardware Cost (Hinges, Slides, Handles)
        const numDrawers = Math.floor(width * 2); // Estimate: 2 drawers per meter of width
        const slideCost = numDrawers * slideCostPerDrawer;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        let numDoors = 0;
        if (hasDoors) {
            if (state.doorType === 'correr') {
                numDoors = Math.max(2, Math.round(width / 1.0));
            } else { // 'abrir'
                numDoors = Math.max(2, Math.round(width / 0.45));
                const totalHinges = numDoors * hingesPerDoor;
                const hingeCost = totalHinges * hingeCostPerUnit;
                const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
                if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });
            }

            const totalHandleLength = (state.doorType === 'correr' && numDoors >= 2) ? (2 * numDoors - 2) * height : numDoors * height;
            if (totalHandleLength > 0) {
                const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
                const handleCost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.premium;
                if (handleCost > 0) baseBreakdown.push({ label: `Barras de Puxador Perfil ${state.handleType}`, quantity: numBarsNeeded, cost: handleCost });
            }
        }

        // 3. Production Cost
        const productionCost = frontArea * config.PRODUCTION_COST_PER_M2;
        if (productionCost > 0) baseBreakdown.push({ label: 'Custos de Fabricação e Montagem', quantity: null, cost: productionCost });

        // 3.5 Edge Tape Cost
        const estimatedPerimeter = totalMaterialArea * 1.5; // Rough estimation
        const edgeTapeCost = estimatedPerimeter * edgeTapeCostPerMeter;
        if (edgeTapeCost > 0) {
            baseBreakdown.push({ label: 'Fita de Borda', quantity: Math.round(estimatedPerimeter), cost: edgeTapeCost });
        }

        // 4. Optional Extras
        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            const finalCost = (extra === 'Iluminação LED') ? cost * width : cost;
            if (finalCost > 0) extrasBreakdown.push({ label: extra, cost: finalCost });
        });

        // 5. Expenses
        if (shippingCost > 0) {
            extrasBreakdown.push({ label: 'Frete e Deslocamento', cost: shippingCost });
        }
        const installationDays = Math.ceil(frontArea / 5); // Estimate 1 day for every 5m²
        const installationCost = installationDays * dailyRateCost;
        if (installationCost > 0) extrasBreakdown.push({ label: `Instalação (${installationDays} diária(s))`, cost: installationCost });

        return { baseBreakdown, extrasBreakdown, totalMaterialArea };
    }

    function calculateKitchenQuote() {
        // Sobrescreve a configuração com os valores do painel Pro
        const mdfBrancoCost = parseFloat(document.getElementById('mdf-branco-cost').value);
        const mdfPremiumCost = parseFloat(document.getElementById('mdf-premium-cost').value);

        // Get new costs from panel
        const hingeCostPerUnit = parseFloat(document.getElementById('hinge-cost').value) || 0;
        const slideCostPerDrawer = parseFloat(document.getElementById('slide-cost').value) || 0;
        const edgeTapeCostPerMeter = parseFloat(document.getElementById('edge-tape-cost').value) || 0;
        const shippingCost = parseFloat(document.getElementById('shipping-cost').value) || 0;
        const dailyRateCost = parseFloat(document.getElementById('daily-rate-cost').value) || 0;

        if (!isNaN(mdfBrancoCost)) {
            SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_PRICING['Branco'] = mdfBrancoCost;
        }
        if (!isNaN(mdfPremiumCost)) {
            SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_PRICING['Premium'] = mdfPremiumCost;
        }
        SIMULATOR_CONFIG.KITCHEN.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType] = hingeCostPerUnit;
        SIMULATOR_CONFIG.KITCHEN.HARDWARE.SLIDE_COST_PER_DRAWER = slideCostPerDrawer;

        const config = SIMULATOR_CONFIG.KITCHEN;
        const baseBreakdown = [];
        const extrasBreakdown = [];

        // Material area calculation
        const totalFrontArea = state.dimensions.walls.reduce((acc, wall) => acc + (wall.width * wall.height), 0);
        const cabinetDepth = 0.6;
        const totalCarcassArea = totalFrontArea * 1.2;
        const totalInternalArea = totalFrontArea * 1.0;
        const totalMaterialArea = totalFrontArea + totalCarcassArea + totalInternalArea;

        // 1. MDF Cost
        if (state.material === 'Mesclada') {
            const numWhiteSheets = Math.ceil((totalCarcassArea + totalInternalArea) / config.MDF_SHEET_SIZE);
            const numColoredSheets = Math.ceil(totalFrontArea / config.MDF_SHEET_SIZE);
            if (numWhiteSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Branco', quantity: numWhiteSheets, cost: numWhiteSheets * config.MDF_SHEET_PRICING['Branco'] });
            if (numColoredSheets > 0) baseBreakdown.push({ label: 'Chapas de MDF Premium', quantity: numColoredSheets, cost: numColoredSheets * config.MDF_SHEET_PRICING['Premium'] });
        } else {
            const numSheets = Math.ceil(totalMaterialArea / config.MDF_SHEET_SIZE);
            const mdfCost = numSheets * config.MDF_SHEET_PRICING[state.material];
            if (mdfCost > 0) baseBreakdown.push({ label: `Chapas de MDF ${state.material}`, quantity: numSheets, cost: mdfCost });
        }

        // --- Extras Calculation ---
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

        const totalWidth = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        let lowerCabinetWidth = totalWidth;
        if (state.stoveType === 'piso') { lowerCabinetWidth -= 0.75; }
        const upperCabinetWidth = totalWidth;
        const UNIT_WIDTH = config.HARDWARE.UNIT_WIDTH;
        const lowerUnits = Math.max(0, lowerCabinetWidth) / UNIT_WIDTH;
        const upperUnits = upperCabinetWidth / UNIT_WIDTH;
        const totalUnits = Math.ceil(lowerUnits + upperUnits) + (state.hasHotTower ? 2 : 0);
        const numDoors = Math.round(totalUnits * 0.75);
        const numDrawers = totalUnits - numDoors;

        // Lógica de dobradiças aprimorada para cozinha (padrão de 2 por porta)
        const hingesPerDoor = 2;
        const totalHinges = numDoors * hingesPerDoor;
        const hingeCost = totalHinges * hingeCostPerUnit;
        const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
        if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });

        const slideCost = numDrawers * slideCostPerDrawer;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        const totalHandleUnits = numDoors + numDrawers;
        const totalHandleLength = totalHandleUnits * UNIT_WIDTH;
        const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);

        if (state.handleType === 'aluminio') {
            const cost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.aluminio;
            if (cost > 0) baseBreakdown.push({ label: 'Barras de Puxador Perfil Alumínio', quantity: numBarsNeeded, cost: cost });
        } else {
            const cost = (numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.premium) + (totalHandleUnits * config.HARDWARE.HANDLE_PREMIUM_EXTRA_PER_UNIT);
            if (cost > 0) baseBreakdown.push({ label: `Barras de Puxador Perfil ${state.handleType}`, quantity: numBarsNeeded, cost: cost });
        }

        // Edge Tape Cost
        const estimatedPerimeter = totalMaterialArea * 1.5; // Rough estimation
        const edgeTapeCost = estimatedPerimeter * edgeTapeCostPerMeter;
        if (edgeTapeCost > 0) {
            baseBreakdown.push({ label: 'Fita de Borda', quantity: Math.round(estimatedPerimeter), cost: edgeTapeCost });
        }

        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            const finalCost = (extra === 'Iluminação LED') ? cost * totalWidth : cost;
            if (finalCost > 0) extrasBreakdown.push({ label: extra, cost: finalCost });
        });

        // Expenses
        if (shippingCost > 0) {
            extrasBreakdown.push({ label: 'Frete e Deslocamento', cost: shippingCost });
        }
        const installationDays = Math.ceil(totalFrontArea / 4); // Estimate 1 day for every 4m² of kitchen
        const installationCost = installationDays * dailyRateCost;
        if (installationCost > 0) extrasBreakdown.push({ label: `Instalação (${installationDays} diária(s))`, cost: installationCost });

        return { baseBreakdown, extrasBreakdown, totalMaterialArea };
    }

    function calculateQuote() {
        let quoteDetails;
        if (state.furnitureType === 'Guarda-Roupa') {
            quoteDetails = calculateWardrobeQuote();
        } else { // Cozinha
            quoteDetails = calculateKitchenQuote();
        }

        const { baseBreakdown, extrasBreakdown, totalMaterialArea } = quoteDetails;
        const basePrice = baseBreakdown.reduce((acc, item) => acc + item.cost, 0);
        const extrasPrice = extrasBreakdown.reduce((acc, item) => acc + item.cost, 0);

        const costPrice = basePrice + extrasPrice;
        let finalTotal = costPrice;
        let profitAmount = 0;

        const profitMarginInput = document.getElementById('profit-margin');
        const profitMargin = profitMarginInput ? (parseFloat(profitMarginInput.value) || 0) : 40;
        profitAmount = costPrice * (profitMargin / 100);
        finalTotal = costPrice + profitAmount;

        // Desconto ou acréscimo
        const discountExtraInput = document.getElementById('discount-extra');
        const discountExtra = discountExtraInput ? (parseFloat(discountExtraInput.value) || 0) : 0;
        finalTotal += discountExtra;

        const sheetSize = state.furnitureType === 'Cozinha' ? SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_SIZE : SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_SIZE;

        state.quote = {
            area: totalMaterialArea,
            sheets: Math.ceil(totalMaterialArea / sheetSize),
            total: finalTotal,
            costPrice: costPrice,
            profitAmount: profitAmount,
            basePrice: basePrice,
            baseBreakdown: baseBreakdown,
            extrasPrice: extrasPrice,
            extrasBreakdown: extrasBreakdown,
            discountExtra: discountExtra
        };
    }

    function resetState() {
        Object.assign(state, {
            quoteId: null,
            furnitureType: null,
            dimensions: { height: 2.7, depth: 60, walls: [{width: 3.0, height: 2.7}] },
            material: null,
            doorType: null,
            wardrobeFormat: null,
            closetHasDoors: null,
            kitchenHasSinkCabinet: null,
            sinkStoneWidth: 1.8,
            hasHotTower: null,
            stoveType: null,
            cooktopLocation: null,
            hardwareType: null,
            handleType: null,
            projectOption: null,
            projectFile: null,
            customColor: '',
            extras: [],
            customer: { name: '', email: '', phone: '' },
            quote: { area: 0, sheets: 0, total: 0, basePrice: 0, costPrice: 0, profitAmount: 0, baseBreakdown: [], extrasPrice: 0, extrasBreakdown: [] }
        });
    }

    function resetFormUI() {
        // Uncheck all radio buttons and checkboxes within the simulator
        document.querySelectorAll('#simulador input[type="radio"], #simulador input[type="checkbox"]').forEach(input => {
            input.checked = false;
        });

        // Reset specific input values to their defaults
        document.getElementById('wardrobe-width1').value = 3.0;
        document.getElementById('wardrobe-height').value = 2.7;
        const wardrobeWallsContainer = document.getElementById('wardrobe-walls-container');
        Array.from(wardrobeWallsContainer.children).slice(1).forEach(wall => wall.remove());
        document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');
        document.getElementById('sinkStoneWidth').value = 1.8;
        document.getElementById('cooktop-location-step').classList.add('hidden');
        document.getElementById('kitchen-wall-width1').value = 2.2;
        document.getElementById('kitchen-wall-height1').value = 2.7;

        const kitchenWallsContainer = document.getElementById('kitchen-walls-container');
        Array.from(kitchenWallsContainer.children).slice(1).forEach(wall => wall.remove());
        document.getElementById('add-wall-btn').classList.remove('hidden');
        document.getElementById('premium-options').classList.add('hidden');
        document.getElementById('customColor').value = '';
        document.getElementById('project-upload-container').classList.add('hidden');
        document.getElementById('project-file-input').value = '';
        document.getElementById('project-file-name').textContent = 'Escolher arquivo do projeto';
        document.getElementById('leadName').value = '';
        document.getElementById('leadEmail').value = '';
        document.getElementById('leadPhone').value = '';
    }

    async function handleViewQuote(isRecalculation = false) {
        const viewQuoteBtn = document.getElementById('view-quote-btn');
        const originalBtnText = viewQuoteBtn.innerHTML;
        const leadNameInput = document.getElementById('leadName');
        const leadPhoneInput = document.getElementById('leadPhone');
        const leadEmailInput = document.getElementById('leadEmail');

        // Reset previous validation styles and add listeners to remove them on input
        [leadNameInput, leadPhoneInput, leadEmailInput].forEach(input => {
            input.classList.remove('invalid');
            input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
        });

        // 1. Validate inputs
        Object.assign(state.customer, { name: leadNameInput.value, email: leadEmailInput.value, phone: leadPhoneInput.value });

        if (!isRecalculation && !state.customer.name) {
            showNotification('Por favor, preencha o nome do cliente.', 'error');
            leadNameInput.classList.add('invalid');
            leadNameInput.focus();
            return;
        }
        if (!isRecalculation && !state.customer.phone) {
            showNotification('Por favor, preencha o WhatsApp do cliente.', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        // --- Validação Avançada de Celular (Brasil) ---
        const phoneDigits = state.customer.phone.replace(/\D/g, '');
        if (!isRecalculation && phoneDigits.length !== 11) {
            showNotification('Por favor, insira um WhatsApp válido com DDD (11 dígitos).', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (state.customer.email && !emailRegex.test(state.customer.email)) {
            showNotification('Por favor, insira um endereço de e-mail válido.', 'error');
            leadEmailInput.classList.add('invalid');
            leadEmailInput.focus();
            return;
        }

        // --- If validation passes, show loading and proceed ---
        viewQuoteBtn.disabled = true;
        viewQuoteBtn.innerHTML = '<div class="spinner mr-2"></div>Calculando...';

        // Use a small timeout to allow the UI to update before heavy calculation
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // FIX: Default hardwareType if not selected to prevent calculation errors.
            if (!state.hardwareType) {
                updateStateAndSave({ hardwareType: 'padrao' });
            }

            calculateQuote();
            renderResult();
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight(); // Ajusta a altura do container para mostrar o resultado

            const saveBtn = document.getElementById('save-quote-btn');
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Orçamento';
        } catch (error) {
            console.error("Error calculating quote:", error);
            showNotification('Ocorreu um erro ao calcular o orçamento. Tente novamente.', 'error');
        } finally {
            // Restore button
            viewQuoteBtn.disabled = false;
            viewQuoteBtn.innerHTML = originalBtnText;
        }
    }

    function handleLoadQuote(quoteId) {
        const quotes = getSavedQuotes();
        const quoteToLoad = quotes.find(q => q.quoteId === parseInt(quoteId));

        if (quoteToLoad) {
            // Deep copy to avoid modifying the saved object directly
            const loadedState = JSON.parse(JSON.stringify(quoteToLoad));
            
            // Restore state
            Object.assign(state, loadedState);

            // Update UI from state
            updateFormFromState();

            // Go to the last step and show results
            currentStep = totalSteps;
            updateUI(false);
            renderResult();
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight();

            showNotification(`Orçamento de "${state.customer.name}" carregado.`, "success");
            
            // Close the side panel
            document.getElementById('marceneiro-controls').classList.add('-translate-x-full');
            document.getElementById('main-content').style.marginLeft = '0';
        } else {
            showNotification("Orçamento não encontrado.", "error");
        }
    }

    function handleDuplicateQuote(quoteId) {
        handleLoadQuote(quoteId);
        // After loading, unset the ID and modify the name to indicate it's a copy
        state.quoteId = null;
        state.customer.name = `(Cópia) ${state.customer.name}`;
        document.getElementById('leadName').value = state.customer.name;
        showNotification("Orçamento duplicado. Modifique e salve como um novo.", "info");
    }

    function updateFormFromState() {
        // Reset all inputs first
        resetFormUI();

        // Step 1: Furniture Type
        document.querySelector(`input[name="furnitureType"][value="${state.furnitureType}"]`)?.click();

        // Step 2: Dimensions & Sub-options
        if (state.furnitureType === 'Guarda-Roupa') {
            document.querySelector(`input[name="wardrobeFormat"][value="${state.wardrobeFormat}"]`)?.click();
            if (state.wardrobeFormat === 'closet') {
                document.querySelector(`input[name="closetDoors"][value="${state.closetHasDoors ? 'sim' : 'nao'}"]`)?.click();
            }
            // Restore walls
            const wardrobeWallsContainer = document.getElementById('wardrobe-walls-container');
            Array.from(wardrobeWallsContainer.children).slice(1).forEach(wall => wall.remove());
            state.dimensions.walls.slice(1).forEach(() => addWardrobeWall());
            document.querySelectorAll('#wardrobe-walls-container input[name="wardrobe-width"]').forEach((input, i) => {
                input.value = state.dimensions.walls[i]?.width || 0;
            });
            document.getElementById('wardrobe-height').value = state.dimensions.height;
        } else { // Cozinha
            document.querySelector(`input[name="kitchenSink"][value="${state.kitchenHasSinkCabinet ? 'sim' : 'nao'}"]`)?.click();
            document.querySelector(`input[name="hasHotTower"][value="${state.hasHotTower ? 'sim' : 'nao'}"]`)?.click();
            document.querySelector(`input[name="stoveType"][value="${state.stoveType}"]`)?.click();
            if (state.stoveType === 'cooktop') {
                document.querySelector(`input[name="cooktopLocation"][value="${state.cooktopLocation}"]`)?.click();
            }
            document.getElementById('sinkStoneWidth').value = state.sinkStoneWidth;
            // Restore walls
            const kitchenWallsContainer = document.getElementById('kitchen-walls-container');
            Array.from(kitchenWallsContainer.children).slice(1).forEach(wall => wall.remove());
            state.dimensions.walls.slice(1).forEach(() => addKitchenWall());
            document.querySelectorAll('input[name="kitchen-wall-width"]').forEach((input, i) => input.value = state.dimensions.walls[i]?.width || 0);
            document.querySelectorAll('input[name="kitchen-wall-height"]').forEach((input, i) => input.value = state.dimensions.walls[i]?.height || 0);
        }

        // Step 3: Material
        document.querySelector(`input[name="material"][value="${state.material}"]`)?.click();
        document.getElementById('customColor').value = state.customColor;

        // Step 4: Extras
        document.querySelector(`input[name="doorType"][value="${state.doorType}"]`)?.click();
        document.querySelector(`input[name="handleType"][value="${state.handleType}"]`)?.click();
        document.querySelector(`input[name="hardwareType"][value="${state.hardwareType}"]`)?.click();
        state.extras.forEach(extra => {
            document.querySelector(`input[name="extras"][value="${extra}"]`).checked = true;
        });

        // Step 5: Project
        document.querySelector(`input[name="projectOption"][value="${state.projectOption}"]`)?.click();

        // Step 6: Customer Info
        document.getElementById('leadName').value = state.customer.name;
        document.getElementById('leadEmail').value = state.customer.email;
        document.getElementById('leadPhone').value = state.customer.phone;
    }

    function renderResult() {
        const specsContainer = document.getElementById('result-specs');
        if (!specsContainer) return;

        specsContainer.innerHTML = ''; // Clear previous results

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

        breakdownContainer.innerHTML = breakdownHTML;
    }

    function renderSavedQuotes(searchTerm = '') {
        const listContainer = document.getElementById('saved-quotes-list');
        const quotes = getSavedQuotes();
        const filteredQuotes = quotes.filter(q => 
            q.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredQuotes.length === 0) {
            listContainer.innerHTML = `<p class="text-center text-gray-400 text-sm py-4">Nenhum orçamento salvo.</p>`;
            return;
        }

        listContainer.innerHTML = filteredQuotes.map(q => {
            const quoteDate = new Date(q.quoteId).toLocaleDateString('pt-BR');
            return `
                <div class="bg-gray-700 p-3 rounded-lg" data-quote-id="${q.quoteId}">
                    <div class="flex justify-between items-center">
                        <div class="flex-grow overflow-hidden">
                            <p class="font-semibold text-white truncate">${q.customer.name}</p>
                            <p class="text-xs text-gray-400">${q.furnitureType} - ${quoteDate}</p>
                        </div>
                        <div class="flex-shrink-0 flex items-center gap-1">
                            <button class="quote-action-btn load-quote-btn" title="Carregar"><i class="fas fa-folder-open"></i></button>
                            <button class="quote-action-btn duplicate-quote-btn" title="Duplicar"><i class="fas fa-copy"></i></button>
                            <button class="quote-action-btn delete-quote-btn text-red-400 hover:bg-red-500/20" title="Excluir"><i class="fas fa-trash"></i></button>
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
        if (state.projectOption === 'upload' && !state.projectFile) projectDetails = '\n*Projeto 3D:* Cliente informou que tem o projeto (não anexado).';
        const hardwareDetails = `\n*Acabamento Interno:* ${state.hardwareType === 'padrao' ? 'Padrão' : 'Com Amortecimento (Soft-close)'}`;

        const handleName = state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1);

        // Para o marceneiro, o WhatsApp pode ser um resumo simples para o cliente
        const breakdownText = `\n\n*Resumo para o Cliente:*`;

        return `*Orçamento de Móveis Planejados*\n---------------------------------\n*Cliente:* ${state.customer.name}\n*Móvel:* ${state.furnitureType}${formatDetails}${kitchenDetails}\n${details}${projectDetails}\n*Material:* ${state.material} ${state.customColor ? `(Cor: ${state.customColor})` : ''}\n*Puxador:* Perfil ${handleName}${hardwareDetails}\n*Extras:* ${state.extras.join(', ') || 'Nenhum'}\n---------------------------------\n*Total Estimado: ${formatCurrency(state.quote.total)}*${breakdownText}\n\n_Este é um orçamento informativo. O valor final será definido após visita técnica._`;
    }

    async function generatePDF(type = 'internal') {
        const pdfBtn = document.getElementById(type === 'internal' ? 'pdf-btn-internal' : 'pdf-btn-client');
        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Gerando...';
    
        try {
            const { jsPDF } = window.jspdf;
            const pdfTemplate = document.getElementById('pdf-template');
    
            // --- Populate Template ---
            const quoteId = Date.now().toString().slice(-6);
            document.getElementById('pdf-quote-id').textContent = quoteId;
            document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('pt-BR');
            
            document.getElementById('pdf-name').textContent = state.customer.name;
            document.getElementById('pdf-email').textContent = state.customer.email || 'Não informado';
            document.getElementById('pdf-phone').textContent = state.customer.phone;
    
            // Populate Specs Table
            const specsContainer = document.getElementById('pdf-specs-table');
            specsContainer.innerHTML = ''; // Clear previous
            const createSpecRow = (label, value) => {
                if (!value) return '';
                return `<div class="py-2 border-b border-gray-200"><strong class="text-gray-500">${label}:</strong><p class="font-semibold">${value}</p></div>`;
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
            if (state.customColor) {
                specsHTML += createSpecRow('Cor Personalizada', state.customColor);
            }
            const hasDoors = state.furnitureType === 'Cozinha' || (state.wardrobeFormat === 'reto' || (state.wardrobeFormat === 'closet' && state.closetHasDoors));
            if (hasDoors) {
                specsHTML += createSpecRow('Tipo de Porta', state.doorType === 'abrir' ? 'De Abrir' : 'De Correr');
                specsHTML += createSpecRow('Puxador', `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
            }
            specsHTML += createSpecRow('Ferragens', state.hardwareType === 'padrao' ? 'Padrão' : 'Soft-close');
            specsHTML += createSpecRow('Projeto 3D', state.projectOption === 'create' ? 'Sim' : (state.projectOption === 'upload' ? 'Fornecido pelo cliente' : 'Não'));
            
            specsContainer.innerHTML = specsHTML;
    
            // Populate Pricing
            const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            const extrasContainer = document.getElementById('pdf-extras-breakdown');
            extrasContainer.innerHTML = '';
            let pdfBreakdownHTML = '';

            // Conditional rendering based on PDF type
            if (type === 'internal') {
                document.getElementById('pdf-doc-title').textContent = 'ORDEM DE SERVIÇO';
                document.getElementById('pdf-pricing-title').textContent = 'Detalhamento de Custos e Lucro';
                document.getElementById('pdf-cost-section').classList.remove('hidden');
                document.getElementById('pdf-total-label').textContent = 'PREÇO FINAL (CLIENTE)';

                document.getElementById('pdf-base-price').textContent = formatCurrency(state.quote.costPrice);
                document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);

                // Full breakdown for internal PDF
                if (state.quote.baseBreakdown?.length) {
                    pdfBreakdownHTML += '<p class="font-semibold text-charcoal">Custos Base:</p><div class="pl-4 border-l-2 border-gold/50 space-y-1 mt-1">';
                    state.quote.baseBreakdown.forEach(item => {
                        pdfBreakdownHTML += `<div class="flex justify-between items-center text-sm"><span class="text-gray-600">${item.label}</span><span class="font-semibold">${formatCurrency(item.cost)}</span></div>`;
                    });
                    pdfBreakdownHTML += '</div>';
                }
                if (state.quote.extrasBreakdown?.length) {
                    pdfBreakdownHTML += '<p class="font-semibold text-charcoal mt-2">Custos de Acabamentos e Despesas:</p><div class="pl-4 border-l-2 border-gold/50 space-y-1 mt-1">';
                    state.quote.extrasBreakdown.forEach(item => {
                        pdfBreakdownHTML += `<div class="flex justify-between items-center text-sm"><span class="text-gray-600">${item.label}</span><span class="font-semibold">+ ${formatCurrency(item.cost)}</span></div>`;
                    });
                    pdfBreakdownHTML += '</div>';
                }
                extrasContainer.innerHTML = pdfBreakdownHTML;

            } else { // Client PDF
                document.getElementById('pdf-doc-title').textContent = 'ORÇAMENTO';
                document.getElementById('pdf-pricing-title').textContent = 'Valor do Investimento';
                document.getElementById('pdf-cost-section').classList.add('hidden');
                document.getElementById('pdf-total-label').textContent = 'VALOR TOTAL';
                document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
                extrasContainer.innerHTML = '<p class="text-sm text-gray-600">Serviços como visita técnica, entrega, montagem e garantia de 5 anos estão inclusos.</p>';
            }

            // --- End Populate ---
    
            pdfTemplate.classList.remove('hidden');
            const canvas = await html2canvas(pdfTemplate.firstElementChild, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`orcamento_${type}_${state.customer.name.replace(/\s/g, '_')}_${quoteId}.pdf`);
            pdfTemplate.classList.add('hidden');
        } catch (error) {
            console.error("PDF Generation Error:", error);
            showNotification("Erro ao gerar o PDF. Tente novamente.", "error");
        } finally {
            pdfBtn.disabled = false;
            pdfBtn.innerHTML = originalBtnHTML;
        }
    }

    function generateWhatsAppLink() {
        let text = getQuoteAsText();
        if (state.projectOption === 'upload' && state.projectFile) {
            text += '\n\n*(Anexei o arquivo do meu projeto no simulador. Por favor, me informe como posso enviá-lo.)*';
        }
        window.open(`https://wa.me/${state.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    }

    init();
}
