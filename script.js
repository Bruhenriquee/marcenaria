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
window.maskPhone = maskPhone;

// =================================================================
// SIMULATOR LOGIC
// =================================================================
function setupSimulator() {
    // --- CONFIGURATION ---
    const PRICING = {
        'Branco': 800,
        'Premium': 1200,
    };
    const HANDLE_PRICES_PER_METER = {
        'aluminio': 0, // Padrão, já incluso
        'inox': 90,
        'preto': 100,
        'dourado': 150,
    };
    const EXTRAS_COST = {
        'Iluminação LED': 350,   // per meter
        'Portas de Correr': 250, // per m² of front area
        'Porta com Espelho': 700, // fixed price per door/unit
        'Gaveteiro com Chave': 200, // fixed price
        'Porta-temperos': 350, // fixed price
        'Lixeira Embutida': 400, // fixed price
        'SINK_CABINET_PER_METER': 450, // Special cost for sink cabinet
        'HOT_TOWER_PER_METER': 600, // Cost per linear meter of height
        'HARDWARE_SOFT_CLOSE_PER_UNIT': 80, // Per door or drawer
        'PROJECT_3D': 350, // Fixed cost for 3D project design
    };
    const MDF_SHEET_SIZE = 5.88; // 2.80m * 2.10m

    // --- STATE ---
    let currentStep = 1;
    const totalSteps = 6;
    const state = {
        furnitureType: null,
        dimensions: { width: 3, height: 2.7, depth: 60, walls: [4] },
        material: 'Branco',
        doorType: 'abrir', // 'abrir' or 'correr'
        wardrobeFormat: 'reto', // 'reto' or 'closet'
        closetHasDoors: true, // for closets
        kitchenHasSinkCabinet: true,
        sinkStoneWidth: 1.8,
        hasHotTower: false,
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
        setupEventListeners();
        updateUI();
    }

    function setupEventListeners() {
        disclaimerCheckbox.addEventListener('change', handleDisclaimer);

        // Event delegation for navigation buttons
        stepsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.next-btn')) {
                handleNextStep();
            } else if (e.target.closest('.prev-btn')) {
                handlePrevStep();
            } else if (e.target.closest('#reset-btn')) {
                handleReset();
            }
        });

        // Step 1: Furniture Type
        document.querySelectorAll('input[name="furnitureType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.furnitureType = e.target.value;
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
                state.wardrobeFormat = e.target.value;
                updateWardrobeSubSteps();
            });
        });

        // Step 2.2: Closet Doors
        document.querySelectorAll('input[name="closetDoors"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.closetHasDoors = e.target.value === 'sim';
                updateWardrobeRecommendation();
            });
        });

        // Step 2: Kitchen Sink
        document.querySelectorAll('input[name="kitchenSink"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.kitchenHasSinkCabinet = e.target.value === 'sim';
                updateKitchenSubSteps();
            });
        });

        // Step 2: Kitchen Hot Tower
        document.querySelectorAll('input[name="hasHotTower"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.hasHotTower = e.target.value === 'sim';
            });
        });

        // Step 2: Kitchen Stove Type
        document.querySelectorAll('input[name="stoveType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.stoveType = e.target.value;
                document.getElementById('cooktop-location-step').classList.toggle('hidden', e.target.value !== 'cooktop');
            });
        });

        // Step 2: Cooktop Location
        document.querySelectorAll('input[name="cooktopLocation"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.cooktopLocation = e.target.value;
            });
        });

        // Step 5: 3D Project
        document.querySelectorAll('input[name="projectOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.projectOption = e.target.value;
                document.getElementById('project-upload-container').classList.toggle('hidden', e.target.value !== 'upload');
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
                state.projectFile = file;
                document.getElementById('project-file-name').textContent = file.name;
            }
        });

        // Step 3: Material
        document.querySelectorAll('input[name="material"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.material = e.target.value;
                document.getElementById('premium-options').classList.toggle('hidden', e.target.value !== 'Premium');
            });
        });
        document.getElementById('customColor').addEventListener('input', (e) => state.customColor = e.target.value);

        // Step 4: Door Type (Wardrobe)
        document.querySelectorAll('input[name="doorType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.doorType = e.target.value;
            });
        });

        // Step 4: Hardware Type
        document.querySelectorAll('input[name="hardwareType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.hardwareType = e.target.value;
            });
        });

        // Step 4: Handle Type
        document.querySelectorAll('input[name="handleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.handleType = e.target.value;
            });
        });

        // Step 4: Extras
        document.querySelectorAll('input[name="extras"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                state.extras = Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(cb => cb.value);
            });
        });
        
        // Step 6: Lead Capture & Result
        document.getElementById('view-quote-btn').addEventListener('click', handleViewQuote);
        document.getElementById('pdf-btn').addEventListener('click', generatePDF);
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);
        document.getElementById('email-btn').addEventListener('click', generateEmailLink);
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
        resetState();
        resetFormUI();
        updateUI();
        handleDisclaimer(); // Re-apply overlay
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

    function updateUI() {
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
    }

    function updateWardrobeSubSteps() {
        const isCloset = state.wardrobeFormat === 'closet';
        document.getElementById('closet-door-step').classList.toggle('hidden', !isCloset);
        document.getElementById('add-wardrobe-wall-btn').classList.toggle('hidden', !isCloset);
        
        // Hide door type selection if it's an open closet
        const doorTypeSection = document.getElementById('door-type-section');
        const isClosetOpen = isCloset && !state.closetHasDoors;
        doorTypeSection.classList.toggle('hidden', isClosetOpen);
    }

    function updateKitchenSubSteps() {
        const hasSinkCabinet = state.kitchenHasSinkCabinet;
        document.getElementById('sink-stone-width-container').classList.toggle('hidden', !hasSinkCabinet);
    }

    function addWardrobeWall() {
        const container = document.getElementById('wardrobe-walls-container');
        const wallCount = container.children.length + 1;
        if (wallCount > 3) return; // Max 3 walls for a closet (U-shape)
        const newWall = document.createElement('div');
        newWall.innerHTML = `<label for="wardrobe-width${wallCount}" class="block mb-2 font-semibold">Largura Parede ${wallCount} (m)</label><input type="number" id="wardrobe-width${wallCount}" name="wardrobe-width" step="0.1" min="0" value="0" class="form-input">`;
        container.appendChild(newWall);
        newWall.querySelector('input').addEventListener('input', updateDimensionsState);
        if (wallCount === 3) {
            document.getElementById('add-wardrobe-wall-btn').classList.add('hidden');
        }
    }

    function addKitchenWall() {
        const container = document.getElementById('kitchen-walls-container');
        const wallCount = container.children.length + 1;
        if (wallCount > 3) return;
        const newWall = document.createElement('div');
        newWall.innerHTML = `<label for="kitchen-wall${wallCount}" class="block mb-2 font-semibold">Largura Parede ${wallCount} (m)</label><input type="number" id="kitchen-wall${wallCount}" name="kitchen-wall" step="0.1" min="0" value="0" class="form-input">`;
        container.appendChild(newWall);
        newWall.querySelector('input').addEventListener('input', updateDimensionsState);
        if (wallCount === 3) {
            document.getElementById('add-wall-btn').classList.add('hidden');
        }
    }

    function updateDimensionsState() {
        if (state.furnitureType === 'Guarda-Roupa') {
            state.dimensions.walls = Array.from(document.querySelectorAll('#wardrobe-walls-container input')).map(input => parseFloat(input.value) || 0);
            state.dimensions.height = parseFloat(document.getElementById('wardrobe-height').value) || 0;
            updateWardrobeRecommendation();
        } else {
            state.dimensions.walls = Array.from(document.querySelectorAll('#kitchen-walls-container input')).map(input => parseFloat(input.value) || 0);
            state.sinkStoneWidth = parseFloat(document.getElementById('sinkStoneWidth').value) || 0;
            state.dimensions.height = parseFloat(document.getElementById('kitchenHeight').value) || 0;
        }
    }

    function validateStep(step) {
        if (step === 1 && !state.furnitureType) {
            alert('Por favor, escolha um tipo de móvel.');
            return false;
        }
        if (step === 2) {
            if (state.furnitureType === 'Guarda-Roupa' && (state.dimensions.walls.reduce((a, b) => a + b, 0) <= 0 || state.dimensions.height <= 0)) {
                alert('Por favor, preencha a largura e altura.');
                return false;
            }
            if (state.furnitureType === 'Cozinha' && ((state.dimensions.walls.reduce((a, b) => a + b, 0) <= 0 && !state.kitchenHasSinkCabinet) || state.dimensions.height <= 0)) {
                alert('Por favor, preencha a largura de pelo menos uma parede e a altura.');
                return false;
            }
        }
        return true;
    }

    function updateWardrobeRecommendation() {
        const recommendationDiv = document.getElementById('wardrobe-recommendation');
        const recommendationText = document.getElementById('recommendation-text');
        const width = state.dimensions.walls.reduce((a, b) => a + b, 0);

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
        const hingedDoors = Math.max(2, Math.round(width / 0.5));
        const slidingDoors = Math.max(2, Math.round(width / 1.0));

        recommendationText.textContent = `Para esta largura, recomendamos aproximadamente ${hingedDoors} portas de abrir ou ${slidingDoors} portas de correr.`;
        recommendationDiv.classList.remove('hidden');
    }

    function calculateQuote() {
        let totalMaterialArea = 0;
        let frontArea = 0;
        let basePrice = 0;
        let extrasPrice = 0;
        const materialPrice = PRICING[state.material];

        if (state.furnitureType === 'Guarda-Roupa') {
            const { height, depth } = state.dimensions;
            const width = state.dimensions.walls.reduce((a, b) => a + b, 0);
            const depthM = depth / 100;
            frontArea = width * height;

            const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);

            // Calculation based on components
            const doorsArea = hasDoors ? frontArea : 0;
            const carcassArea = (2 * height * depthM) + (width * depthM) + (width * height); // 2 sides, 1 bottom, 1 back
            const internalArea = frontArea * 1.5; // Estimate for shelves and dividers

            totalMaterialArea = doorsArea + carcassArea + internalArea;
            basePrice = frontArea * materialPrice; // Base price remains on front area as per industry standard
        } else { // Cozinha
            let otherWallsWidth = state.dimensions.walls.reduce((a, b) => a + b, 0);
            const lowerCabinetHeight = 0.9;
            const upperCabinetHeight = 0.7;
            const cabinetDepth = 0.6; // Average depth
            let totalFrontArea = 0;

            // Calculate sink cabinet if it exists
            if (state.kitchenHasSinkCabinet && state.sinkStoneWidth > 0) {
                const sinkCabinetWidth = Math.max(0, state.sinkStoneWidth - 0.05); // 2.5cm gutter on each side
                const sinkFrontArea = sinkCabinetWidth * lowerCabinetHeight;
                const sinkCarcassArea = (sinkCabinetWidth * cabinetDepth) + (sinkFrontArea); // 1 bottom, 1 back
                totalMaterialArea += sinkFrontArea + sinkCarcassArea;
                totalFrontArea += sinkFrontArea;
                extrasPrice += sinkCabinetWidth * EXTRAS_COST.SINK_CABINET_PER_METER;
            }

            // Calculate hot tower if it exists
            if (state.hasHotTower) {
                const towerWidth = 0.6;
                const towerFrontArea = towerWidth * state.dimensions.height;
                const towerCarcassArea = (2 * state.dimensions.height * cabinetDepth) + towerFrontArea;
                totalMaterialArea += towerFrontArea + towerCarcassArea;
                totalFrontArea += towerFrontArea;
                extrasPrice += state.dimensions.height * EXTRAS_COST.HOT_TOWER_PER_METER;
            }

            // Calculate remaining cabinets
            let otherLowerWidth = otherWallsWidth;
            if (state.stoveType === 'piso') {
                otherLowerWidth -= 0.75; // Subtract standard freestanding stove width
            }
            otherLowerWidth = Math.max(0, otherLowerWidth);
            const otherUpperWidth = otherWallsWidth;

            const otherLowerFrontArea = otherLowerWidth * lowerCabinetHeight;
            const otherUpperFrontArea = otherUpperWidth * upperCabinetHeight;
            const otherFrontArea = otherLowerFrontArea + otherUpperFrontArea;
            const otherCarcassArea = (otherWallsWidth * cabinetDepth * 2) + otherFrontArea;
            const otherInternalArea = otherFrontArea * 1.2;
            totalMaterialArea += otherFrontArea + otherCarcassArea + otherInternalArea;
            totalFrontArea += otherFrontArea;

            basePrice = totalFrontArea * materialPrice;
        }

        // Calculate hardware cost
        if (state.hardwareType === 'softclose') {
            let hardwareUnits = 0;
            if (state.furnitureType === 'Guarda-Roupa') {
                const width = state.dimensions.walls.reduce((a, b) => a + b, 0);
                const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);
                if (hasDoors) {
                    if (state.doorType === 'correr') {
                        hardwareUnits += Math.max(2, Math.round(width / 1.0)); // Sliding doors
                    } else {
                        hardwareUnits += Math.max(2, Math.round(width / 0.5)); // Hinged doors
                    }
                }
                hardwareUnits += Math.floor(width * 2); // Estimate 2 drawers per meter of width
            } else { // Cozinha
                // Estimate doors/drawers based on front area. Assume average unit size is 0.5m²
                if (frontArea > 0) {
                    hardwareUnits += Math.ceil(frontArea / 0.5);
                }
            }
            extrasPrice += hardwareUnits * EXTRAS_COST.HARDWARE_SOFT_CLOSE_PER_UNIT;
        }

        // Add cost for 3D project
        if (state.projectOption === 'create') {
            extrasPrice += EXTRAS_COST.PROJECT_3D;
        }

        // Add cost for sliding doors
        if (state.furnitureType === 'Guarda-Roupa' && state.doorType === 'correr' && state.closetHasDoors) {
            extrasPrice += EXTRAS_COST['Portas de Correr'] * frontArea;
        }

        // Calculate handle cost
        const handlePricePerMeter = HANDLE_PRICES_PER_METER[state.handleType] || 0;
        const hasHandles = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);

        if (handlePricePerMeter > 0 && hasHandles) {
            let handleLength = 0;
            if (state.furnitureType === 'Guarda-Roupa') {
                handleLength = state.dimensions.walls.reduce((a, b) => a + b, 0) * 2; // Simplified: assumes two horizontal profiles
            } else { // Cozinha
                handleLength = state.dimensions.walls.reduce((a, b) => a + b, 0) * 2; // Lower and upper cabinets
            }
            extrasPrice += handleLength * handlePricePerMeter;
        }

        state.extras.forEach(extra => {
            const cost = EXTRAS_COST[extra] || 0;
            if (extra === 'Iluminação LED') {
                const length = state.furnitureType === 'Guarda-Roupa' ? state.dimensions.walls.reduce((a, b) => a + b, 0) : state.dimensions.walls.reduce((a, b) => a + b, 0);
                extrasPrice += cost * length;
            } else {
                extrasPrice += cost;
            }
        });
        state.quote = { 
            area: totalMaterialArea, 
            sheets: Math.ceil(totalMaterialArea / MDF_SHEET_SIZE), 
            total: basePrice + extrasPrice,
            basePrice: basePrice,
            extrasPrice: extrasPrice
        };
    }

    function resetState() {
        Object.assign(state, {
            furnitureType: null,
            dimensions: { width: 3, height: 2.7, depth: 60, walls: [4] },
            material: 'Branco',
            doorType: 'abrir',
            wardrobeFormat: 'reto',
            closetHasDoors: true,
            kitchenHasSinkCabinet: true,
            sinkStoneWidth: 1.8,
            hasHotTower: false,
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
        document.querySelector('input[name="stoveType"][value="cooktop"]').checked = true;
        document.getElementById('cooktop-location-step').classList.remove('hidden');
        document.querySelector('input[name="cooktopLocation"][value="pia"]').checked = true;
        document.getElementById('kitchen-wall1').value = 2.2;
        document.getElementById('kitchenHeight').value = 2.7;
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

    function handleViewQuote() {
        Object.assign(state.customer, { name: document.getElementById('leadName').value, email: document.getElementById('leadEmail').value, phone: document.getElementById('leadPhone').value });
        if (!state.customer.name || !state.customer.phone) {
            alert('Por favor, preencha todos os campos para continuar.');
            return;
        }
        localStorage.setItem('customerData', JSON.stringify(state.customer));
        calculateQuote();
        renderResult();
        document.getElementById('lead-capture-form').classList.add('hidden');
        document.getElementById('result-container').classList.remove('hidden');
    }

    function renderResult() {
        document.getElementById('result-furniture').textContent = state.furnitureType;
        const dimsText = state.furnitureType === 'Guarda-Roupa' ? `Paredes: ${state.dimensions.walls.join('m + ')}m | Altura: ${state.dimensions.height}m` : `Paredes: ${state.dimensions.walls.join('m + ')}m | Altura: ${state.dimensions.height}m`;
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

    async function generatePDF() {
        const { jsPDF } = window.jspdf;
        const pdfTemplate = document.getElementById('pdf-template');
        ['date', 'quote-id', 'name', 'email', 'phone', 'furniture', 'dims', 'material', 'color', 'project', 'extras', 'total'].forEach(id => {
            const el = document.getElementById(`pdf-${id}`);
            if(el) el.textContent = {
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
            }[id];
        });
        pdfTemplate.classList.remove('hidden');
        const canvas = await html2canvas(pdfTemplate.firstElementChild, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
        pdf.save(`orcamento-${state.customer.name.split(' ')[0]}.pdf`);
        pdfTemplate.classList.add('hidden');
    }

    function generateWhatsAppLink() {
        let text = getQuoteAsText();
        if (state.projectOption === 'upload' && state.projectFile) {
            text += '\n\n*(Anexei o arquivo do meu projeto no simulador. Por favor, me informe como posso enviá-lo.)*';
        }
        window.open(`https://wa.me/5518981558125?text=${encodeURIComponent(text)}`, '_blank');
    }

    function generateEmailLink() {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Orçamento de Móveis: ${state.customer.name}`)}&body=${encodeURIComponent(getQuoteAsText())}`;
    }

    init();
}