// Global variables
let isMenuOpen = false;

// =================================================================
// SIMULATOR REFACTOR - START
// =================================================================

// Centralized pricing configuration
const PRICING_CONFIG = {
    SHEET_SIZE: 5.88, // m² (2.80m x 2.10m)
    MATERIAL_PRICES: { // Price per m² of the front face
        'branco': 800,
        'premium': 1200
    },
    COSTS: {
        PREMIUM_HANDLE_PER_SHEET: 150,
        DRAWER: 250,
        EXTRA_SHELF: 80,
        SLIDING_DOOR_PER_M2: 150,
        WOOD_INTERNAL_FINISH_PER_M2: 100,
        SINK_CABINET_SIMPLE_PER_M: 450,
        SINK_CABINET_DRAWERS_PER_M: 800,
        HOT_TOWER_PER_M: 900,
        NON_FRONTAL_MATERIAL_FACTOR: 0.7 // Cost of non-frontal material relative to frontal
    }
};

// Simulator state
let simulatorState = {};
let lastSimulationResult = null;

// =================================================================
// SIMULATOR REFACTOR - END
// =================================================================


// =================================================================
// DOM Elements
// =================================================================
// DOM Elements
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('header');
const simulatorForm = document.getElementById('simulator-form');
const simulatorModal = document.getElementById('simulator-modal');
const contactForm = document.getElementById('contact-form');
const fileInput = document.getElementById('attachment');




// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    setupMobileMenu();
    setupScrollEffects();
    setupSimulator();
    setupContactForm();
    setupScrollAnimations();
    setupGalleryLightbox();
    setupLazyLoading();
    
    // Add smooth scrolling to all anchor links
    setupSmoothScrolling();
    
    // Initialize AOS-like animations
    observeElements();
    
    console.log('Roni Marceneiro website initialized successfully!');
}

// Mobile menu functionality
function setupMobileMenu() {
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique no botão se propague para o document
            toggleMobileMenu();
        });
        
        // Close menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Impede que cliques dentro do menu mobile o fechem imediatamente
        mobileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
        mobileMenu.classList.remove('hidden');
        mobileMenuToggle.innerHTML = '<i class="fas fa-times text-2xl"></i>';
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    isMenuOpen = false;
    mobileMenu.classList.add('hidden');
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'auto';
}

// Scroll effects
function setupScrollEffects() {
  let lastScrollY = window.scrollY;
  const heroImage = document.querySelector('#inicio img');

  const handleHeaderAndScroll = () => {
    const currentScrollY = window.scrollY;

    // Header background and shadow
    if (header) {
      if (currentScrollY > 50) {
        header.classList.add('shadow-lg');
      } else {
        header.classList.remove('shadow-lg');
      }
    }

    // Hide/show header on scroll
    if (header) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)'; // Scrolling down
        } else {
            header.style.transform = 'translateY(0)'; // Scrolling up
        }
    }
    
    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
  };

  const handleParallax = () => {
    const currentScrollY = window.scrollY;
    if (heroImage && currentScrollY < window.innerHeight) {
      heroImage.style.transform = `translateY(${currentScrollY * 0.3}px)`;
    }
    requestAnimationFrame(handleParallax);
  };

  window.addEventListener('scroll', throttle(handleHeaderAndScroll, 100));
  requestAnimationFrame(handleParallax);
}

// Smooth scrolling functionality
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (isMenuOpen) {
                    closeMobileMenu();
                }
            }
        });
    });
}

// Scroll to section function (used by buttons)
function scrollToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Simulator functionality
function setupSimulator() {
    if (!simulatorForm) return;

    initializeSimulatorState();
    setupMultiStepSimulator();

    // Real-time updates
    const throttledRecalculate = throttle(recalculateAndDisplay, 300);
    simulatorForm.addEventListener('input', (e) => {
        if (e.target.dataset.config) {
            throttledRecalculate();
        }
    });
    simulatorForm.addEventListener('change', (e) => {
        if (e.target.dataset.config) {
            throttledRecalculate();
        }
    });

    // Initial calculation
    recalculateAndDisplay();
}

