// Global variables
let isMenuOpen = false;
let currentSimulatorType = null;

// DOM Elements
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('header');
const simulatorForm = document.getElementById('simulator-form');
const simulatorModal = document.getElementById('simulator-modal');
const contactForm = document.getElementById('contact-form');

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
        simulatorForm.addEventListener('submit', handleSimulatorSubmit);
    }
}

function handleSimulatorSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(simulatorForm);
        const data = Object.fromEntries(formData);
        
        // Validate required fields
        if (!data['furniture-type'] || !data.width || !data.height || !data.material) {
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Calculate price
        const result = calculatePrice(data);
        displaySimulatorResult(result);
        
        // Scroll to result
        setTimeout(() => {
            const resultElement = document.getElementById('result');
            if (resultElement) {
                resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
        
    } catch (error) {
        console.error('Erro no simulador:', error);
        showNotification('Erro ao calcular o preço. Tente novamente.', 'error');
    }
}

function calculatePrice(data) {
    const width = parseFloat(data.width);
    const height = parseFloat(data.height);
    const furnitureType = data['furniture-type'];
    const material = data.material;
    const handles = data.handles || 'padrao';
    
    // Constants
    const SHEET_SIZE = 5.88; // m² (2.80m x 2.10m)
    const MATERIAL_PRICES = {
        'branco': 800,
        'premium': 1200
    };
    const PREMIUM_HANDLE_COST = 150;
    
    // Calculate area and sheets needed
    const totalArea = width * height;
    const sheetsNeeded = Math.ceil(totalArea / SHEET_SIZE);
    
    // Calculate base price
    const materialPrice = MATERIAL_PRICES[material];
    const basePrice = sheetsNeeded * SHEET_SIZE * materialPrice;
    
    // Calculate additional costs
    let additionalCosts = 0;
    if (handles === 'premium') {
        additionalCosts += sheetsNeeded * PREMIUM_HANDLE_COST;
    }
    
    const totalPrice = basePrice + additionalCosts;
    
    return {
        furnitureType,
        width,
        height,
        totalArea: totalArea.toFixed(2),
        sheetsNeeded,
        material,
        materialPrice,
        basePrice,
        handles,
        additionalCosts,
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
                        <span class="font-semibold text-charcoal">${result.width}m × ${result.height}m</span>
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
                </div>
            </div>
            
            <!-- Breakdown de Preços -->
            <div class="bg-white rounded-xl p-6 shadow-lg">
                <h4 class="font-montserrat font-semibold text-xl text-charcoal mb-6">
                    Breakdown de Preços
                </h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center py-2">
                        <span class="text-gray-600">Preço Base (${result.sheetsNeeded} chapas):</span>
                        <span class="font-semibold text-charcoal">R$ ${result.basePrice.toLocaleString('pt-BR')}</span>
                    </div>
                    
                    ${result.additionalCosts > 0 ? `
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-600">Puxadores Premium:</span>
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
                    <button onclick="scrollToSection('contato')" 
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
    
    // Show success notification
    showNotification('Simulação concluída com sucesso!', 'success');
}

// Open simulator for specific furniture type
function openSimulator(type) {
    if (type === 'cozinha' || type === 'guarda-roupa') {
        currentSimulatorType = type;
        
        // Set the radio button
        const radioButton = document.querySelector(`input[name="furniture-type"][value="${type}"]`);
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
}

function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<div class="spinner mr-2"></div>Enviando...';
    submitButton.disabled = true;
    
    // Simulate form submission (replace with actual Formspree integration)
    setTimeout(() => {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
        
        // Reset form
        contactForm.reset();
    }, 2000);
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
window.closeSimulatorModal = closeSimulatorModal;