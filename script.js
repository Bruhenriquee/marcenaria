// Global variables
let isMenuOpen = false;

// =================================================================
// DOM Elements
// =================================================================
// DOM Elements
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('header');
const contactForm = document.getElementById('contact-form');
const fileInput = document.getElementById('attachment');




// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Setup all interactive components of the site
    setupMobileMenu();
    setupScrollEffects();
    // Add smooth scrolling to all anchor links
    setupSmoothScrolling();
    setupContactForm();
    // Initialize AOS-like animations
    observeElements();
    setupGalleryLightbox();
    setupPdfViewer();
    setupSimulator(); // This was the missing call
    setupLazyLoading();
    setupActiveNavLinks(); // Highlight active nav link on scroll

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
        mobileMenu.classList.remove('translate-x-full');
        mobileMenuToggle.innerHTML = '<i class="fas fa-times text-2xl"></i>';
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        header.classList.remove('bg-white/95', 'backdrop-blur-md'); // Remove blur to see menu clearly
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    if (!isMenuOpen) return;
    isMenuOpen = false;
    mobileMenu.classList.add('translate-x-full');
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'auto';
    header.classList.add('bg-white/95', 'backdrop-blur-md');
}

// Scroll effects
function setupScrollEffects() {
    let lastScrollY = window.scrollY;
    const heroImage = document.querySelector('#inicio img');
    let isTicking = false;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;

        if (!isTicking) {
            window.requestAnimationFrame(() => {
                // 1. Header background and shadow
                if (header) {
                    header.classList.toggle('shadow-lg', currentScrollY > 50);
                }

                // 2. Hide/show header on scroll
                if (header) {
                    if (currentScrollY > lastScrollY && currentScrollY > 100) {
                        header.style.transform = 'translateY(-100%)'; // Scrolling down
                    } else {
                        header.style.transform = 'translateY(0)'; // Scrolling up
                    }
                }

                // 3. Parallax effect for hero image
                if (heroImage && currentScrollY < window.innerHeight) {
                    heroImage.style.transform = `translateY(${currentScrollY * 0.3}px)`;
                }

                lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
                isTicking = false;
            });
            isTicking = true;
        }
    };

    window.addEventListener('scroll', handleScroll);
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

        const newMessageBtn = document.getElementById('new-message-btn');
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', () => {
                document.getElementById('contact-form-container').classList.remove('hidden');
                document.getElementById('contact-success-message').classList.add('hidden');
            });
        }
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
            contactForm.reset();
            document.getElementById('contact-form-container').classList.add('hidden');
            document.getElementById('contact-success-message').classList.remove('hidden');
            if (document.getElementById('file-name')) { // Reset file name on success
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

// Function to animate numbers
function animateCounter(element, start, end, duration, suffix = '') {
    let startTime = null;

    function animation(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue + suffix;
        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }
    requestAnimationFrame(animation);
}

// Intersection Observer for animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');

                // Check for counters inside the revealed element
                const counters = entry.target.querySelectorAll('.counter');
                counters.forEach(counter => {
                    if (counter.dataset.animated) return; // Prevent re-animating
                    const target = +counter.dataset.countTo;
                    const suffix = counter.dataset.suffix || '';
                    animateCounter(counter, 0, target, 2000, suffix);
                    counter.dataset.animated = 'true';
                });

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
    const projectItems = document.querySelectorAll('[data-gallery-project]');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const closeButton = document.getElementById('lightbox-close');
    const prevButton = document.getElementById('lightbox-prev');
    const nextButton = document.getElementById('lightbox-next');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const thumbnailsContainer = document.getElementById('lightbox-thumbnails');

    if (!projectItems.length || !lightbox) return;

    let currentProjectImages = [];
    let currentIndex = 0;

    function updateThumbnails() {
        thumbnailsContainer.innerHTML = '';
        currentProjectImages.forEach((src, i) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.className = `w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-all ${i === currentIndex ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`;
            thumb.onclick = () => showImage(i);
            thumbnailsContainer.appendChild(thumb);
        });
        thumbnailsContainer.classList.toggle('hidden', currentProjectImages.length <= 1);
    }

    function showImage(index, isOpening = false) {
        if (index < 0 || index >= currentProjectImages.length) return;
        currentIndex = index;
        lightboxImage.src = currentProjectImages[currentIndex];
        updateThumbnails();

        if (isOpening) {
            lightbox.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            closeButton.focus();
        }
    }

    function openLightbox(projectElement) {
        const images = projectElement.dataset.images.split(',').map(s => s.trim());
        const title = projectElement.dataset.title || '';
        const description = projectElement.dataset.description || '';

        currentProjectImages = images;
        lightboxTitle.textContent = title;
        lightboxDescription.textContent = description;

        showImage(0, true);
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        document.body.style.overflow = 'auto';
        thumbnailsContainer.innerHTML = ''; // Clean up
    }

    function showNext() {
        const nextIndex = (currentIndex + 1) % currentProjectImages.length;
        showImage(nextIndex);
    }

    function showPrev() {
        const prevIndex = (currentIndex - 1 + currentProjectImages.length) % currentProjectImages.length;
        showImage(prevIndex);
    }

    projectItems.forEach(item => {
        item.addEventListener('click', () => {
            openLightbox(item);
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    nextButton.addEventListener('click', showNext);
    prevButton.addEventListener('click', showPrev);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });
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

// Active navigation link highlighting on scroll
function setupActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav a[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${id}`;
                    link.classList.toggle('text-gold', isActive);
                    link.classList.toggle('font-semibold', isActive);
                });
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px', // Trigger when the section is in the middle of the viewport
    });

    sections.forEach(section => {
        observer.observe(section);
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
// O arquivo sw.js não existe, então registrar um Service Worker causará um erro 404.
// Comentado para evitar o erro e melhorar a performance.
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('SW registered: ', registration);
//             })
//             .catch(registrationError => {
//                 console.log('SW registration failed: ', registrationError);
//             });
//     });
// }

// Export functions for global access
window.scrollToSection = scrollToSection;
window.maskPhone = maskPhone;

// =================================================================
// SIMULATOR LOGIC
// =================================================================

// --- CONFIGURATION OBJECT ---
// Todas as variáveis de preço e configuração estão centralizadas aqui para facilitar as atualizações.
// Altere os valores nesta seção para ajustar os preços do simulador.
const SIMULATOR_CONFIG = {
    // =========================================================================
    // CUSTOS COMUNS (Aplicável a Guarda-Roupa e Cozinha)
    // =========================================================================
    COMMON_COSTS: {
        // Custo fixo cobrado se o cliente optar pela criação de um projeto 3D.
        'PROJECT_3D': 350,
        // Custo por METRO LINEAR de fita de LED instalada.
        // O cálculo multiplica este valor pela largura total do móvel.
        'Iluminação LED': 350,
    },
    // =========================================================================
    // CONFIGURAÇÕES DE CÁLCULO PARA GUARDA-ROUPA
    // =========================================================================
    WARDROBE: {
        // O preço do guarda-roupa é calculado com base na ÁREA FRONTAL (largura x altura).
        // Defina aqui o preço por METRO QUADRADO (m²) para cada tipo de material.
        PRICING_PER_M2: {
            'Branco': 800,    // Preço/m² para MDF totalmente branco.
            'Mesclada': 900,  // Preço/m² para estrutura branca e portas coloridas.
            'Premium': 1200,  // Preço/m² para MDF totalmente colorido/texturizado.
        },
        // Área total de uma chapa de MDF (padrão 2.75m * 1.85m = 5.0875 m²). Usado para estimar a quantidade de chapas.
        MDF_SHEET_SIZE: 5.09,
        // Custos de ferragens e puxadores para guarda-roupa.
        HARDWARE: {
            HANDLE_BAR_COST: {
                'aluminio': 0,      // Custo da barra de alumínio (padrão, já incluso no preço/m²).
                'premium': 100.00   // Custo ADICIONAL por BARRA de 3m para puxadores premium (inox, preto, dourado).
            },
            // Comprimento padrão de uma barra de puxador em metros. Usado para calcular quantas barras são necessárias.
            HANDLE_BAR_LENGTH: 3.0,
        },
        // Custos de itens extras específicos para guarda-roupa.
        EXTRAS_COST: {
            // Custo ADICIONAL por m² de área frontal para usar o sistema de portas de correr.
            'Portas de Correr': 250,
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
            'Branco': 240,   // Preço de uma chapa de MDF branco.
            'Premium': 400,  // Preço de uma chapa de MDF colorido/texturizado.
        },
        // Área total de uma chapa de MDF (padrão 2.75m * 1.85m = 5.0875 m²). Usado para calcular a quantidade de chapas.
        MDF_SHEET_SIZE: 5.09,
        // Custos detalhados de ferragens e puxadores.
        HARDWARE: {
            // Custo por PORTA (considerando 2 dobradiças).
            HINGE_COST: { 'padrao': 5.00, 'softclose': 10.00 },
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
            'Porta-temperos': 350,        // Custo FIXO para um porta-temperos embutido.
            'Lixeira Embutida': 400,        // Custo FIXO para uma lixeira embutida.
            // Custo por METRO LINEAR de armário de pia (balcão inferior).
            'SINK_CABINET_PER_METER': 450,
            // Custo por METRO LINEAR de altura da torre quente (para forno/micro-ondas).
            'HOT_TOWER_PER_METER': 600,
        }
    },
};

function setupSimulator() {
    // --- STATE ---
    let currentStep = 1;
    const totalSteps = 6;
    const state = {
        furnitureType: null,
        dimensions: { height: 2.7, depth: 60, walls: [{width: 3, height: 2.7}] }, // walls is now [{width, height}]
        material: 'Branco',
        doorType: 'abrir', // 'abrir' or 'correr'
        wardrobeFormat: 'reto', // 'reto' or 'closet'
        closetHasDoors: true, // for closets
        kitchenHasSinkCabinet: true,
        sinkStoneWidth: 1.8,
        hasHotTower: false,
        hotTowerHeight: 2.2,
        stoveType: 'cooktop', // 'cooktop' or 'piso'
        cooktopLocation: 'pia', // 'pia' or 'separado'
        hardwareType: 'padrao', // 'padrao' or 'softclose'
        handleType: 'aluminio',
        projectOption: 'create', // 'create', 'upload', 'none'
        projectFile: null,
        customColor: '',
        extras: [],
        customer: { name: '', email: '', phone: '' },
        quote: { area: 0, sheets: 0, total: 0, basePrice: 0, extrasPrice: 0 }
    };

    // --- DOM ELEMENTS ---
    const disclaimerCheckbox = document.getElementById('accept-disclaimer-checkbox');
    if (!disclaimerCheckbox) return; // Don't run if simulator HTML is not on the page

    const simulatorOverlay = document.getElementById('simulator-overlay');
    const steps = document.querySelectorAll('.form-step');
    const stepsContainer = document.getElementById('steps-container');
    const progressBarSteps = document.querySelectorAll('.progress-step');
    const progressBarLines = document.querySelectorAll('.progress-line');

    // --- INITIALIZATION ---
    function init() {
        loadStateFromStorage();
        setupEventListeners();
        // Recalculate height on window resize to handle responsive changes. Debounce is defined inline.
        window.addEventListener('resize', debounce(updateContainerHeight, 200));
        updateUI(false); // Pass false to prevent scrolling on initial load
        // If loaded state is not on step 1, unlock the simulator
        if (currentStep > 1 || state.furnitureType) {
            disclaimerCheckbox.checked = true;
            handleDisclaimer();
        }
    }

    // Utility function for debouncing (used only for resize)
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
        localStorage.setItem('simulatorState', JSON.stringify(state));
    }
    function setupEventListeners() {
        disclaimerCheckbox.addEventListener('change', handleDisclaimer);
        
        // Event delegation for navigation buttons
        document.getElementById('simulator-content').addEventListener('click', (e) => {
            if (e.target.closest('.next-btn')) {
                handleNextStep();
            } else if (e.target.closest('.prev-btn')) {
                handlePrevStep();
            } else if (e.target.closest('.remove-wall-btn')) {
                handleRemoveWall(e.target.closest('.remove-wall-btn'));
            } else if (e.target.closest('#reset-btn')) {
                handleReset();
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
        document.getElementById('hotTowerHeight').addEventListener('input', updateDimensionsState);
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
                document.getElementById('hot-tower-height-container').classList.toggle('hidden', !state.hasHotTower);
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

        // Step 5: 3D Project
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
        document.getElementById('view-quote-btn').addEventListener('click', handleViewQuote);
        document.getElementById('pdf-btn').addEventListener('click', generatePDF);
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);
        document.getElementById('email-btn').addEventListener('click', generateEmailLink);
        document.getElementById('competitor-whatsapp-btn').addEventListener('click', generateCompetitorWhatsAppLink);

        // Step 6: Breakdown toggle
        const toggleBtn = document.getElementById('toggle-breakdown-btn');
        const breakdownDiv = document.getElementById('result-breakdown');
        toggleBtn.addEventListener('click', () => {
            const isHidden = breakdownDiv.classList.toggle('hidden');
            toggleBtn.querySelector('i').classList.toggle('rotate-180', !isHidden);
        });
    }

    // --- UI & NAVIGATION ---
    function handleDisclaimer() {
        // Add a check to prevent errors if the element is not found
        if (simulatorOverlay) {
            simulatorOverlay.classList.toggle('is-hidden', disclaimerCheckbox.checked);
        }
    }

    function handleReset() {
        currentStep = 1;
        localStorage.removeItem('simulatorState');
        resetState(); // Resets the internal state object
        resetFormUI(); // Resets the form inputs in the DOM
        updateUI(); // Updates which step is visible
        handleDisclaimer(); // Re-applies the overlay
    }

    function handleNextStep() {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                localStorage.setItem('simulatorStep', currentStep);
                updateUI();
            }
        }
    }

    function handlePrevStep() {
        if (currentStep > 1) {
            currentStep--;
            localStorage.setItem('simulatorStep', currentStep);
            updateUI();
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
        
        // Hide door type selection if it's an open closet
        const doorTypeSection = document.getElementById('door-type-section');
        const isClosetOpen = isCloset && !state.closetHasDoors;
        doorTypeSection.classList.toggle('hidden', isClosetOpen);
        // No need to call updateContainerHeight here, the event listener that calls this function will do it.
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
        newWall.className = 'wall-entry flex items-center gap-4 pt-4 mt-4 border-t';
        newWall.innerHTML = `
            <div class="flex-grow">
                <label for="wardrobe-width${wallCount}" class="block mb-2 font-semibold">Largura Parede ${wallCount} (m)</label>
                <input type="number" id="wardrobe-width${wallCount}" name="wardrobe-width" step="0.1" min="0" value="0" class="form-input">
            </div>
            <button type="button" class="remove-wall-btn text-red-500 hover:text-red-700 transition-colors mt-6" aria-label="Remover parede">
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
        newWall.className = 'wall-entry relative border-t border-gray-200 pt-4 mt-4';
        newWall.innerHTML = `
            <button type="button" class="remove-wall-btn absolute top-4 right-0 text-red-500 hover:text-red-700 transition-colors" aria-label="Remover parede">
                <i class="fas fa-times-circle text-xl"></i>
            </button>
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
            </div>`;
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
            state.hotTowerHeight = parseFloat(document.getElementById('hotTowerHeight').value) || 0;
        }
        // Save state after dimension update
        localStorage.setItem('simulatorState', JSON.stringify(state));
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
            } else { // Cozinha
                const kitchenArea = state.dimensions.walls.reduce((acc, wall) => acc + (wall.width * wall.height), 0);
                if (kitchenArea <= 0 && !state.kitchenHasSinkCabinet) {
                    const firstWidthInput = document.getElementById('kitchen-wall-width1');
                    showNotification('Por favor, adicione as medidas de pelo menos uma parede de armários.', 'error');
                    firstWidthInput?.focus();
                    firstWidthInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            }
        }
        return true;
    }

    function loadStateFromStorage() {
        const savedState = localStorage.getItem('simulatorState');
        const savedStep = localStorage.getItem('simulatorStep');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Merge saved state into the default state to ensure new properties are not missed
            Object.assign(state, parsedState);
        }
        if (savedStep) {
            currentStep = parseInt(savedStep, 10);
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
        const config = SIMULATOR_CONFIG.WARDROBE;

        const { height, depth } = state.dimensions;
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        const depthM = depth / 100;
        const frontArea = width * height;
        const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);
        
        // --- Base Price Calculation (based on m²) ---
        const pricePerM2 = config.PRICING_PER_M2[state.material];
        const basePrice = frontArea * pricePerM2;

        // --- Extras Calculation ---
        let extrasPrice = 0;
        if (state.hardwareType === 'softclose') {
            let hardwareUnits = 0;
            if (hasDoors) {
                if (state.doorType === 'correr') {
                    hardwareUnits += Math.max(2, Math.round(width / 1.0));
                } else {
                    hardwareUnits += Math.max(2, Math.round(width / 0.45));
                }
            }
            hardwareUnits += Math.floor(width * 2);
            extrasPrice += hardwareUnits * config.EXTRAS_COST.HARDWARE_SOFT_CLOSE_PER_UNIT;
        }

        // --- Handle Cost Calculation ---
        if (hasDoors && state.handleType !== 'aluminio') {
            const hardwareConfig = config.HARDWARE;
            let numDoors = 0;
            let totalHandleLength = 0;

            if (state.doorType === 'correr') {
                numDoors = Math.max(2, Math.round(width / 1.0));
                // Portas do meio precisam de puxador dos dois lados.
                // Total de puxadores = 2 (pontas) + (numDoors - 2) * 2 (meio) = 2*numDoors - 2
                if (numDoors >= 2) {
                    totalHandleLength = (2 * numDoors - 2) * height;
                }
            } else { // 'abrir'
                numDoors = Math.max(2, Math.round(width / 0.45));
                totalHandleLength = numDoors * height;
            }

            if (totalHandleLength > 0) {
                const numBarsNeeded = Math.ceil(totalHandleLength / hardwareConfig.HANDLE_BAR_LENGTH);
                extrasPrice += numBarsNeeded * hardwareConfig.HANDLE_BAR_COST.premium;
            }
        }

        if (state.doorType === 'correr' && hasDoors) {
            extrasPrice += config.EXTRAS_COST['Portas de Correr'] * frontArea;
        }

        if (state.projectOption === 'create') {
            extrasPrice += SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            extrasPrice += (extra === 'Iluminação LED') ? cost * width : cost;
        });

        // Estimate material area for display purposes
        const doorsArea = hasDoors ? frontArea : 0;
        const carcassArea = (2 * height * depthM) + (width * depthM) + (width * height);
        const internalArea = frontArea * 1.5;
        const totalMaterialArea = doorsArea + carcassArea + internalArea;

        return { basePrice, extrasPrice, totalMaterialArea };
    }

    function calculateKitchenQuote() {
        const config = SIMULATOR_CONFIG.KITCHEN;
        let extrasPrice = 0;
        let basePrice = 0;

        // Material area calculation
        const totalFrontArea = state.dimensions.walls.reduce((acc, wall) => acc + (wall.width * wall.height), 0);
        const cabinetDepth = 0.6;
        const totalCarcassArea = totalFrontArea * 1.2;
        const totalInternalArea = totalFrontArea * 1.0;
        const totalMaterialArea = totalFrontArea + totalCarcassArea + totalInternalArea;

        // --- Base Price Calculation (based on MDF sheets) ---
        if (state.material === 'Mesclada') {
            const numWhiteSheets = Math.ceil((totalCarcassArea + totalInternalArea) / config.MDF_SHEET_SIZE);
            const numColoredSheets = Math.ceil(totalFrontArea / config.MDF_SHEET_SIZE);
            basePrice = (numWhiteSheets * config.MDF_SHEET_PRICING['Branco']) + (numColoredSheets * config.MDF_SHEET_PRICING['Premium']);
        } else {
            const numSheets = Math.ceil(totalMaterialArea / config.MDF_SHEET_SIZE);
            basePrice = numSheets * config.MDF_SHEET_PRICING[state.material];
        }

        // --- Extras Calculation ---
        if (state.kitchenHasSinkCabinet && state.sinkStoneWidth > 0) {
            const sinkCabinetWidth = Math.max(0, state.sinkStoneWidth - 0.05);
            extrasPrice += sinkCabinetWidth * config.EXTRAS_COST.SINK_CABINET_PER_METER;
        }

        if (state.hasHotTower) {
            extrasPrice += state.hotTowerHeight * config.EXTRAS_COST.HOT_TOWER_PER_METER;
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

        const hingeCostPerDoor = config.HARDWARE.HINGE_COST[state.hardwareType];
        extrasPrice += numDoors * hingeCostPerDoor;

        const slideCostPerDrawer = config.HARDWARE.SLIDE_COST_PER_DRAWER;
        extrasPrice += numDrawers * slideCostPerDrawer;

        const totalHandleUnits = numDoors + numDrawers;
        const totalHandleLength = totalHandleUnits * UNIT_WIDTH;
        const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);

        if (state.handleType === 'aluminio') {
            extrasPrice += numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.aluminio;
        } else {
            extrasPrice += (numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.premium) + (totalHandleUnits * config.HARDWARE.HANDLE_PREMIUM_EXTRA_PER_UNIT);
        }

        if (state.projectOption === 'create') {
            extrasPrice += SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            extrasPrice += (extra === 'Iluminação LED') ? cost * totalWidth : cost;
        });

        return { basePrice, extrasPrice, totalMaterialArea };
    }

    function calculateQuote() {
        let quoteDetails;
        if (state.furnitureType === 'Guarda-Roupa') {
            quoteDetails = calculateWardrobeQuote();
        } else { // Cozinha
            quoteDetails = calculateKitchenQuote();
        }

        const { basePrice, extrasPrice, totalMaterialArea } = quoteDetails;
        const sheetSize = state.furnitureType === 'Cozinha' ? SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_SIZE : SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_SIZE;
        
        state.quote = { 
            area: totalMaterialArea, 
            sheets: Math.ceil(totalMaterialArea / sheetSize), 
            total: basePrice + extrasPrice,
            basePrice: basePrice,
            extrasPrice: extrasPrice
        };
    }

    function resetState() {
        Object.assign(state, {
            furnitureType: null,
            dimensions: { height: 2.7, depth: 60, walls: [{width: 3, height: 2.7}] },
            material: 'Branco',
            doorType: 'abrir',
            wardrobeFormat: 'reto',
            closetHasDoors: true,
            kitchenHasSinkCabinet: true,
            sinkStoneWidth: 1.8,
            hasHotTower: false,
            hotTowerHeight: 2.2,
            stoveType: 'cooktop',
            cooktopLocation: 'pia',
            hardwareType: 'padrao',
            handleType: 'aluminio',
            projectOption: 'create',
            projectFile: null,
            customColor: '',
            extras: [],
            customer: { name: '', email: '', phone: '' },
            quote: { area: 0, sheets: 0, total: 0, basePrice: 0, extrasPrice: 0 }
        });
    }

    function resetFormUI() {
        document.querySelectorAll('input[name="furnitureType"]').forEach(radio => radio.checked = false);
        document.getElementById('wardrobe-width1').value = 3.0;
        document.getElementById('wardrobe-height').value = 2.7;
        const wardrobeWallsContainer = document.getElementById('wardrobe-walls-container');
        Array.from(wardrobeWallsContainer.children).slice(1).forEach(wall => wall.remove());
        document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');
        document.querySelector('input[name="kitchenSink"][value="sim"]').checked = true; // Reset kitchen sink option
        document.getElementById('sinkStoneWidth').value = 1.8; // Reset sink stone width
        document.querySelector('input[name="hasHotTower"][value="nao"]').checked = true;
        document.getElementById('hot-tower-height-container').classList.add('hidden');
        document.getElementById('hotTowerHeight').value = 2.2;
        document.querySelector('input[name="stoveType"][value="cooktop"]').checked = true;
        document.getElementById('cooktop-location-step').classList.remove('hidden');
        document.querySelector('input[name="cooktopLocation"][value="pia"]').checked = true;
        document.getElementById('kitchen-wall-width1').value = 2.2;
        document.getElementById('kitchen-wall-height1').value = 2.7;

        const kitchenWallsContainer = document.getElementById('kitchen-walls-container');
        Array.from(kitchenWallsContainer.children).slice(1).forEach(wall => wall.remove());
        document.getElementById('add-wall-btn').classList.remove('hidden');
        document.querySelector('input[name="material"][value="Branco"]').checked = true;
        document.getElementById('premium-options').classList.add('hidden');
        document.getElementById('customColor').value = '';
        document.querySelector('input[name="doorType"][value="abrir"]').checked = true;
        document.querySelector('input[name="wardrobeFormat"][value="reto"]').checked = true;
        document.querySelector('input[name="closetDoors"][value="sim"]').checked = true;
        document.querySelector('input[name="hardwareType"][value="padrao"]').checked = true;
        document.querySelector('input[name="projectOption"][value="create"]').checked = true;
        document.getElementById('project-upload-container').classList.add('hidden');
        document.getElementById('project-file-input').value = '';
        document.getElementById('project-file-name').textContent = 'Escolher arquivo do projeto';
        document.querySelector('input[name="handleType"][value="aluminio"]').checked = true;
        document.querySelectorAll('input[name="extras"]').forEach(cb => cb.checked = false);
        document.getElementById('leadName').value = '';
        document.getElementById('leadEmail').value = '';
        document.getElementById('leadPhone').value = '';
        disclaimerCheckbox.checked = false;
    }

    async function handleViewQuote() {
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

        if (!state.customer.name) {
            showNotification('Por favor, preencha seu nome para continuar.', 'error');
            leadNameInput.classList.add('invalid');
            leadNameInput.focus();
            return;
        }
        if (!state.customer.phone) {
            showNotification('Por favor, preencha seu WhatsApp para continuar.', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        // --- Validação Avançada de Celular (Brasil) ---
        const phoneDigits = state.customer.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 11) {
            showNotification('Por favor, insira um WhatsApp válido com DDD (11 dígitos).', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        const ddd = phoneDigits.substring(0, 2);
        const validDDDs = [
            '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24',
            '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43',
            '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62',
            '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77',
            '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92',
            '93', '94', '95', '96', '97', '98', '99'
        ];
        if (!validDDDs.includes(ddd)) {
            showNotification('O DDD informado é inválido.', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }

        const numberPart = phoneDigits.substring(2);
        if (numberPart[0] !== '9') {
            showNotification('O número de WhatsApp deve começar com 9 após o DDD.', 'error');
            leadPhoneInput.classList.add('invalid');
            leadPhoneInput.focus();
            return;
        }
        if (/^(\d)\1+$/.test(numberPart.substring(1))) {
            showNotification('Este número de celular parece inválido (sequência repetida).', 'error');
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
            localStorage.setItem('customerData', JSON.stringify(state.customer));
            calculateQuote();
            renderResult();
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight(); // Ajusta a altura do container para mostrar o resultado
        } catch (error) {
            console.error("Error calculating quote:", error);
            showNotification('Ocorreu um erro ao calcular o orçamento. Tente novamente.', 'error');
            // Restore button on error
            viewQuoteBtn.disabled = false;
            viewQuoteBtn.innerHTML = originalBtnText;
        }
    }

    function renderResult() {
        document.getElementById('result-furniture').textContent = state.furnitureType;
        let dimsText = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            dimsText = `Paredes: ${state.dimensions.walls.map(w => w.width).join('m + ')}m | Altura: ${state.dimensions.height}m`;
        } else { // Cozinha
            dimsText = state.dimensions.walls.map(w => `${w.width}m (L) x ${w.height}m (A)`).join(' | ');
        }
        document.getElementById('result-dims').textContent = dimsText;
        document.getElementById('result-sheets').textContent = `${state.quote.sheets} chapas`;
        document.getElementById('result-extras').textContent = state.extras.length > 0 ? state.extras.join(', ') : 'Nenhum';
        document.getElementById('result-total').textContent = `R$ ${state.quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
 
        // Render breakdown
        document.getElementById('result-base-price').textContent = `R$ ${state.quote.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('result-extras-price').textContent = `R$ ${state.quote.extrasPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function getQuoteAsText() {
        let details = `*Dimensões:* ${document.getElementById('result-dims').textContent}`;
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

        return `*Orçamento de Móveis Planejados*\n---------------------------------\n*Cliente:* ${state.customer.name}\n*Móvel:* ${state.furnitureType}${formatDetails}${kitchenDetails}\n${details}${projectDetails}\n*Material:* ${state.material} ${state.customColor ? `(Cor: ${state.customColor})` : ''}\n*Puxador:* Perfil ${handleName}${hardwareDetails}\n*Extras:* ${state.extras.join(', ') || 'Nenhum'}\n---------------------------------\n*Total Estimado: ${document.getElementById('result-total').textContent}*\n\n_Este é um orçamento informativo. O valor final será definido após visita técnica._`;
    }

    function getPdfData() {
        return {
            date: new Date().toLocaleDateString('pt-BR'),
            'quote-id': Date.now(),
            name: state.customer.name,
            email: state.customer.email,
            phone: state.customer.phone,
            furniture: state.furnitureType,
            dims: document.getElementById('result-dims').textContent,
            material: state.material,
            color: state.customColor || 'N/A',
            project: state.projectOption === 'create' ? 'Sim' : (state.projectOption === 'upload' ? 'Fornecido pelo cliente' : 'Não'),
            extras: state.extras.join(', ') || 'Nenhum',
            total: document.getElementById('result-total').textContent
        };
    }

    async function generatePDF() {
        const pdfBtn = document.getElementById('pdf-btn');
        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Gerando...';

        try {
            const { jsPDF } = window.jspdf;
            const pdfTemplate = document.getElementById('pdf-template');
            const pdfData = getPdfData();

            ['date', 'quote-id', 'name', 'email', 'phone', 'furniture', 'dims', 'material', 'color', 'project', 'extras', 'total'].forEach(id => {
                const el = document.getElementById(`pdf-${id}`);
                if (el) el.textContent = pdfData[id];
            });

            pdfTemplate.classList.remove('hidden');
            const canvas = await html2canvas(pdfTemplate.firstElementChild, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
            pdf.save(`orcamento-${state.customer.name.split(' ')[0] || 'cliente'}.pdf`);
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
        window.open(`https://wa.me/5518981558125?text=${encodeURIComponent(text)}`, '_blank');
    }

    function generateCompetitorWhatsAppLink() {
        const text = `Olá! Fiz uma simulação no site (Total: ${document.getElementById('result-total').textContent}) e gostaria de uma análise comparativa, pois já tenho um orçamento de outra empresa.`;
        window.open(`https://wa.me/5518981558125?text=${encodeURIComponent(text)}`, '_blank');
    }

    function generateEmailLink() {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Orçamento de Móveis: ${state.customer.name}`)}&body=${encodeURIComponent(getQuoteAsText())}`;
    }

    init();
}