function initializeSimulatorState() {
    const inputs = simulatorForm.querySelectorAll('[data-config]');
    inputs.forEach(input => {
        const key = input.dataset.config;
        let value;
        if (input.type === 'radio') {
            if (input.checked) {
                simulatorState[key] = input.value;
            }
        } else if (input.type === 'checkbox') {
            simulatorState[key] = input.checked;
        } else {
            value = input.value;
            simulatorState[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
        }
    });
}

function updateSimulatorState() {
    const formData = new FormData(simulatorForm);
    const data = Object.fromEntries(formData.entries());

    // Handle checkboxes which are not included if unchecked
    simulatorState.hasInferior = data.hasInferior === 'on';
    simulatorState.hasSuperior = data.hasSuperior === 'on';
    simulatorState.hasHotTower = data.hasHotTower === 'on';

    for (const key in data) {
        const value = data[key];
        simulatorState[key] = isNaN(parseFloat(value)) || key === 'material' || key === 'handles' || key === 'doorType' || key === 'internalFinish' ? value : parseFloat(value);
    }
}

function recalculateAndDisplay() {
    try {
        updateSimulatorState();
        const result = calculateSimulatorPrice(simulatorState);
        lastSimulationResult = result;
        updateSummaryUI(result);
    } catch (error) {
        console.error("Error during simulation calculation:", error);
        // Optionally show an error in the summary
        const totalPriceEl = document.getElementById('total-price');
        if (totalPriceEl) totalPriceEl.textContent = "Erro";
    }
}

function calculateWardrobePrice(state) {
    const { width = 0, height = 0, depth = 0, drawers = 0, extraShelves = 0, doorType, internalFinish, material, handles } = state;

    const depthInMeters = depth / 100;
    const frontArea = width * height;
    const sideArea = 2 * height * depthInMeters;
    const topBottomArea = 2 * width * depthInMeters;
    const totalArea = frontArea + sideArea + topBottomArea;

    const sheetsNeeded = Math.ceil(totalArea / PRICING_CONFIG.SHEET_SIZE);
    const materialPricePerM2 = PRICING_CONFIG.MATERIAL_PRICES[material];

    const basePrice = frontArea * materialPricePerM2;

    let additionalCosts = 0;
    // Material for non-frontal parts
    additionalCosts += (totalArea - frontArea) * (materialPricePerM2 * PRICING_CONFIG.COSTS.NON_FRONTAL_MATERIAL_FACTOR);
    // Add-ons
    additionalCosts += (handles === 'premium') ? (sheetsNeeded * PRICING_CONFIG.COSTS.PREMIUM_HANDLE_PER_SHEET) : 0;
    additionalCosts += drawers * PRICING_CONFIG.COSTS.DRAWER;
    additionalCosts += extraShelves * PRICING_CONFIG.COSTS.EXTRA_SHELF;
    if (doorType === 'sliding') {
        additionalCosts += frontArea * PRICING_CONFIG.COSTS.SLIDING_DOOR_PER_M2;
    }
    if (internalFinish === 'wood') {
        additionalCosts += totalArea * PRICING_CONFIG.COSTS.WOOD_INTERNAL_FINISH_PER_M2;
    }

    const totalPrice = basePrice + additionalCosts;

    return {
        totalPrice,
        details: [
            { label: 'Dimensões', value: `${width.toFixed(1)}m × ${height.toFixed(1)}m × ${depth}cm` },
            { label: 'Material', value: material === 'branco' ? 'MDF Branco' : 'MDF Premium' },
            { label: 'Portas', value: doorType === 'sliding' ? 'de Correr' : 'de Abrir' },
        ]
    };
}

function calculateKitchenPrice(state) {
    const { width1 = 0, width2 = 0, width3 = 0, height = 0, drawers = 0, sinkCabinetType, sinkAreaWidth = 0, hasInferior, hasSuperior, hasHotTower, hotTowerHeight = 0, material, handles } = state;

    const totalWidth = width1 + width2 + width3;
    let totalArea = 0;
    let frontArea = 0;
    let inferiorWidth = totalWidth;

    if (sinkCabinetType !== 'none' && hasInferior && sinkAreaWidth > 0) {
        inferiorWidth = Math.max(0, totalWidth - sinkAreaWidth);
    }

    if (hasInferior) {
        frontArea += inferiorWidth * 0.9; // Altura padrão de armário inferior
    }
    if (hasSuperior) {
        frontArea += totalWidth * 0.8; // Altura padrão de armário superior
    }
    
    // For kitchens, total area for material calculation is simplified
    totalArea = frontArea * 2.5; // Factor for depth, shelves, etc.

    if (hasHotTower && hotTowerHeight > 0) {
        const towerArea = 0.6 * hotTowerHeight;
        frontArea += towerArea;
        totalArea += towerArea * 2.5;
    }

    const sheetsNeeded = Math.ceil(totalArea / PRICING_CONFIG.SHEET_SIZE);
    const materialPricePerM2 = PRICING_CONFIG.MATERIAL_PRICES[material];
    const basePrice = frontArea * materialPricePerM2;

    let additionalCosts = 0;
    additionalCosts += (handles === 'premium') ? (sheetsNeeded * PRICING_CONFIG.COSTS.PREMIUM_HANDLE_PER_SHEET) : 0;
    additionalCosts += drawers * PRICING_CONFIG.COSTS.DRAWER;

    if (sinkCabinetType === 'simple') {
        additionalCosts += PRICING_CONFIG.COSTS.SINK_CABINET_SIMPLE_PER_M * sinkAreaWidth;
    } else if (sinkCabinetType === 'drawers') {
        additionalCosts += PRICING_CONFIG.COSTS.SINK_CABINET_DRAWERS_PER_M * sinkAreaWidth;
    }

    if (hasHotTower && hotTowerHeight > 0) {
        additionalCosts += PRICING_CONFIG.COSTS.HOT_TOWER_PER_M * hotTowerHeight;
    }

    const totalPrice = basePrice + additionalCosts;

    return {
        totalPrice,
        details: [
            { label: 'Largura Total', value: `${totalWidth.toFixed(1)}m` },
            { label: 'Altura', value: `${height.toFixed(1)}m` },
            { label: 'Material', value: material === 'branco' ? 'MDF Branco' : 'MDF Premium' },
        ]
    };
}

function calculateSimulatorPrice(state) {
    const { furnitureType } = state;
    if (!furnitureType) return { totalPrice: 0, details: [] };

    if (furnitureType === 'cozinha') {
        return calculateKitchenPrice(state);
    } else if (furnitureType === 'guarda-roupa') {
        return calculateWardrobePrice(state);
    }
    return { totalPrice: 0, details: [] };
}

function updateSummaryUI(result) {
    const summaryContent = document.getElementById('summary-content');
    const totalPriceEl = document.getElementById('total-price');

    if (!summaryContent || !totalPriceEl) return;

    // Update total price
    totalPriceEl.textContent = `R$ ${result.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Update details
    summaryContent.innerHTML = result.details.map(detail => `
        <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">${detail.label}:</span>
            <span class="font-semibold text-charcoal">${detail.value}</span>
        </div>
    `).join('');
}

function displaySimulatorResult(result) {
    // This function is kept for potential future use but is now secondary to the live summary.
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    
    // ... (implementation can be similar to the old one if a final summary page is needed)
    
    resultDiv.classList.remove('hidden');
    resultDiv.classList.add('animate-fadeInUp');
}

// Nova função para pré-preencher o formulário de contato
function requestQuoteFromSimulator() {
    if (!lastSimulationResult || !simulatorState.furnitureType) {
        // Se não houver simulação, apenas rola para o contato
        scrollToSection('contato');
        showNotification('Role para baixo e preencha o formulário de contato.', 'info');
        return;
    }

    const { totalPrice, details } = lastSimulationResult;
    const { furnitureType } = simulatorState;

    const furnitureTypeName = furnitureType === 'cozinha' ? 'Cozinha Planejada' : 'Guarda-Roupa Planejado';
    const formattedPrice = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const detailsText = details.map(d => `- ${d.label}: ${d.value}`).join('\n');

    const message = `Olá!
Gostaria de um orçamento detalhado com base na simulação que fiz no site.

Detalhes da Simulação:
- Tipo de Móvel: ${furnitureTypeName}
${detailsText}
- Preço Estimado: ${formattedPrice}

Aguardo o contato. Obrigado!`;

    document.getElementById('subject').value = furnitureType;
    document.getElementById('message').value = message;
    // Trigger label animation for textarea
    document.getElementById('message').dispatchEvent(new Event('input'));

    scrollToSection('contato');
    showNotification('Seus dados da simulação foram adicionados ao formulário!', 'info');
}

function setupMultiStepSimulator() {
    const steps = Array.from(simulatorForm.querySelectorAll('.form-step'));
    const nextButtons = Array.from(simulatorForm.querySelectorAll('.next-step-btn'));
    const prevButtons = Array.from(simulatorForm.querySelectorAll('.prev-step-btn'));
    const progressSteps = Array.from(simulatorForm.querySelectorAll('.progress-step'));
    const progressLines = Array.from(simulatorForm.querySelectorAll('.progress-bar-line'));
    let currentStep = 0;

    // --- Dynamic fields logic ---
    const furnitureTypeRadios = simulatorForm.querySelectorAll('input[name="furnitureType"]');
    const wardrobeDims = document.getElementById('wardrobe-dims');
    const kitchenDims = document.getElementById('kitchen-dims');
    const wardrobeInternals = document.getElementById('wardrobe-internals');
    const kitchenInternals = document.getElementById('kitchen-internals');
    const addWallBtn = document.getElementById('add-wall-btn');
    let wallCount = 1;

    const inferiorModuleCheckbox = simulatorForm.querySelector('input[name="hasInferior"]');
    const inferiorConfigBody = document.getElementById('inferior_config_body');
    const hotTowerCheckbox = document.getElementById('hot_tower');
    const hotTowerDimsContainer = document.getElementById('hot-tower-dims-container');

    simulatorForm.addEventListener('change', (e) => {
        if (e.target.name === 'hasInferior') {
            inferiorConfigBody.classList.toggle('hidden', !e.target.checked);
        }
        if (e.target.id === 'hot_tower') {
            hotTowerDimsContainer.classList.toggle('hidden', !e.target.checked);
        }
    });

    const handleFurnitureTypeChange = () => {
        const selectedType = simulatorForm.querySelector('input[name="furnitureType"]:checked')?.value;
        if (!selectedType) return;

        const isKitchen = selectedType === 'cozinha';

        // Show/hide dimension sections
        wardrobeDims.classList.toggle('hidden', isKitchen);
        kitchenDims.classList.toggle('hidden', !isKitchen);

        // Show/hide internal components sections
        wardrobeInternals.classList.toggle('hidden', isKitchen);
        kitchenInternals.classList.toggle('hidden', !isKitchen);

        // Set required attributes based on visibility
        wardrobeDims.querySelectorAll('input').forEach(i => i.required = !isKitchen);
        kitchenDims.querySelectorAll('input').forEach(i => {
            // Only width1 and height are always required for kitchen
            if (i.id === 'width1' || i.id === 'kitchenHeight') {
                i.required = isKitchen;
            } else {
                i.required = false;
            }
        });

        // Reset kitchen wall state
        wallCount = 1;
        document.getElementById('wall-input-2').classList.add('hidden');
        document.getElementById('wall-input-3').classList.add('hidden');
        addWallBtn.classList.remove('hidden');
        recalculateAndDisplay();
    };

    addWallBtn.addEventListener('click', () => {
        wallCount++;
        if (wallCount === 2) {
            document.getElementById('wall-input-2').classList.remove('hidden');
        }
        if (wallCount === 3) {
            document.getElementById('wall-input-3').classList.remove('hidden');
            addWallBtn.classList.add('hidden');
        }
    });

    furnitureTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleFurnitureTypeChange);
    });

    const updateFormSteps = () => {
        steps.forEach((step, index) => {
            step.classList.toggle('hidden', index !== currentStep);
            step.classList.toggle('active-step', index === currentStep);
        });
    };

    const updateProgressBar = () => {
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index <= currentStep);
        });
        progressLines.forEach((line, index) => {
            line.classList.toggle('active', index < currentStep);
        });
    };

    const validateStep = (stepIndex) => {
        const currentStepElement = steps[stepIndex];
        const inputs = currentStepElement.querySelectorAll('input[required]:not(.sr-only), select[required], textarea[required]');
        let isValid = true;

        // Check visible required inputs
        for (const input of inputs) {
            // Check if the input is inside a hidden container
            if (input.closest('.hidden')) continue;

            if (!input.value.trim()) {
                isValid = false;
                const label = input.labels[0] || input.closest('div').querySelector('label');
                const labelText = label ? label.textContent.replace('*', '').trim() : 'um campo';
                showNotification(`Por favor, preencha o campo "${labelText}".`, 'error');
                input.focus();
                input.classList.add('border-red-500');
                break;
            } else {
                input.classList.remove('border-red-500');
            }
        }

        // Special check for radio buttons
        if (isValid) {
            const radioGroups = currentStepElement.querySelectorAll('input[type="radio"][required]');
            const checkedRadios = new Set(Array.from(radioGroups).map(r => r.name));
            for (const name of checkedRadios) {
                if (!simulatorForm.querySelector(`input[name="${name}"]:checked`)) {
                    isValid = false;
                    const firstRadio = simulatorForm.querySelector(`input[name="${name}"]`);
                    const fieldset = firstRadio.closest('div.grid');
                    const title = fieldset?.previousElementSibling;
                    const labelText = title ? title.textContent : 'uma opção';
                    showNotification(`Por favor, selecione ${labelText}.`, 'error');
                    fieldset?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }

        return isValid;
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < steps.length - 1) {
                    currentStep++;
                    updateFormSteps();
                    updateProgressBar();
                }
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateFormSteps();
                updateProgressBar();
            }
        });
    });

    // Initial setup
    updateFormSteps();
    updateProgressBar();
    handleFurnitureTypeChange();
    setupSimulatorSliders();
}

function setupSimulatorSliders() {
    const sliders = simulatorForm.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const inputId = slider.dataset.syncInput;
        const numberInput = document.getElementById(inputId);

        if (numberInput) {
            // Sync slider from number input
            numberInput.addEventListener('input', (e) => {
                slider.value = e.target.value;
            });

            // Sync number input from slider
            slider.addEventListener('input', (e) => {
                numberInput.value = e.target.value;
            });
        }
    });
}

// Open simulator for specific furniture type
function openSimulator(type) {
    if (type === 'cozinha' || type === 'guarda-roupa') {
        // Set the radio button
        const radioButton = document.querySelector(`#simulator-form input[name="furnitureType"][value="${type}"]`);
        if (radioButton) {
            radioButton.checked = true;
            // Manually trigger change to update UI and state
            radioButton.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Scroll to simulator
        scrollToSection('simulador');
    } else {
        // Show modal for unsupported types
        showSimulatorModal();
    }
}

function showSimulatorModal() {
    if (simulatorModal) {
        simulatorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeSimulatorModal() {
    if (simulatorModal) {
        simulatorModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Contact form functionality
function setupContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const fileNameSpan = document.getElementById('file-name');
            if (fileInput.files.length > 0) {
                fileNameSpan.textContent = fileInput.files[0].name;
            } else {
                fileNameSpan.textContent = 'Escolher arquivo (planta, foto, etc.)';
            }
        });
    }
}

async function handleContactFormSubmit(e) {
    e.preventDefault();

    // --- Validação do Arquivo ---
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

        if (file.size > MAX_SIZE) {
            showNotification('O arquivo é muito grande. O tamanho máximo é 5MB.', 'error');
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            showNotification('Tipo de arquivo inválido. Apenas JPG, PNG e PDF são permitidos.', 'error');
            return;
        }
    }
    // --- Fim da Validação ---

    
    const requiredInputs = contactForm.querySelectorAll('[required]');
    let isValid = true;
    for (const input of requiredInputs) {
        if (!input.value.trim()) {
            isValid = false;
            showNotification(`O campo "${input.labels[0].textContent.replace('*', '').trim()}" é obrigatório.`, 'error');
            break;
        }
    }
    if (!isValid) {
        return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<div class="spinner mr-2"></div>Enviando...';
    submitButton.disabled = true;
    
    const formData = new FormData(contactForm);
    
    try {
        const response = await fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            contactForm.reset();
            // Reseta o nome do arquivo no label
            if (document.getElementById('file-name')) {
                document.getElementById('file-name').textContent = 'Escolher arquivo (planta, foto, etc.)';
            }
        } else {
            showNotification('Ocorreu um erro ao enviar a mensagem. Tente novamente.', 'error');
        }
    } catch (error) {
        showNotification('Ocorreu um erro de rede. Verifique sua conexão e tente novamente.', 'error');
    } finally {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Notification system
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

// Scroll animations
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
    });
}

