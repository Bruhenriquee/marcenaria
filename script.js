// Global variables
let isMenuOpen = false;

// =================================================================
// DOM Elements
// =================================================================
// DOM Elements
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('header');
const pageOverlay = document.getElementById('page-overlay');
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
    setupCollapsibleSections();
    observeElements();    
    setupGalleryLightbox();
    setupPdfViewer();    setupTermsModal();
    setupOtherFurnitureModal();
    setupSimulator(); // Re-ativando o simulador da página inicial
    setupLazyLoading();
    setupActiveNavLinks(); // Highlight active nav link on scroll

    console.log('Roni Marceneiro website initialized successfully!');
}

// Mobile menu functionality
function setupMobileMenu() {
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isMenuOpen ? closeMobileMenu() : openMobileMenu();
        });

        // Close menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a, button');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Impede que cliques dentro do menu mobile o fechem imediatamente
        mobileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close menu when clicking on the overlay
        if (pageOverlay) {
            pageOverlay.addEventListener('click', closeMobileMenu);
        }
    }
}

function openMobileMenu() {
    if (isMenuOpen) return;
    isMenuOpen = true;

    const barsIcon = mobileMenuToggle.querySelector('.fa-bars');
    const timesIcon = mobileMenuToggle.querySelector('.fa-times');

    // Animate icons
    barsIcon.classList.add('opacity-0', 'scale-50', 'rotate-90');
    timesIcon.classList.remove('opacity-0', 'scale-50');

    // Show menu
    mobileMenu.classList.remove('translate-x-full');
    mobileMenu.classList.add('is-open'); // For staggered animations
    pageOverlay.classList.remove('opacity-0', 'invisible');
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (!isMenuOpen) return;
    isMenuOpen = false;

    const barsIcon = mobileMenuToggle.querySelector('.fa-bars');
    const timesIcon = mobileMenuToggle.querySelector('.fa-times');

    // Animate icons back
    barsIcon.classList.remove('opacity-0', 'scale-50', 'rotate-90');
    timesIcon.classList.add('opacity-0', 'scale-50');

    mobileMenu.classList.add('translate-x-full');
    mobileMenu.classList.remove('is-open');
    pageOverlay.classList.add('opacity-0', 'invisible');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'auto';
}

