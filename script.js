// Global variables
let isMenuOpen = false;
let currentSimulatorType = null;
let lastSimulationResult = null; // Armazena o último resultado da simulação

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
    if (simulatorForm) {
        setupMultiStepSimulator();
        simulatorForm.addEventListener('submit', handleSimulatorSubmit);
    }
}

// A função agora lida com o cálculo em tempo real, não apenas com o 'submit'
function handleSimulatorSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(simulatorForm);
        const data = Object.fromEntries(formData);
        
        // Validate required fields
        // A validação agora é feita por etapa, mas uma checagem final é boa
        if (!data['furniture-type'] || !data.material || !data.handles) {
            showNotification('Por favor, preencha todos os campos do simulador.', 'error');
            document.getElementById('result').classList.add('hidden');
            return;
        }
        
        // Calculate price
        const result = calculatePrice(data);
        lastSimulationResult = result; // Salva o resultado globalmente
        displaySimulatorResult(result);
        
        // Scroll to result
        setTimeout(() => {
            document.getElementById('result').scrollIntoView({
                behavior: 'smooth', block: 'start'
            });
        }, 100);
    } catch (error) {
        console.error('Erro no simulador:', error);
        showNotification('Erro ao calcular o preço. Tente novamente.', 'error');
    }
}

function calculatePrice(data) {
    const furnitureType = data['furniture-type'];
    const material = data.material;
    const handles = data.handles || 'padrao';
    const sinkCabinetType = data.sink_cabinet_type || 'none';
    const sinkAreaWidth = parseFloat(data.sink_area_width) || 0;
    const hasHotTower = data.hot_tower === 'on';
    const hotTowerHeight = parseFloat(data.hot_tower_height) || 0;

    let width, height, depth, totalWidth, drawers, extraShelves;

    if (furnitureType === 'cozinha') {
        totalWidth = (parseFloat(data.width1) || 0) + (parseFloat(data.width2) || 0) + (parseFloat(data.width3) || 0);
        height = parseFloat(data.kitchen_height);
        depth = 60 / 100; // Padrão de cozinha
        drawers = parseInt(data.kitchen_drawers) || 0;
        extraShelves = 0; // Prateleiras extras não são um fator principal aqui
    } else { // Guarda-Roupa
        width = parseFloat(data.width);
        height = parseFloat(data.height);
        depth = parseFloat(data.depth) / 100; // Convert cm to meters
        drawers = parseInt(data.drawers) || 0; // Nome do campo é 'drawers' para guarda-roupa
        extraShelves = parseInt(data['extra-shelves']) || 0;
    }
    
    // Constants
    const SHEET_SIZE = 5.88; // m² (2.80m x 2.10m)
    const MATERIAL_PRICES = {
        'branco': 800,  // Price per m² of the front face
        'premium': 1200 // Price per m² of the front face
    };
    const PREMIUM_HANDLE_COST = 150;
    const DRAWER_COST = 250; // Cost per drawer
    const SHELF_COST = 80;   // Cost per extra shelf
    const SINK_CABINET_COSTS = {
        'none': 0,
        'simple': 450, // R$ 450 por metro linear
        'drawers': 800, // R$ 800 por metro linear (com gaveteiro)
        'hot_tower': 900 // R$ 900 por metro linear de altura
    };
    
    let totalArea = 0;
    let frontArea = 0;

    if (furnitureType === 'cozinha') {
        const modules = data.modules ? (Array.isArray(data.modules) ? data.modules : [data.modules]) : [];
        const hasInferior = modules.includes('inferior');
        const hasSuperior = modules.includes('superior');
        
        let inferiorWidth = totalWidth;
        // Se houver um gabinete de pia, subtraia sua largura da largura geral dos armários inferiores
        if (sinkCabinetType !== 'none' && hasInferior && sinkAreaWidth > 0) {
            inferiorWidth = Math.max(0, totalWidth - sinkAreaWidth);
        }

        if (hasInferior) {
            frontArea += inferiorWidth * 0.9; // Altura padrão de armário inferior
        }
        if (hasSuperior) {
            frontArea += totalWidth * 0.8; // Altura padrão de armário superior
        }
        totalArea = frontArea; // Para cozinhas, a área frontal é a principal

    } else { // Guarda-Roupa
        frontArea = width * height;
        const sideArea = 2 * height * depth;
        const topBottomArea = 2 * width * depth;
        totalArea = frontArea + sideArea + topBottomArea;
    }

    const sheetsNeeded = Math.ceil(totalArea / SHEET_SIZE);
    
    // Calculate base price
    const materialPrice = MATERIAL_PRICES[material];
    const basePrice = frontArea * materialPrice;
    
    // Calculate additional costs
    let additionalCosts = 0;
    additionalCosts += (handles === 'premium') ? (sheetsNeeded * PREMIUM_HANDLE_COST) : 0;
    additionalCosts += drawers * DRAWER_COST;
    additionalCosts += (SINK_CABINET_COSTS[sinkCabinetType] || 0) * sinkAreaWidth;

    // Custos específicos do Guarda-Roupa
    if (furnitureType === 'guarda-roupa') {
        if (doorType === 'sliding') {
            additionalCosts += frontArea * 150; // Custo extra por m² para portas de correr
        }
        if (internalFinish === 'wood') {
            additionalCosts += totalArea * 100; // Custo extra por m² de material para acabamento interno madeirado
        }
    }

    if (hasHotTower && hotTowerHeight > 0) {
        additionalCosts += SINK_CABINET_COSTS['hot_tower'] * hotTowerHeight;
        // Adiciona a área da torre ao total para cálculo de chapas
        totalArea += (0.6 * hotTowerHeight) * 2.5; // Área frontal x fator de profundidade/laterais
    }

    additionalCosts += extraShelves * SHELF_COST;
    // Custo de material não frontal (laterais, etc)
    additionalCosts += (totalArea - frontArea) * (materialPrice * 0.7);
    
    const totalPrice = basePrice + additionalCosts;
    
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