// Intersection Observer for animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('section, .card-hover, .hover-lift');
    elementsToAnimate.forEach(element => {
        element.classList.add('reveal');
        observer.observe(element);
    });
}

// Gallery Lightbox functionality
function setupGalleryLightbox() {
    const galleryItems = document.querySelectorAll('[data-gallery-item]');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeButton = document.getElementById('lightbox-close');
    const prevButton = document.getElementById('lightbox-prev');
    const nextButton = document.getElementById('lightbox-next');

    if (!galleryItems.length || !lightbox || !closeButton || !prevButton || !nextButton) return;

    const imageSources = Array.from(galleryItems).map(item => item.querySelector('img').src);
    let currentIndex = 0;

    // Elementos focáveis dentro do lightbox
    const focusableElements = [closeButton, prevButton, nextButton];

    function showImage(index) {
        if (index < 0 || index >= imageSources.length) return;
        currentIndex = index;
        lightboxImage.src = imageSources[currentIndex];
        lightbox.classList.remove('hidden');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Foca no botão de fechar ao abrir
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';

        // Devolve o foco para o item da galeria que abriu o lightbox
        const originalItem = galleryItems[currentIndex];
        if (originalItem) {
            // Adiciona um pequeno atraso para garantir que o foco seja definido corretamente
            setTimeout(() => {
                originalItem.focus();
            }, 0);
        }
    }

    function showNext() {
        const nextIndex = (currentIndex + 1) % imageSources.length;
        showImage(nextIndex);
    }

    function showPrev() {
        const prevIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
        showImage(prevIndex);
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showImage(index);
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    nextButton.addEventListener('click', showNext);
    prevButton.addEventListener('click', showPrev);

    // Close on clicking the background
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();

        // Focus trap
        if (e.key === 'Tab') {
            const firstFocusable = focusableElements[1]; // prevButton
            const lastFocusable = focusableElements[2]; // nextButton

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('fade-in');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
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

// Utility functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance optimizations
const debouncedScrollHandler = debounce(() => {
    // Handle scroll-based animations
    const scrolled = window.pageYOffset;
    const parallax = document.querySelectorAll('.parallax');
    
    parallax.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// SEO and Analytics helpers
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4 event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, parameters);
}

// Track important interactions
document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a');
    if (target) {
        const text = target.textContent.trim();
        const href = target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            trackEvent('navigation_click', {
                section: href.substring(1),
                text: text
            });
        } else if (target.tagName === 'BUTTON') {
            trackEvent('button_click', {
                button_text: text,
                location: window.location.pathname
            });
        }
        
        // Track WhatsApp clicks
        if (href && href.includes('wa.me')) {
            trackEvent('whatsapp_click', {
                source: 'float_button'
            });
        }
    }
});