// Scroll effects
function setupScrollEffects() {
    const handleScroll = () => {
        if (isMenuOpen) return; // Ignore scroll effects when menu is open
        
        const currentScrollY = window.scrollY;

        if (header) {
            const isScrolled = currentScrollY > 50;
            // When scrolled, it's shrunk.
            header.classList.toggle('header-shrunk', isScrolled);
        }
    };

    // Run handler once on page load to set initial state
    handleScroll();

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

    const animation = (currentTime) => {
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
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Only act if the element has not been revealed yet
                if (!entry.target.classList.contains('revealed')) {
                    entry.target.classList.add('revealed');
    
                    // Check for counters inside the revealed element
                    const counters = entry.target.querySelectorAll('.counter');
                    counters.forEach(counter => {
                        if (counter.dataset.animated === 'true') return;
                        const target = +counter.dataset.countTo;
                        const suffix = counter.dataset.suffix || '';
                        animateCounter(counter, 0, target, 2000, suffix);
                        counter.dataset.animated = 'true';
                    });
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.reveal');
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
}

// Collapsible sections for mobile
function setupCollapsibleSections() {
    const toggles = document.querySelectorAll('.collapsible-toggle-btn');
    const openBtnContainer = document.getElementById('collapsible-open-btn-container');

    toggles.forEach(toggle => {
        const contentIds = toggle.dataset.collapsibleToggle.split(',');
        const contents = contentIds.map(id => document.getElementById(id.trim())).filter(Boolean);

        if (contents.length === 0) return;

        // Adjust initial state for mobile
        if (window.innerWidth < 768) {
            contents.forEach(content => content.classList.add('hidden', 'md:block'));
        } else {
            contents.forEach(content => content.classList.remove('hidden', 'md:block'));
        }

        toggle.addEventListener('click', () => {
            // Check the state of the first content element to decide the action
            const isCurrentlyHidden = contents[0].classList.contains('hidden');

            contents.forEach(content => {
                content.classList.toggle('hidden', !isCurrentlyHidden);
            });

            // Hide the "open" button when content is shown, and show it when content is hidden
            if (openBtnContainer) {
                openBtnContainer.classList.toggle('hidden', isCurrentlyHidden);
            }

            // Scroll to the top of the first content section when opening
            if (isCurrentlyHidden) {
                setTimeout(() => {
                    contents[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                // When closing, scroll to the "open" button's position for better UX
                if (openBtnContainer) {
                    openBtnContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
}

// Service/Portfolio Filter
function setupServiceFilters() {
    const filtersContainer = document.getElementById('service-filters');
    const servicesGrid = document.getElementById('services-grid');

    if (!filtersContainer || !servicesGrid) return;

    const filterButtons = filtersContainer.querySelectorAll('.service-filter-btn');
    const serviceCards = servicesGrid.querySelectorAll('.service-card');

    filtersContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.service-filter-btn');
        if (!targetButton) return;

        const filter = targetButton.dataset.filter;

        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        targetButton.classList.add('active');

        // Filter cards
        serviceCards.forEach(card => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;
            
            // The 'hidden' class from Tailwind handles display:none
            card.classList.toggle('hidden', !shouldShow);
        });
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
        const images = projectElement.dataset.images.split(',');
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

// Terms Modal Logic
function setupTermsModal() {
    const termsModal = document.getElementById('terms-modal');
    if (!termsModal) return;

    const closeBtn = document.getElementById('terms-modal-close');
    const openTriggers = document.querySelectorAll('#open-terms-modal-footer, #open-terms-modal-simulator');

    const openModal = () => {
        termsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        termsModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    openTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior if it's an <a>
            openModal();
        });
    });

    closeBtn.addEventListener('click', closeModal);

    termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !termsModal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// Other Furniture Modal Logic
function setupOtherFurnitureModal() {
    const modal = document.getElementById('other-furniture-modal');
    if (!modal) return;

    const openBtn = document.getElementById('other-furniture-btn');
    const closeBtn = document.getElementById('other-furniture-modal-close');

    const openModal = () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// Active navigation link highlighting on scroll
function setupActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav a.nav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            const navLink = document.querySelector(`header nav a[href="#${id}"]`);
            
            if (navLink && entry.isIntersecting) {
                // Remove 'active' from all links
                navLinks.forEach(link => link.classList.remove('active'));
                // Add 'active' to the intersecting one
                navLink.classList.add('active');
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px', // Trigger when the section is in the middle of the viewport
    });

    sections.forEach(section => observer.observe(section));
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
window.maskPhone = maskPhone; // Make it globally available for oninput attribute

function setupSimulator() {
    // --- STATE ---
    let currentStep = 1;
    const totalSteps = 6;
    const state = {
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
        quote: { area: 0, sheets: 0, total: 0, basePrice: 0, extrasPrice: 0, extrasBreakdown: [] }
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
                    'inox_cor': 100.00,   // Custo ADICIONAL por BARRA de 3m para puxadores premium (inox, preto, dourado).
                    'convencional': 15.00 // Custo por unidade
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
                HANDLE_BAR_COST: { 'aluminio': 75.00, 'inox_cor': 100.00, 'convencional': 15.00 },
                // Custo ADICIONAL por porta/gaveta ao usar puxador premium (se houver algum custo de mão de obra extra).
                HANDLE_PREMIUM_EXTRA_PER_UNIT: 6.00,
                // Comprimento padrão de uma barra de puxador em metros.
                HANDLE_BAR_LENGTH: 3.0,
                // Largura média de uma porta/gaveta em metros. Usado para estimar a quantidade de ferragens.
                UNIT_WIDTH: 0.4,
            }, // Custos de itens extras específicos para cozinha.
            EXTRAS_COST: {
                // Custo por METRO LINEAR de armário de pia (balcão inferior).
                'SINK_CABINET_PER_METER': 450,
                // Custo por METRO LINEAR de altura da torre quente (para forno/micro-ondas).
                'HOT_TOWER_PER_METER': 600,
            }
        },
    };

    function init() {
        setupEventListeners();
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
        disclaimerCheckbox.addEventListener('change', handleDisclaimer);
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
        document.getElementById('view-quote-btn').addEventListener('click', handleViewQuote);
        document.getElementById('pdf-btn').addEventListener('click', generatePDF);
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);
        document.getElementById('email-btn').addEventListener('click', generateEmailLink);

        // Step 6: Breakdown toggle
        const toggleBtn = document.getElementById('toggle-breakdown-btn');
        const breakdownDiv = document.getElementById('result-breakdown');
        toggleBtn.addEventListener('click', () => {
            const isHidden = breakdownDiv.classList.toggle('hidden');
            toggleBtn.querySelector('i').classList.toggle('rotate-180', !isHidden);
            updateContainerHeight();
        });
    }

    // --- UI & NAVIGATION ---
    function handleDisclaimer() {
        // Add a check to prevent errors if the element is not found
        if (simulatorOverlay && disclaimerCheckbox) {
            simulatorOverlay.classList.toggle('is-hidden', disclaimerCheckbox.checked);
        }
    }

    function handleReset() {
        currentStep = 1;
        resetState(); // Resets the internal state object
        resetFormUI(); // Resets the form inputs in the DOM
        updateUI(); // Updates which step is visible
        handleDisclaimer(); // Re-applies the overlay
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
            resetState();
            resetFormUI();
            currentStep = 1; 
            updateUI(false); // Vai para o passo 1 sem scroll
            handleDisclaimer(); // Re-aplica o overlay
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
        const slideCost = numDrawers * config.HARDWARE.SLIDE_COST_PER_DRAWER;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        let numDoors = 0;
        if (hasDoors) {
            if (state.doorType === 'correr') {
                numDoors = Math.max(2, Math.round(width / 1.0));
            } else { // 'abrir'
                numDoors = Math.max(2, Math.round(width / 0.45));
                const totalHinges = numDoors * hingesPerDoor;
                const hingeCost = totalHinges * config.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType];
                const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
                if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });
            }

            if (state.handleType === 'convencional') {
                const cost = numDoors * config.HARDWARE.HANDLE_BAR_COST.convencional;
                if (cost > 0) baseBreakdown.push({ label: `Puxadores Convencionais`, quantity: numDoors, cost: cost });
            } else { // Perfil
                const totalHandleLength = (state.doorType === 'correr' && numDoors >= 2) ? (2 * numDoors - 2) * height : numDoors * height;
                if (totalHandleLength > 0) {
                    const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
                    const handleCost = numBarsNeeded * (config.HARDWARE.HANDLE_BAR_COST[state.handleType] || 0);
                    if (handleCost > 0) baseBreakdown.push({ label: `Barras de Puxador Perfil ${state.handleType}`, quantity: numBarsNeeded, cost: handleCost });
                }
            }
        }

        // 4. Optional Extras
        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            if (cost > 0) extrasBreakdown.push({ label: extra, cost: cost });
        });

        return { baseBreakdown, extrasBreakdown, totalMaterialArea };
    }

    function calculateKitchenQuote() {
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
        const hingeCost = totalHinges * config.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType];
        const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
        if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });

        const slideCostPerDrawer = config.HARDWARE.SLIDE_COST_PER_DRAWER;
        const slideCost = numDrawers * slideCostPerDrawer;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        const totalHandleUnits = numDoors + numDrawers;
        const totalHandleLength = totalHandleUnits * UNIT_WIDTH;
        const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
        
        if (state.handleType === 'convencional') {
            const cost = totalHandleUnits * config.HARDWARE.HANDLE_BAR_COST.convencional;
            if (cost > 0) baseBreakdown.push({ label: `Puxadores Convencionais`, quantity: totalHandleUnits, cost: cost });
        } else if (state.handleType === 'aluminio') {
            const cost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST[state.handleType];
            if (cost > 0) baseBreakdown.push({ label: 'Barras de Puxador Perfil Alumínio', quantity: numBarsNeeded, cost: cost });
        } else if (state.handleType === 'inox_cor') {
            const cost = (numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST[state.handleType]) + (totalHandleUnits * config.HARDWARE.HANDLE_PREMIUM_EXTRA_PER_UNIT);
            if (cost > 0) baseBreakdown.push({ label: `Barras de Puxador Perfil Inox/Cor`, quantity: numBarsNeeded, cost: cost });
        }

        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            if (cost > 0) extrasBreakdown.push({ label: extra, cost: cost });
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

        const { baseBreakdown, extrasBreakdown, totalMaterialArea } = quoteDetails;
        const basePrice = baseBreakdown.reduce((acc, item) => acc + item.cost, 0);
        const extrasPrice = extrasBreakdown.reduce((acc, item) => acc + item.cost, 0);

        // --- LÓGICA DE PRECIFICAÇÃO ALINHADA COM O SIMULADOR PRO ---
        // Aplica um multiplicador sobre o custo de material/ferragens para incluir mão de obra e lucro.
        // O valor é sutilmente maior que o padrão do Simulador Pro (2.0) para criar uma margem de negociação sem assustar o cliente.
        const multiplier = 2.1; 
        const finalTotal = (basePrice * multiplier) + extrasPrice;

        const sheetSize = state.furnitureType === 'Cozinha' ? SIMULATOR_CONFIG.KITCHEN.MDF_SHEET_SIZE : SIMULATOR_CONFIG.WARDROBE.MDF_SHEET_SIZE;
        
        state.quote = { 
            area: totalMaterialArea, 
            sheets: Math.ceil(totalMaterialArea / sheetSize), 
            total: finalTotal,
            basePrice: basePrice,
            baseBreakdown: baseBreakdown,
            extrasPrice: extrasPrice,
            extrasBreakdown: extrasBreakdown
        };
    }

    function resetState() {
        Object.assign(state, {
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
            quote: { area: 0, sheets: 0, total: 0, basePrice: 0, baseBreakdown: [], extrasPrice: 0, extrasBreakdown: [] }
        });
    }

    function resetFormUI() {
        // Uncheck all radio buttons and checkboxes within the simulator
        document.querySelectorAll('#simulador input[type="radio"], #simulador input[type="checkbox"]').forEach(input => {
            if (!input.closest('#accept-disclaimer-checkbox')) { // Don't reset the disclaimer
                input.checked = false;
            }
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
        document.getElementById('leadPhone').value = ''; // This line was duplicated, removing one.
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
            showNotification('O número de celular deve começar com 9 após o DDD.', 'error');
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
            // FIX: Default hardwareType if not selected to prevent calculation errors.
            if (!state.hardwareType) {
                updateStateAndSave({ hardwareType: 'padrao' });
            }

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
        const baseListContainer = document.getElementById('base-price-breakdown-list');
        const extrasListContainer = document.getElementById('extras-breakdown-list');

        document.getElementById('result-total').textContent = `R$ ${state.quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        baseListContainer.innerHTML = ''; // Clear previous
        if (state.quote.baseBreakdown && state.quote.baseBreakdown.length > 0) {
            let baseHTML = '<h5 class="font-semibold text-charcoal mb-2">Componentes do Projeto:</h5><div class="pl-4 border-l-2 border-gold/50 space-y-2">';
            state.quote.baseBreakdown.forEach(item => {
                const quantityText = item.quantity ? `<span class="text-gray-500 text-xs">(Qtd. Aprox: ${item.quantity})</span>` : '';
                baseHTML += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">${item.label} ${quantityText}</span>
                        <span class="font-semibold text-charcoal">R$ ${item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                `;
            });
            baseListContainer.innerHTML = baseHTML + '</div>';
        }

        extrasListContainer.innerHTML = ''; // Clear previous
        if (state.quote.extrasBreakdown && state.quote.extrasBreakdown.length > 0) {
            let extrasHTML = '<h5 class="font-semibold text-charcoal mb-2">Acabamentos e Personalização:</h5>';
            state.quote.extrasBreakdown.forEach(item => {
                extrasHTML += `
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">${item.label}</span>
                        <span class="font-semibold text-charcoal">+ R$ ${item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                `;
            });
            extrasListContainer.innerHTML = extrasHTML;
        }

        // Update visual breakdown bar
        const basePriceBar = document.getElementById('base-price-bar');
        const extrasPriceBar = document.getElementById('extras-price-bar');
        const totalForBar = state.quote.basePrice + state.quote.extrasPrice;

        if (basePriceBar && extrasPriceBar && totalForBar > 0) {
            const basePercentage = (state.quote.basePrice / totalForBar) * 100;
            basePriceBar.style.width = `${basePercentage}%`;
            extrasPriceBar.style.width = `${100 - basePercentage}%`;
            extrasPriceBar.style.left = `${basePercentage}%`;
        }
    }

    function getQuoteAsText() {
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

        let breakdownText = `\n\n*Detalhamento do Valor:*\n- Estrutura e Produção: R$ ${state.quote.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        if (state.quote.extrasBreakdown && state.quote.extrasBreakdown.length > 0) {
            breakdownText += '\n*Acabamentos e Personalização:*';
            state.quote.extrasBreakdown.forEach(item => {
                breakdownText += `\n  - ${item.label}: + R$ ${item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            });
        }

        return `*Orçamento de Móveis Planejados*\n---------------------------------\n*Cliente:* ${state.customer.name}\n*Móvel:* ${state.furnitureType}${formatDetails}${kitchenDetails}\n${details}${projectDetails}\n*Material:* ${state.material} ${state.customColor ? `(Cor: ${state.customColor})` : ''}\n*Puxador:* Perfil ${handleName}${hardwareDetails}\n*Extras:* ${state.extras.join(', ') || 'Nenhum'}\n---------------------------------\n*Total Estimado: ${document.getElementById('result-total').textContent}*${breakdownText}\n\n_Este é um orçamento informativo. O valor final será definido após visita técnica._`;
    }

    async function generatePDF() {
        const pdfBtn = document.getElementById('pdf-btn');
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
            document.getElementById('pdf-base-price').textContent = formatCurrency(state.quote.basePrice);
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
    
            const extrasContainer = document.getElementById('pdf-extras-breakdown');
            extrasContainer.innerHTML = '';
            if (state.quote.extrasBreakdown && state.quote.extrasBreakdown.length > 0) {
                let extrasHTML = '<p class="font-semibold text-charcoal">Acabamentos e Personalização:</p><div class="pl-4 border-l-2 border-gold/50 space-y-1 mt-1">';
                state.quote.extrasBreakdown.forEach(item => {
                    extrasHTML += `<div class="flex justify-between items-center text-sm"><span class="text-gray-600">${item.label}</span><span class="font-semibold">+ ${formatCurrency(item.cost)}</span></div>`;
                });
                extrasHTML += '</div>';
                extrasContainer.innerHTML = extrasHTML;
            }
            // --- End Populate ---
    
            pdfTemplate.classList.remove('hidden');
            const canvas = await html2canvas(pdfTemplate.firstElementChild, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`orcamento-ronimarceneiro-${quoteId}.pdf`);
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
        window.open(`https://wa.me/5518997312957?text=${encodeURIComponent(text)}`, '_blank');
    }

    function generateEmailLink() {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Orçamento de Móveis: ${state.customer.name}`)}&body=${encodeURIComponent(getQuoteAsText())}`;
    }

    init();
}