// Track form submissions
document.addEventListener('submit', (e) => {
    const form = e.target;
    const formId = form.id || 'unknown_form';
    
    trackEvent('form_submit', {
        form_id: formId,
        form_name: formId.replace('-', ' ')
    });
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.scrollToSection = scrollToSection;
window.openSimulator = openSimulator;
window.requestQuoteFromSimulator = requestQuoteFromSimulator;
window.closeSimulatorModal = closeSimulatorModal;
window.maskPhone = maskPhone;
    return {
        furnitureType,
        width: furnitureType === 'cozinha' ? totalWidth : width,
        height: height,
        depth: depth * 100, // back to cm for display
        totalArea: totalArea.toFixed(2),
        sheetsNeeded,
        material,
        materialPrice,
        basePrice,
        handles,
        additionalCosts,
        drawers: drawers,
        extraShelves: extraShelves,
        totalPrice
    };
}

function displaySimulatorResult(result) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    
    const furnitureTypeName = result.furnitureType === 'cozinha' ? 'Cozinha Planejada' : 'Guarda-Roupa Planejado';
    const materialName = result.material === 'branco' ? 'MDF Branco' : 'MDF Premium/Colorido';
    const handlesName = result.handles === 'padrao' ? 'Puxadores Padrão' : 'Puxadores Premium';
    
    resultDiv.innerHTML = `
        <div class="text-center mb-8">
            <h3 class="font-montserrat font-bold text-3xl text-charcoal mb-2">
                Resultado da Simulação
            </h3>
            <p class="text-gray-600">Orçamento estimado para seu projeto</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-8">
            <!-- Detalhes do Projeto -->
            <div class="space-y-6">
                <h4 class="font-montserrat font-semibold text-xl text-charcoal mb-4">
                    Detalhes do Projeto
                </h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Tipo de Móvel:</span>
                        <span class="font-semibold text-charcoal">${furnitureTypeName}</span>
                    </div>
                    
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Dimensões:</span>
                        <span class="font-semibold text-charcoal">${result.width}m × ${result.height}m × ${result.depth}cm</span>
                    </div>
                    
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Área Total:</span>
                        <span class="font-semibold text-charcoal">${result.totalArea} m²</span>
                    </div>
                    
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Chapas Necessárias:</span>
                        <span class="font-semibold text-charcoal">${result.sheetsNeeded} chapas</span>
                    </div>
                    
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Material:</span>
                        <span class="font-semibold text-charcoal">${materialName}</span>
                    </div>
                    
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Puxadores:</span>
                        <span class="font-semibold text-charcoal">${handlesName}</span>
                    </div>

                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Gavetas:</span>
                        <span class="font-semibold text-charcoal">${result.drawers}</span>
                    </div>

                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <span class="text-gray-600">Prateleiras Extras:</span>
                        <span class="font-semibold text-charcoal">${result.extraShelves}</span>
                    </div>
                </div>
            </div>
            
            <!-- Breakdown de Preços -->
            <div class="bg-white rounded-xl p-6 shadow-lg">
                <h4 class="font-montserrat font-semibold text-xl text-charcoal mb-6">
                    Breakdown de Preços
                </h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center py-2">
                        <span class="text-gray-600">Preço Base (Frente):</span>
                        <span class="font-semibold text-charcoal">R$ ${result.basePrice.toLocaleString('pt-BR')}</span>
                    </div>
                    
                    ${result.additionalCosts > 0 ? `
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-600">Custos Adicionais:</span>
                            <span class="font-semibold text-charcoal">+ R$ ${result.additionalCosts.toLocaleString('pt-BR')}</span>
                        </div>
                    ` : ''}
                    
                    <div class="border-t border-gray-300 pt-4">
                        <div class="flex justify-between items-center">
                            <span class="font-montserrat font-bold text-xl text-charcoal">Total:</span>
                            <span class="font-montserrat font-bold text-2xl text-gold">
                                R$ ${result.totalPrice.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Importante:</strong>
                    </p>
                    <ul class="text-sm text-blue-700 space-y-1">
                        <li>• Este é um orçamento estimado</li>
                        <li>• Preços podem variar conforme projeto específico</li>
                        <li>• Inclui material, corte e furação</li>
                        <li>• Montagem sob consulta</li>
                    </ul>
                </div>
                
                <div class="flex gap-4 mt-6">
                    <button onclick="requestQuoteFromSimulator()" 
                            class="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                        <i class="fas fa-phone mr-2"></i>
                        Solicitar Orçamento
                    </button>
                    <button onclick="window.print()" 
                            class="flex-1 border-2 border-gold text-gold py-3 rounded-lg font-semibold hover:bg-gold hover:text-white transition-all duration-300">
                        <i class="fas fa-print mr-2"></i>
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
    resultDiv.classList.add('animate-fadeInUp');
    
    // Notificação pode ser removida para não aparecer a cada mudança de input
    // showNotification('Simulação atualizada!', 'success');
}

// Nova função para pré-preencher o formulário de contato
function requestQuoteFromSimulator() {
    if (!lastSimulationResult) {
        // Se não houver simulação, apenas rola para o contato
        scrollToSection('contato');
        return;
    }

    const { furnitureType, width, height, material, totalPrice } = lastSimulationResult;

    const furnitureTypeName = furnitureType === 'cozinha' ? 'Cozinha Planejada' : 'Guarda-Roupa Planejado';
    const materialName = material === 'branco' ? 'MDF Branco' : 'MDF Premium/Colorido';
    const formattedPrice = totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const message = `Olá!
Gostaria de um orçamento detalhado com base na simulação que fiz no site.

Detalhes da Simulação:
- Tipo de Móvel: ${furnitureTypeName}
- Dimensões: ${width}m x ${height}m
- Material: ${materialName}
- Preço Estimado: ${formattedPrice}`;

    document.getElementById('subject').value = furnitureType;
    document.getElementById('message').value = message;

    scrollToSection('contato');
    showNotification('Seus dados da simulação foram adicionados ao formulário!', 'info');
}

function setupMultiStepSimulator() {
    const steps = Array.from(simulatorForm.querySelectorAll('.form-step'));
    const nextButtons = Array.from(simulatorForm.querySelectorAll('.next-step-btn'));
    const prevButtons = Array.from(simulatorForm.querySelectorAll('.prev-step-btn'));
    const progressSteps = Array.from(simulatorForm.querySelectorAll('.progress-step'));
    const progressLines = Array.from(simulatorForm.querySelectorAll('.progress-bar-line'));
    let currentStep = 0;

    // --- NOVO: Lógica para campos dinâmicos ---
    const furnitureTypeRadios = simulatorForm.querySelectorAll('input[name="furniture-type"]');
    const wardrobeDims = document.getElementById('wardrobe-dims');
    const kitchenDims = document.getElementById('kitchen-dims');
    const wardrobeInternals = document.getElementById('wardrobe-internals');
    const kitchenInternals = document.getElementById('kitchen-internals');
    const addWallBtn = document.getElementById('add-wall-btn');
    let wallCount = 1;

    // --- Lógica para os módulos da cozinha ---
    const inferiorModuleCheckbox = simulatorForm.querySelector('input[name="modules"][value="inferior"]');
    const inferiorConfigBody = document.getElementById('inferior_config_body');
    const hotTowerCheckbox = document.getElementById('hot_tower');
    const hotTowerDimsContainer = document.getElementById('hot-tower-dims-container');

    simulatorForm.addEventListener('change', (e) => {
        if (e.target.name === 'modules' && e.target.value === 'inferior') {
            inferiorConfigBody.classList.toggle('hidden', !e.target.checked);
        }
        if (e.target.id === 'hot_tower') {
            hotTowerDimsContainer.classList.toggle('hidden', !e.target.checked);
        }
    });
    // --- Fim da Lógica ---


    const handleFurnitureTypeChange = () => {
        const selectedType = simulatorForm.querySelector('input[name="furniture-type"]:checked').value;
        const isKitchen = selectedType === 'cozinha';

        // Mostra/esconde seções inteiras
        wardrobeDims.classList.toggle('hidden', isKitchen);
        kitchenDims.classList.toggle('hidden', !isKitchen);
        wardrobeInternals.classList.toggle('hidden', isKitchen);
        kitchenInternals.classList.toggle('hidden', !isKitchen);

        // Reseta o estado das paredes da cozinha
        wallCount = 1;
        document.getElementById('wall-input-2').classList.add('hidden');
        document.getElementById('wall-input-3').classList.add('hidden');
        addWallBtn.classList.remove('hidden');
    };

    addWallBtn.addEventListener('click', () => {
        wallCount++;
        if (wallCount === 2) {
            document.getElementById('wall-input-2').classList.remove('hidden');
        }
        if (wallCount === 3) {
            document.getElementById('wall-input-3').classList.remove('hidden');
            addWallBtn.classList.add('hidden'); // Esconde o botão após adicionar a 3ª parede
        }
    });

    furnitureTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleFurnitureTypeChange);
    });
    // --- FIM LÓGICA DINÂMICA ---

    const updateFormSteps = () => {
        steps.forEach((step, index) => {
            step.classList.toggle('hidden', index !== currentStep);
            step.classList.toggle('active-step', index === currentStep);
        });
    };

    const updateProgressBar = () => {
        progressSteps.forEach((step, index) => {
            if (index <= currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        progressLines.forEach((line, index) => {
            if (index < currentStep) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
    };

    const validateStep = (stepIndex) => {
        const currentStepElement = steps[stepIndex];
        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        for (const input of inputs) {
            if (!input.value.trim() && input.type !== 'radio' || (input.type === 'radio' && !simulatorForm.querySelector(`input[name="${input.name}"]:checked`))) {
                isValid = false;
                const label = input.closest('div').querySelector('label');
                const labelText = label ? label.textContent.replace('*', '').trim() : 'um campo';
                showNotification(`Por favor, preencha ${labelText}.`, 'error');
                input.classList.add('border-red-500'); // Visual feedback
                break; // Stop on first error
            } else {
                input.classList.remove('border-red-500');
            }
        }
        return isValid;
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < steps.length - 1) {
                    currentStep++;
                    updateFormSteps();
                    updateProgressBar();
                }
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateFormSteps();
                updateProgressBar();
            }
        });
    });

    // Initial setup
    updateFormSteps();
    updateProgressBar();
    if (simulatorForm.querySelector('input[name="furniture-type"]:checked')) {
        handleFurnitureTypeChange(); // Garante o estado correto no carregamento
    }

    setupSimulatorSliders();
}

function setupSimulatorSliders() {
    const sliders = simulatorForm.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const inputId = slider.dataset.syncInput;
        const numberInput = document.getElementById(inputId);

        // Sync slider from number input
        numberInput.addEventListener('input', (e) => {
            slider.value = e.target.value;
        });

        // Sync number input from slider
        slider.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
        });
    });
}

// Open simulator for specific furniture type
function openSimulator(type) {
    if (type === 'cozinha' || type === 'guarda-roupa') {
        currentSimulatorType = type;
        
        // Set the radio button
        const radioButton = document.querySelector(`#simulator-form input[name="furniture-type"][value="${type}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
        
        // Scroll to simulator
        scrollToSection('simulador');
    } else {
        // Show modal for unsupported types
        showSimulatorModal();
    }
}

function showSimulatorModal() {
    if (simulatorModal) {
        simulatorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeSimulatorModal() {
    if (simulatorModal) {
        simulatorModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Contact form functionality
function setupContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const fileNameSpan = document.getElementById('file-name');
            if (fileInput.files.length > 0) {
                fileNameSpan.textContent = fileInput.files[0].name;
            } else {
                fileNameSpan.textContent = 'Escolher arquivo (planta, foto, etc.)';
            }
        });
    }
}

async function handleContactFormSubmit(e) {
    e.preventDefault();

    // --- Validação do Arquivo ---
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

        if (file.size > MAX_SIZE) {
            showNotification('O arquivo é muito grande. O tamanho máximo é 5MB.', 'error');
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            showNotification('Tipo de arquivo inválido. Apenas JPG, PNG e PDF são permitidos.', 'error');
            return;
        }
    }
    // --- Fim da Validação ---

    
    const requiredInputs = contactForm.querySelectorAll('[required]');
    let isValid = true;
    for (const input of requiredInputs) {
        if (!input.value.trim()) {
            isValid = false;
            showNotification(`O campo "${input.labels[0].textContent.replace('*', '').trim()}" é obrigatório.`, 'error');
            break;
        }
    }
    if (!isValid) {
        return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<div class="spinner mr-2"></div>Enviando...';
    submitButton.disabled = true;
    
    const formData = new FormData(contactForm);
    
    try {
        const response = await fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            contactForm.reset();
            // Reseta o nome do arquivo no label
            if (document.getElementById('file-name')) {
                document.getElementById('file-name').textContent = 'Escolher arquivo (planta, foto, etc.)';
            }
        } else {
            showNotification('Ocorreu um erro ao enviar a mensagem. Tente novamente.', 'error');
        }
    } catch (error) {
        showNotification('Ocorreu um erro de rede. Verifique sua conexão e tente novamente.', 'error');
    } finally {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Notification system
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

// Scroll animations
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(50px)';
    });
}

// Intersection Observer for animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('section, .card-hover, .hover-lift');
    elementsToAnimate.forEach(element => {
        element.classList.add('reveal');
        observer.observe(element);
    });
}

// Gallery Lightbox functionality
function setupGalleryLightbox() {
    const galleryItems = document.querySelectorAll('[data-gallery-item]');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeButton = document.getElementById('lightbox-close');
    const prevButton = document.getElementById('lightbox-prev');
    const nextButton = document.getElementById('lightbox-next');

    if (!galleryItems.length || !lightbox || !closeButton || !prevButton || !nextButton) return;

    const imageSources = Array.from(galleryItems).map(item => item.querySelector('img').src);
    let currentIndex = 0;

    // Elementos focáveis dentro do lightbox
    const focusableElements = [closeButton, prevButton, nextButton];

    function showImage(index) {
        if (index < 0 || index >= imageSources.length) return;
        currentIndex = index;
        lightboxImage.src = imageSources[currentIndex];
        lightbox.classList.remove('hidden');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Foca no botão de fechar ao abrir
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';

        // Devolve o foco para o item da galeria que abriu o lightbox
        const originalItem = galleryItems[currentIndex];
        if (originalItem) {
            // Adiciona um pequeno atraso para garantir que o foco seja definido corretamente
            setTimeout(() => {
                originalItem.focus();
            }, 0);
        }
    }

    function showNext() {
        const nextIndex = (currentIndex + 1) % imageSources.length;
        showImage(nextIndex);
    }

    function showPrev() {
        const prevIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
        showImage(prevIndex);
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            showImage(index);
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    nextButton.addEventListener('click', showNext);
    prevButton.addEventListener('click', showPrev);

    // Close on clicking the background
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();

        // Focus trap
        if (e.key === 'Tab') {
            const firstFocusable = focusableElements[1]; // prevButton
            const lastFocusable = focusableElements[2]; // nextButton

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Lazy loading for images
function setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('fade-in');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
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

// Utility functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance optimizations
const debouncedScrollHandler = debounce(() => {
    // Handle scroll-based animations
    const scrolled = window.pageYOffset;
    const parallax = document.querySelectorAll('.parallax');
    
    parallax.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// SEO and Analytics helpers
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4 event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, parameters);
}

// Track important interactions
document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a');
    if (target) {
        const text = target.textContent.trim();
        const href = target.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            trackEvent('navigation_click', {
                section: href.substring(1),
                text: text
            });
        } else if (target.tagName === 'BUTTON') {
            trackEvent('button_click', {
                button_text: text,
                location: window.location.pathname
            });
        }
        
        // Track WhatsApp clicks
        if (href && href.includes('wa.me')) {
            trackEvent('whatsapp_click', {
                source: 'float_button'
            });
        }
    }
});

// Track form submissions
document.addEventListener('submit', (e) => {
    const form = e.target;
    const formId = form.id || 'unknown_form';
    
    trackEvent('form_submit', {
        form_id: formId,
        form_name: formId.replace('-', ' ')
    });
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.scrollToSection = scrollToSection;
window.openSimulator = openSimulator;
window.requestQuoteFromSimulator = requestQuoteFromSimulator;
window.closeSimulatorModal = closeSimulatorModal;
window.maskPhone = maskPhone;