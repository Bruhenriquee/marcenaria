// Global variables
let isMenuOpen = false;

/**
 * =================================================================
 * LÓGICA DE CÁLCULO DE PEÇAS E OTIMIZAÇÃO DE CORTE
 * (Copiado e adaptado do script-pro.js para garantir consistência)
 * =================================================================
 */

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

function getWardrobeParts(walls, height, depth, numDrawers, hasDoors, numDoors) {
    const thickness = 15; // MDF thickness in mm
    const mdf15Parts = [];
    const mdf3Parts = [];

    const totalWidth = walls.reduce((acc, wall) => acc + wall.width, 0);
    mdf15Parts.push({ w: height, h: depth, description: 'Lateral Esquerda' });
    mdf15Parts.push({ w: height, h: depth, description: 'Lateral Direita' });
    mdf15Parts.push(...splitLargePart(totalWidth, depth, 'Tampo'));
    mdf15Parts.push(...splitLargePart(totalWidth, depth, 'Base'));

    const internalHeight = height - (2 * thickness);
    const numModules = Math.ceil(totalWidth / 900);
    const numDividers = numModules - 1;
    const internalModuleWidth = (totalWidth - (2 * thickness) - (numDividers * thickness)) / numModules;

    for (let i = 0; i < numDividers; i++) {
        mdf15Parts.push({ w: internalHeight, h: depth, description: `Divisória ${i+1}` });
    }

    for (let i = 0; i < numModules; i++) {
        const numShelves = Math.floor(height / 800);
        for (let s = 0; s < numShelves; s++) {
            mdf15Parts.push({ w: internalModuleWidth, h: depth - 20, description: `Prateleira ${i+1}-${s+1}` });
        }
    }

    if (hasDoors) {
        const doorWidth = totalWidth / numDoors;
        for (let i = 0; i < numDoors; i++) {
            mdf15Parts.push({ w: doorWidth, h: height, description: 'Porta' });
        }
    }

    const drawerWidth = Math.min(500, internalModuleWidth - 40);
    const drawerDepth = depth - 50;
    const drawerBoxWidth = drawerWidth - 40;
    const drawerBoxDepth = drawerDepth - 50;

    for (let i = 0; i < numDrawers; i++) {
        mdf15Parts.push({ w: drawerWidth, h: 200, description: 'Frente de Gaveta' });
        mdf15Parts.push({ w: drawerBoxDepth, h: 180, description: 'Lateral de Gaveta' });
        mdf15Parts.push({ w: drawerBoxDepth, h: 180, description: 'Lateral de Gaveta' });
        mdf15Parts.push({ w: drawerBoxWidth, h: 180, description: 'Fundo de Gaveta' });
        mdf3Parts.push({ w: drawerBoxWidth, h: drawerBoxDepth, description: 'Fundo de Gaveta (3mm)' });
    }

    walls.forEach((wall, index) => {
        mdf3Parts.push(...splitLargePart(wall.width, height, `Painel de Fundo Parede ${index + 1}`));
    });

    return { mdf15Parts, mdf3Parts };
}

function getKitchenParts(walls, numDrawers) {
    const thickness = 15;
    const mdf15Parts = [];
    const mdf3Parts = [];
    let drawersToCreate = numDrawers;

    walls.forEach(wall => {
        const { width, height } = wall;
        const lowerCabinetHeight = 850;
        const spaceBetween = 650;
        const upperCabinetHeight = Math.max(0, height - lowerCabinetHeight - spaceBetween);
        const cabinetDepth = 600;

        if (upperCabinetHeight > 0) {
            const numUpperCabinets = Math.floor(width / 600);
            for (let i = 0; i < numUpperCabinets; i++) {
                const moduleWidth = 600;
                mdf15Parts.push({ w: moduleWidth, h: cabinetDepth, description: 'Tampo Superior' });
                mdf15Parts.push({ w: moduleWidth, h: cabinetDepth, description: 'Base Superior' });
                mdf15Parts.push({ w: upperCabinetHeight - (2 * thickness), h: cabinetDepth, description: 'Lateral Superior' });
                mdf15Parts.push({ w: upperCabinetHeight - (2 * thickness), h: cabinetDepth, description: 'Lateral Superior' });
                mdf15Parts.push({ w: moduleWidth - 4, h: upperCabinetHeight - 4, description: 'Porta Superior' });
                mdf3Parts.push({ w: moduleWidth, h: upperCabinetHeight, description: 'Fundo Superior' });
            }
        }

        const numLowerCabinets = Math.floor(width / 600);
        for (let i = 0; i < numLowerCabinets; i++) {
            const moduleWidth = 600;
            const moduleDepth = cabinetDepth;
            const moduleHeight = lowerCabinetHeight;

            mdf15Parts.push({ w: moduleWidth, h: moduleDepth, description: 'Travessa Inferior' });
            mdf15Parts.push({ w: moduleWidth, h: moduleDepth, description: 'Base Inferior' });
            mdf15Parts.push({ w: moduleHeight - thickness, h: moduleDepth, description: 'Lateral Inferior' });
            mdf15Parts.push({ w: moduleHeight - thickness, h: moduleDepth, description: 'Lateral Inferior' });
            mdf3Parts.push({ w: moduleWidth, h: moduleHeight, description: 'Fundo Inferior' });

            if (drawersToCreate > 0) {
                const numDrawersInModule = Math.min(drawersToCreate, 3);
                const drawerFrontHeight = (moduleHeight - (numDrawersInModule * 4)) / numDrawersInModule;
                const drawerBoxHeight = drawerFrontHeight - 20;

                for (let d = 0; d < numDrawersInModule; d++) {
                    const drawerBoxWidth = moduleWidth - 40;
                    const drawerBoxDepth = moduleDepth - 50;
                    mdf15Parts.push({ w: moduleWidth - 4, h: drawerFrontHeight, description: 'Frente de Gaveta' });
                    mdf15Parts.push({ w: drawerBoxWidth, h: drawerBoxHeight, description: 'Lateral de Gaveta' });
                    mdf15Parts.push({ w: drawerBoxWidth, h: drawerBoxHeight, description: 'Lateral de Gaveta' });
                    mdf15Parts.push({ w: drawerBoxWidth, h: drawerBoxHeight, description: 'Fundo de Gaveta' });
                    mdf3Parts.push({ w: drawerBoxWidth, h: drawerBoxDepth, description: 'Fundo de Gaveta (3mm)' });
                }
                drawersToCreate -= numDrawersInModule;
            } else {
                mdf15Parts.push({ w: moduleWidth - 4, h: moduleHeight - 4, description: 'Porta Inferior' });
            }
        }
    });

    return { mdf15Parts, mdf3Parts };
}

function optimizeCutting(parts, sheetWidth, sheetHeight) {
    if (!parts || parts.length === 0) return [];

    const processedParts = parts.map(part => {
        const newPart = { ...part };
        if (newPart.h > sheetHeight && newPart.h <= sheetWidth && newPart.w <= sheetHeight) {
            [newPart.w, newPart.h] = [newPart.h, newPart.w];
            newPart.rotated = true;
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
            if (part.fit) packedParts.push(part);
            else {
                delete part.fit;
                unpackedParts.push(part);
            }
        });
        if (packedParts.length === 0 && unpackedParts.length > 0) {
            console.warn("Não foi possível encaixar as peças restantes:", unpackedParts);
            break;
        }
        if (packedParts.length > 0) sheets.push(packedParts);
        remainingParts = unpackedParts;
    }
    return sheets;
}

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


document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupMobileMenu();
    setupScrollEffects();
    setupSmoothScrolling();
    setupContactForm();
    setupCollapsibleSections();
    observeElements();    
    setupGalleryLightbox();
    setupPdfViewer();    setupTermsModal();
    setupOtherFurnitureModal();
    setupSimulator();
    setupInstagramModal();
    setupLazyLoading();
    setupActiveNavLinks();

    console.log('Roni Marceneiro website initialized successfully!');
}

function setupMobileMenu() {
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isMenuOpen ? closeMobileMenu() : openMobileMenu();
        });

        const mobileLinks = mobileMenu.querySelectorAll('a, button');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        mobileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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

    barsIcon.classList.add('opacity-0', 'scale-50', 'rotate-90');
    timesIcon.classList.remove('opacity-0', 'scale-50');

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

    barsIcon.classList.remove('opacity-0', 'scale-50', 'rotate-90');
    timesIcon.classList.add('opacity-0', 'scale-50');

    mobileMenu.classList.add('translate-x-full');
    mobileMenu.classList.remove('is-open');
    pageOverlay.classList.add('opacity-0', 'invisible');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'auto';
}

function setupScrollEffects() {
    const handleScroll = () => {
        if (isMenuOpen) return; // Ignore scroll effects when menu is open
        
        const currentScrollY = window.scrollY;

        if (header) {
            const isScrolled = currentScrollY > 50;
            header.classList.toggle('header-shrunk', isScrolled);
        }
    };

    // Run handler once on page load to set initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
}

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
                
                if (isMenuOpen) {
                    closeMobileMenu();
                }
            }
        });
    });
}

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
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

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

function observeElements() {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!entry.target.classList.contains('revealed')) {
                    entry.target.classList.add('revealed');
    
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
    
    const elementsToAnimate = document.querySelectorAll('.reveal');
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
}

function setupCollapsibleSections() {
    const toggles = document.querySelectorAll('.collapsible-toggle-btn');
    const openBtnContainer = document.getElementById('collapsible-open-btn-container');

    toggles.forEach(toggle => {
        const contentIds = toggle.dataset.collapsibleToggle.split(',');
        const contents = contentIds.map(id => document.getElementById(id.trim())).filter(Boolean);

        if (contents.length === 0) return;

        if (window.innerWidth < 768) {
            contents.forEach(content => content.classList.add('hidden', 'md:block'));
        } else {
            contents.forEach(content => content.classList.remove('hidden', 'md:block'));
        }

        toggle.addEventListener('click', () => {
            const isCurrentlyHidden = contents[0].classList.contains('hidden');

            contents.forEach(content => {
                content.classList.toggle('hidden', !isCurrentlyHidden);
            });

            if (openBtnContainer) {
                openBtnContainer.classList.toggle('hidden', isCurrentlyHidden);
            }

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

        filterButtons.forEach(btn => btn.classList.remove('active'));
        targetButton.classList.add('active');

        serviceCards.forEach(card => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;
            
            card.classList.toggle('hidden', !shouldShow);
        });
    });
}

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
        thumbnailsContainer.innerHTML = '';
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
        pdfIframe.src = '';
        document.body.style.overflow = 'auto';
    };

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
            e.preventDefault();
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

function setupInstagramModal() {
    const modal = document.getElementById('instagram-modal');
    if (!modal) return;

    const openBtn = document.getElementById('open-instagram-modal-btn');
    const closeBtn = document.getElementById('instagram-modal-close');
    const iframe = document.getElementById('instagram-iframe');
    const instagramUrl = "https://www.instagram.com/roni.marceneiro/embed";

    const openModal = () => {
        iframe.src = instagramUrl;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        iframe.src = ""; // Limpa o src para parar o carregamento
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
}


function setupActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav a.nav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            const navLink = document.querySelector(`header nav a[href="#${id}"]`);
            
            if (navLink && entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('active'));
                navLink.classList.add('active');
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px',
    });

    sections.forEach(section => observer.observe(section));
}
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

window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
});

function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
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
        
        if (href && href.includes('wa.me')) {
            trackEvent('whatsapp_click', {
                source: 'float_button'
            });
        }
    }
});

document.addEventListener('submit', (e) => {
    const form = e.target;
    const formId = form.id || 'unknown_form';
    
    trackEvent('form_submit', {
        form_id: formId,
        form_name: formId.replace('-', ' ')
    });
});

window.scrollToSection = scrollToSection;

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
        numDrawers: 4, // Adicionado para consistência
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
    if (!disclaimerCheckbox) return;
    
    const simulatorOverlay = document.getElementById('simulator-overlay');
    const steps = document.querySelectorAll('.form-step');
    const stepsContainer = document.getElementById('steps-container');
    const progressBarSteps = document.querySelectorAll('.progress-step');
    const progressBarLines = document.querySelectorAll('.progress-line');

    // --- INITIALIZATION ---
    const SIMULATOR_CONFIG = {
        MDF_FUNDO_COST: 140, // Custo da chapa de fundo (3mm)
        EDGE_TAPE_COST_PER_METER: 2.5, // Custo da fita de borda por metro
        MDF_3MM_SHEET_SIZE: 5.09, // Tamanho da chapa de 3mm

        COMMON_COSTS: {
            // Custo fixo cobrado se o cliente optar pela criação de um projeto 3D.
            'PROJECT_3D': 350,
        },
        WARDROBE: {
            // Preço por CHAPA de MDF.
            MDF_SHEET_PRICING: {
                'Branco': 240,
                'Premium': 400,
            },
            // Área total de uma chapa de MDF (padrão 2.75m * 1.85m = 5.0875 m²). Usado para estimar a quantidade de chapas.
            MDF_SHEET_SIZE: 5.09,
            // Custos de ferragens e puxadores para guarda-roupa.
            HARDWARE: {
                HANDLE_BAR_COST: {
                    'aluminio': 75.00,
                    'inox_cor': 100.00,
                    'convencional': 15.00 // Custo por unidade
                },
                // Comprimento padrão de uma barra de puxador em metros. Usado para calcular quantas barras são necessárias.
                HANDLE_BAR_LENGTH: 3.0,
                // Custo por UNIDADE de dobradiça. O sistema calcula a quantidade com base na altura da porta.
                HINGE_COST_PER_UNIT: { 'padrao': 2.50, 'softclose': 5.00 }, // Alinhado com o PRO
                // Custo do PAR de corrediças por GAVETA.
                SLIDE_COST_PER_DRAWER: 20.00,
            },
            // Custos de itens extras específicos para guarda-roupa.
            EXTRAS_COST: {
                // Custo FIXO por CADA porta que tiver espelho.
                'Porta com Espelho': 700,
            }
        },
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
                HINGE_COST_PER_UNIT: { 'padrao': 2.50, 'softclose': 5.00 }, // Alinhado com o PRO
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

    function getQuoteAsHtml() {
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const styles = `
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
                .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { color: #2F2F2F; margin: 0; font-size: 24px; }
                .header p { color: #D4AF37; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; }
                .section { margin-bottom: 20px; }
                .section h2 { font-size: 18px; color: #2F2F2F; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
                .details-table { width: 100%; border-collapse: collapse; }
                .details-table td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
                .details-table td:first-child { color: #555; width: 40%; }
                .details-table td:last-child { font-weight: bold; color: #2F2F2F; }
                .total { text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin-top: 20px; }
                .total h3 { margin: 0; color: #555; font-size: 16px; }
                .total p { margin: 5px 0 0; font-size: 32px; font-weight: bold; color: #D4AF37; }
            </style>
        `;

        let projectDetailsHtml = '';
        if (state.furnitureType === 'Guarda-Roupa') {
            projectDetailsHtml += `<tr><td>Largura Total</td><td>${state.dimensions.walls.map(w => w.width).join('m + ')}m</td></tr>`;
            projectDetailsHtml += `<tr><td>Altura</td><td>${state.dimensions.height}m</td></tr>`;
            if (state.wardrobeFormat === 'closet') {
                projectDetailsHtml += `<tr><td>Formato</td><td>Closet ${state.closetHasDoors ? 'Fechado' : 'Aberto'}</td></tr>`;
            }
        } else { // Cozinha
            state.dimensions.walls.forEach((wall, index) => {
                projectDetailsHtml += `<tr><td>Parede ${index + 1}</td><td>${wall.width}m (Largura) x ${wall.height}m (Altura)</td></tr>`;
            });
            if (state.kitchenHasSinkCabinet) {
                projectDetailsHtml += `<tr><td>Balcão de Pia</td><td>Sim (${state.sinkStoneWidth}m)</td></tr>`;
            }
        }

        let handleHtml = state.handleType ? `<tr><td>Puxador</td><td>${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}</td></tr>` : '';
        let extrasHtml = state.extras.length > 0 ? `<tr><td>Extras</td><td>${state.extras.join(', ')}</td></tr>` : '';
        let project3DHtml = `<tr><td>Projeto 3D</td><td>${state.projectOption === 'create' ? 'Solicitado' : (state.projectOption === 'upload' ? 'Cliente possui' : 'Não solicitado')}</td></tr>`;

        const body = `
            ${styles}
            <div class="container">
                <div class="header">
                    <h1>Roni Marceneiro</h1>
                    <p>Móveis Planejados</p>
                </div>
                <div class="section">
                    <h2>Novo Lead do Simulador!</h2>
                    <table class="details-table">
                        <tr><td>Nome do Cliente</td><td>${state.customer.name}</td></tr>
                        <tr><td>WhatsApp</td><td><a href="https://wa.me/55${state.customer.phone.replace(/\D/g, '')}">${state.customer.phone}</a></td></tr>
                        <tr><td>E-mail</td><td><a href="mailto:${state.customer.email}">${state.customer.email}</a></td></tr>
                    </table>
                </div>
                <div class="section">
                    <h2>Resumo do Projeto</h2>
                    <table class="details-table">
                        <tr><td>Tipo de Móvel</td><td>${state.furnitureType}</td></tr>
                        ${projectDetailsHtml}
                        <tr><td>Material</td><td>${state.material}${state.customColor ? ` (${state.customColor})` : ''}</td></tr>
                        <tr><td>Ferragens</td><td>${state.hardwareType === 'softclose' ? 'Soft-close' : 'Padrão'}</td></tr>
                        ${handleHtml}
                        ${extrasHtml}
                        ${project3DHtml}
                    </table>
                </div>
                <div class="total">
                    <h3>Valor Total Estimado</h3>
                    <p>${formatCurrency(state.quote.total)}</p>
                </div>
            </div>
        `;
        return body;
    }

    const DISPOSABLE_DOMAINS = [
        '10minutemail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com', 
        'throwawaymail.com', 'getairmail.com', 'yopmail.com', 'fakemail.net'
    ];

    async function submitToFormspree() {
        const formspreeEndpoint = "https://formspree.io/f/manpjzjv"; // SEU ID JÁ ESTÁ AQUI
        const formData = new FormData();
        formData.append("_subject", `Novo Lead do Simulador: ${state.customer.name} - ${state.furnitureType}`);
        formData.append("_replyto", state.customer.email);

        // Enviando dados como texto simples para garantir compatibilidade com anexos
        formData.append("Nome Cliente", state.customer.name);
        formData.append("WhatsApp", state.customer.phone);
        formData.append("E-mail", state.customer.email);
        formData.append("Resumo do Orçamento", getQuoteAsText(true));

        // Anexa o arquivo do projeto, se existir
        if (state.projectFile) {
            formData.append("attachment", state.projectFile);
        }

        try {
            await fetch(formspreeEndpoint, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });
            console.log("Lead do simulador enviado para o Formspree.");
        } catch (error) {
            console.error("Erro ao enviar lead para o Formspree:", error);
        }
    }

    function init() {
        setupEventListeners();
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
        disclaimerCheckbox.addEventListener('change', handleDisclaimer);
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

        document.querySelectorAll('input[name="kitchenSink"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ kitchenHasSinkCabinet: e.target.value === 'sim' });
                updateKitchenSubSteps();
                updateContainerHeight();
            });
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
                    e.target.value = ''; // Clear the input
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

        const numDrawersInput = document.getElementById('numDrawers');
        if (numDrawersInput) {
            numDrawersInput.addEventListener('input', (e) => {
                updateStateAndSave({
                    numDrawers: parseInt(e.target.value) || 0
                });
            });
        }
        const kitchenNumDrawersInput = document.getElementById('kitchenNumDrawers');
        if (kitchenNumDrawersInput) {
            kitchenNumDrawersInput.addEventListener('input', (e) => {
                updateStateAndSave({
                    numDrawers: parseInt(e.target.value) || 0
                });
            });
        }
        document.querySelectorAll('input[name="doorType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateStateAndSave({ doorType: e.target.value });
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
        
        document.getElementById('view-quote-btn').addEventListener('click', handleViewQuote);
        document.getElementById('whatsapp-btn').addEventListener('click', generateWhatsAppLink);
    }

    // --- UI & NAVIGATION ---
    function handleDisclaimer() {
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
            updateUI(false);
            handleDisclaimer(); // Re-aplica o overlay
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
        const hasSinkCabinet = state.kitchenHasSinkCabinet;
        document.getElementById('sink-stone-width-container').classList.toggle('hidden', !hasSinkCabinet);
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
        const numDrawersInput = document.getElementById('numDrawers');
        if (numDrawersInput) {
            state.numDrawers = parseInt(numDrawersInput.value) || 0;
        }
            updateWardrobeRecommendation();
        } else {
            const widths = Array.from(document.querySelectorAll('input[name="kitchen-wall-width"]')).map(input => parseFloat(input.value) || 0);
            const heights = Array.from(document.querySelectorAll('input[name="kitchen-wall-height"]')).map(input => parseFloat(input.value) || 0);
            state.dimensions.walls = widths.map((w, i) => ({ width: w, height: heights[i] || 0 }));
            state.sinkStoneWidth = parseFloat(document.getElementById('sinkStoneWidth').value) || 0;
        const kitchenNumDrawersInput = document.getElementById('kitchenNumDrawers');
        if (kitchenNumDrawersInput) {
            state.numDrawers = parseInt(kitchenNumDrawersInput.value) || 0;
        }
        }
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
                if (state.wardrobeFormat === 'closet' && state.closetHasDoors === null) {
                    showNotification('Informe se o seu closet terá portas.', 'error');
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
            } else { // Cozinha (valida puxador sempre)
                if (!state.handleType) {
                    showNotification('Por favor, escolha o tipo de puxador.', 'error');
                    return false;
                }
            }
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

        const hingedDoors = Math.max(2, Math.round(width / 0.45));
        const slidingDoors = Math.max(2, Math.round(width / 1.0));

        recommendationText.textContent = `Para esta largura, recomendamos aproximadamente ${hingedDoors} portas de abrir ou ${slidingDoors} portas de correr.`;
        recommendationDiv.classList.remove('hidden');
        updateContainerHeight();
    }

    function calculateEdgeTapeCost(parts) {
        const totalPerimeter = parts.reduce((acc, part) => acc + 2 * (part.w + part.h), 0) / 1000; // em metros
        const edgeTapeUsageFactor = 0.7; // Fator realista: assume que ~70% das bordas recebem fita.
        const edgeTapeCost = totalPerimeter * edgeTapeUsageFactor * SIMULATOR_CONFIG.EDGE_TAPE_COST_PER_METER;
        if (edgeTapeCost > 0) {
            return { label: 'Fita de Borda', quantity: Math.round(totalPerimeter * edgeTapeUsageFactor), cost: edgeTapeCost };
        }
        return null;
    }

    function calculateWardrobeQuote() {
        const config = SIMULATOR_CONFIG.WARDROBE;
        const { height } = state.dimensions;
        const width = state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0);
        const hasDoors = !(state.wardrobeFormat === 'closet' && !state.closetHasDoors);

        state.numDrawers = Math.max(2, Math.floor(width * 2));

        let hingesPerDoor = 2; // Mínimo
        if (height > 1.5) hingesPerDoor = 3; // Lógica de dobradiças alinhada com o PRO
        if (height > 2.0) hingesPerDoor = 4; // Lógica de dobradiças alinhada com o PRO
        if (height > 2.5) hingesPerDoor = 5; // Lógica de dobradiças alinhada com o PRO

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

        // 1. Custo de MDF (usando otimizador de corte)
        const { mdf15Parts: allParts, mdf3Parts: backAndBottomParts } = getWardrobeParts(state.dimensions.walls.map(w => ({ width: w.width * 1000, height: w.height * 1000 })), height * 1000, state.dimensions.depth * 10, state.numDrawers, hasDoors, numDoors);
        let sheets = [];

        if (state.material === 'Mesclada') {
            let premiumParts;
            let whiteParts;

            if (hasDoors) {
                premiumParts = allParts.filter(p => p.description.includes('Porta'));
                whiteParts = allParts.filter(p => !p.description.includes('Porta'));
            } else {
                premiumParts = allParts.filter(p => p.description.includes('Frente de Gaveta'));
                whiteParts = allParts.filter(p => !p.description.includes('Frente de Gaveta'));
            }
            const premiumSheets = optimizeCutting(premiumParts, 2750, 1850);
            const whiteSheets = optimizeCutting(whiteParts, 2750, 1850);
            
            if (whiteSheets.length > 0) baseBreakdown.push({ label: 'Chapas de MDF Branco (Interno)', quantity: whiteSheets.length, cost: whiteSheets.length * config.MDF_SHEET_PRICING['Branco'] });
            if (premiumSheets.length > 0) baseBreakdown.push({ label: 'Chapas de MDF Premium (Frentes)', quantity: premiumSheets.length, cost: premiumSheets.length * config.MDF_SHEET_PRICING['Premium'] });
        } else {
            sheets = optimizeCutting(allParts, 2750, 1850);
            const mdfCost = sheets.length * config.MDF_SHEET_PRICING[state.material];
            const materialLabel = state.material === 'Branco' ? 'Chapas de MDF Branco' : 'Chapas de MDF Premium';
            if (mdfCost > 0) baseBreakdown.push({ label: materialLabel, quantity: sheets.length, cost: mdfCost });
        }

        const total3mmArea = backAndBottomParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000; // em m²
        const numBackPanelSheets = Math.ceil(total3mmArea / 5.09); // 5.09m² é a área da chapa
        if (numBackPanelSheets > 0) {
            baseBreakdown.push({ label: 'Chapas de Fundo (3mm)', quantity: numBackPanelSheets, cost: numBackPanelSheets * SIMULATOR_CONFIG.MDF_FUNDO_COST });
        }

        const numDrawers = state.numDrawers;
        const slideCost = numDrawers * config.HARDWARE.SLIDE_COST_PER_DRAWER;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        if (hasDoors) {
            if (state.doorType === 'abrir') {
                const totalHinges = numDoors * hingesPerDoor;
                const hingeCost = totalHinges * (config.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType] || config.HARDWARE.HINGE_COST_PER_UNIT['padrao']);
                const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
                if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });
            }

            if (state.handleType === 'convencional') {
                const cost = numDoors * config.HARDWARE.HANDLE_BAR_COST.convencional;
                if (cost > 0) baseBreakdown.push({ label: 'Puxadores Convencionais', quantity: numDoors, cost: cost });
            } else { // Perfil
                const totalHandleLength = (state.doorType === 'correr' && numDoors >= 2) ? (2 * numDoors - 2) * height : numDoors * height;
                if (totalHandleLength > 0) {
                    const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
                    let handleCost = 0;
                    if (state.handleType === 'aluminio') handleCost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.aluminio;
                    if (state.handleType === 'inox_cor') handleCost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST.inox_cor;
                    const label = state.handleType === 'aluminio' ? 'Barras de Puxador Perfil Alumínio' : 'Barras de Puxador Perfil Inox/Cor';
                    if (handleCost > 0) baseBreakdown.push({ label: label, quantity: numBarsNeeded, cost: handleCost });
                }
            }
        }

        const edgeTapeBreakdown = calculateEdgeTapeCost(allParts);
        if (edgeTapeBreakdown) baseBreakdown.push(edgeTapeBreakdown);

        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || 0;
            if (cost > 0) extrasBreakdown.push({ label: extra, cost: cost });
        });

        const totalMaterialArea = allParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000;
        return { baseBreakdown, extrasBreakdown, totalMaterialArea };
    }

    function calculateKitchenQuote() {
        const config = SIMULATOR_CONFIG.KITCHEN;
        const baseBreakdown = [];
        const extrasBreakdown = [];
        const numDrawers = state.numDrawers;

        state.numDrawers = Math.max(2, Math.floor(state.dimensions.walls.reduce((acc, wall) => acc + wall.width, 0) * 2));

        const { mdf15Parts: parts, mdf3Parts: backAndBottomParts } = getKitchenParts(state.dimensions.walls.map(wall => ({ width: wall.width * 1000, height: wall.height * 1000 })), numDrawers);
        let sheets = [];

        if (state.material === 'Mesclada') {
            const frontParts = parts.filter(p => p.description.includes('Porta') || p.description.includes('Frente de Gaveta'));
            const carcassParts = parts.filter(p => !p.description.includes('Porta') && !p.description.includes('Frente de Gaveta'));
            const premiumSheets = optimizeCutting(frontParts, 2750, 1850);
            const whiteSheets = optimizeCutting(carcassParts, 2750, 1850);
            if (whiteSheets.length > 0) baseBreakdown.push({ label: 'Chapas de MDF Branco (Interno)', quantity: whiteSheets.length, cost: whiteSheets.length * config.MDF_SHEET_PRICING['Branco'] });
            if (premiumSheets.length > 0) baseBreakdown.push({ label: 'Chapas de MDF Premium (Frentes)', quantity: premiumSheets.length, cost: premiumSheets.length * config.MDF_SHEET_PRICING['Premium'] });
        } else {
            sheets = optimizeCutting(parts, 2750, 1850);
            const mdfCost = sheets.length * config.MDF_SHEET_PRICING[state.material];
            if (mdfCost > 0) baseBreakdown.push({ label: `Chapas de MDF ${state.material}`, quantity: sheets.length, cost: mdfCost });
        }

        const total3mmArea = backAndBottomParts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000; // em m²
        const numBackPanelSheets = Math.ceil(total3mmArea / 5.09); // 5.09m² é a área da chapa
        if (numBackPanelSheets > 0) {
            baseBreakdown.push({ label: 'Chapas de Fundo (3mm)', quantity: numBackPanelSheets, cost: numBackPanelSheets * SIMULATOR_CONFIG.MDF_FUNDO_COST });
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

        const numDoors = parts.filter(p => p.description.includes('Porta')).length;
        const hingesPerDoor = 2;
        const totalHinges = numDoors * hingesPerDoor;
        const hingeCost = totalHinges * (config.HARDWARE.HINGE_COST_PER_UNIT[state.hardwareType] || config.HARDWARE.HINGE_COST_PER_UNIT['padrao']);
        const hingeLabel = state.hardwareType === 'softclose' ? 'Dobradiças Soft-close' : 'Dobradiças Padrão';
        if (hingeCost > 0) baseBreakdown.push({ label: hingeLabel, quantity: totalHinges, cost: hingeCost });

        const slideCost = numDrawers * config.HARDWARE.SLIDE_COST_PER_DRAWER;
        if (slideCost > 0) baseBreakdown.push({ label: 'Pares de Corrediças de Gaveta', quantity: numDrawers, cost: slideCost });

        const totalHandleUnits = numDoors + numDrawers;
        const UNIT_WIDTH = config.HARDWARE.UNIT_WIDTH;
        const totalHandleLength = totalHandleUnits * UNIT_WIDTH;
        const numBarsNeeded = Math.ceil(totalHandleLength / config.HARDWARE.HANDLE_BAR_LENGTH);
        
        if (state.handleType === 'convencional') {
            const cost = totalHandleUnits * config.HARDWARE.HANDLE_BAR_COST.convencional;
            if (cost > 0) baseBreakdown.push({ label: 'Puxadores Convencionais', quantity: totalHandleUnits, cost: cost });
        } else if (state.handleType === 'aluminio') {
            const cost = numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST[state.handleType];
            if (cost > 0) baseBreakdown.push({ label: 'Barras de Puxador Perfil Alumínio', quantity: numBarsNeeded, cost: cost });
        } else if (state.handleType === 'inox_cor') {
            const cost = (numBarsNeeded * config.HARDWARE.HANDLE_BAR_COST[state.handleType]) + (totalHandleUnits * config.HARDWARE.HANDLE_PREMIUM_EXTRA_PER_UNIT);
            if (cost > 0) baseBreakdown.push({ label: 'Barras de Puxador Perfil Inox/Cor', quantity: numBarsNeeded, cost: cost });
        }

        const edgeTapeBreakdown = calculateEdgeTapeCost(parts);
        if (edgeTapeBreakdown) baseBreakdown.push(edgeTapeBreakdown);

        if (state.projectOption === 'create') {
            const cost = SIMULATOR_CONFIG.COMMON_COSTS.PROJECT_3D;
            if (cost > 0) extrasBreakdown.push({ label: 'Criação do Projeto 3D', cost });
        }

        state.extras.forEach(extra => {
            const cost = config.EXTRAS_COST[extra] || SIMULATOR_CONFIG.COMMON_COSTS[extra] || 0;
            if (cost > 0) extrasBreakdown.push({ label: extra, cost: cost });
        });

        const totalMaterialArea = parts.reduce((acc, part) => acc + (part.w * part.h), 0) / 1000000;
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

        const randomMarginMultiplier = parseFloat((Math.random() * (2.20 - 2.06) + 2.06).toFixed(3));
        const finalTotal = (basePrice * randomMarginMultiplier) + extrasPrice;

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
            numDrawers: 4,
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
        document.querySelectorAll('#simulador input[type="radio"], #simulador input[type="checkbox"]').forEach(input => {
            if (!input.closest('#accept-disclaimer-checkbox')) { // Don't reset the disclaimer
                input.checked = false;
            }
        });

        document.getElementById('wardrobe-width1').value = 3.0;
        document.getElementById('wardrobe-height').value = 2.7;
        const wardrobeWallsContainer = document.getElementById('wardrobe-walls-container');
        Array.from(wardrobeWallsContainer.children).slice(1).forEach(wall => wall.remove());
        document.getElementById('add-wardrobe-wall-btn').classList.remove('hidden');
        document.getElementById('sinkStoneWidth').value = 1.8;
        document.getElementById('cooktop-location-step').classList.add('hidden');
        document.getElementById('numDrawers').value = 4;
        document.getElementById('kitchenNumDrawers').value = 4;
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
        disclaimerCheckbox.checked = false;
    }

    async function handleViewQuote() {
        const viewQuoteBtn = document.getElementById('view-quote-btn');
        const originalBtnText = viewQuoteBtn.innerHTML;
        const leadNameInput = document.getElementById('leadName');
        const leadPhoneInput = document.getElementById('leadPhone');
        const leadEmailInput = document.getElementById('leadEmail');

        [leadNameInput, leadPhoneInput, leadEmailInput].forEach(input => {
            input.classList.remove('invalid');
            input.addEventListener('input', () => input.classList.remove('invalid'), { once: true });
        });

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
        if (state.customer.email) {
            const emailDomain = state.customer.email.split('@')[1];
            if (DISPOSABLE_DOMAINS.includes(emailDomain.toLowerCase())) {
                showNotification('Por favor, utilize um e-mail válido e permanente, não um endereço temporário.', 'error');
                leadEmailInput.classList.add('invalid');
                leadEmailInput.focus();
                return;
            }
        }

        viewQuoteBtn.disabled = true;
        viewQuoteBtn.innerHTML = '<div class="spinner mr-2"></div>Calculando...';

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            if (!state.hardwareType) {
                updateStateAndSave({ hardwareType: 'padrao' });
            }

            calculateQuote();
            renderResult();
            document.getElementById('lead-capture-form').classList.add('hidden');
            document.getElementById('result-container').classList.remove('hidden');
            updateContainerHeight();

            // Envia os dados para o Formspree em segundo plano
            submitToFormspree();
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

        const hasDoors = state.furnitureType === 'Cozinha' || (state.wardrobeFormat === 'reto' || (state.wardrobeFormat === 'closet' && state.closetHasDoors));
        if (hasDoors) {
            specsHTML += createSpecCard('fa-grip-horizontal', 'Puxador', `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
        }
        specsHTML += createSpecCard('fa-cogs', 'Ferragens', state.hardwareType === 'padrao' ? 'Padrão' : 'Soft-close');

        const extrasText = state.extras.length > 0 ? state.extras.join(', ') : 'Nenhum';
        specsHTML += createSpecCard('fa-plus-circle', 'Extras', extrasText);

        specsContainer.innerHTML = specsHTML;

        document.getElementById('result-total').textContent = `R$ ${state.quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const memorialStructure = document.getElementById('memorial-structure');
        const memorialHardware = document.getElementById('memorial-hardware');
        const memorialServices = document.getElementById('memorial-services');

        if (memorialStructure && memorialHardware && memorialServices) {
            let materialDescription = '';
            if (state.material === 'Branco') {
                materialDescription = 'Projeto 100% em MDF Branco TX, garantindo um visual clean, durável e de fácil limpeza.';
            } else if (state.material === 'Mesclada') {
                materialDescription = `Estrutura interna em MDF Branco TX e frentes no padrão MDF Premium ${state.customColor ? `(${state.customColor})` : '(cor a definir)'}, combinando economia e design sofisticado.`;
            } else { // Premium
                materialDescription = `Projeto 100% no padrão MDF Premium ${state.customColor ? `(${state.customColor})` : '(cor a definir)'}, para um acabamento exclusivo e de alto padrão.`;
            }
            memorialStructure.textContent = materialDescription;

            const hardwareDescription = state.hardwareType === 'softclose' 
                ? 'Ferragens de alto padrão com sistema de amortecimento (soft-close) nas dobradiças das portas, proporcionando um fechamento suave e silencioso.'
                : 'Ferragens de alta resistência, com dobradiças e corrediças que garantem o funcionamento perfeito do seu móvel por muitos anos.';
            memorialHardware.textContent = hardwareDescription;

            memorialServices.textContent = 'Sua proposta inclui nossa consultoria completa, visita técnica para medição de precisão, entrega, montagem por equipe própria e garantia total de 5 anos.';
        }

        const qualityChecklistContainer = document.getElementById('quality-checklist');
        const extrasContainer = document.getElementById('result-extras');

        if (qualityChecklistContainer && extrasContainer) {
            let checklistHTML = '<h5 class="font-semibold text-charcoal mb-3">O que está incluso:</h5><div class="space-y-2">';
            const checklistItems = new Set();

            if (state.quote.baseBreakdown && state.quote.baseBreakdown.length > 0) {
                checklistItems.add('Estrutura 100% em MDF de alta densidade');
                checklistItems.add('Fundo protetor em chapa de 3mm');
                checklistItems.add(`Dobradiças de alta resistência ${state.hardwareType === 'softclose' ? 'com amortecimento' : ''}`);
                checklistItems.add('Corrediças metálicas para gavetas');
                if (state.handleType) {
                    checklistItems.add(`Puxadores modelo ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}`);
                }
            }

            checklistItems.forEach(item => {
                checklistHTML += `
                    <div class="flex items-center gap-2 text-gray-700">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span>${item}</span>
                    </div>`;
            });
            checklistHTML += '</div>';
            qualityChecklistContainer.innerHTML = checklistHTML;

            let extrasHTML = '<h5 class="font-semibold text-charcoal mb-2">Serviços Adicionais:</h5><ul class="space-y-1 text-gray-600">';
            if (state.quote.extrasBreakdown && state.quote.extrasBreakdown.length > 0) {
                state.quote.extrasBreakdown.forEach(item => {
                    extrasHTML += `
                        <li class="flex justify-between">
                            <span>${item.label}</span>
                            <strong class="text-charcoal">+ R$ ${item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </li>
                    `;
                });
            } else {
                extrasHTML += '<li>Nenhum serviço adicional selecionado.</li>';
            }
            extrasHTML += '</ul>';
            extrasContainer.innerHTML = extrasHTML;
        }

    }

    function getDescriptiveMemorialAsText() {
        let materialDescription = '';
        if (state.material === 'Branco') {
            materialDescription = 'Projeto 100% em MDF Branco TX.';
        } else if (state.material === 'Mesclada') {
            materialDescription = `Estrutura interna em MDF Branco e frentes no padrão *${state.customColor || 'a definir'}*.`;
        } else { // Premium
            materialDescription = `Projeto 100% no padrão MDF Premium *${state.customColor || 'a definir'}*.`;
        }

        const hardwareDescription = state.hardwareType === 'softclose' 
            ? 'Dobradiças com amortecimento (soft-close).'
            : 'Ferragens de alta resistência.';

        const handleName = state.handleType ? `Perfil ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}` : 'Não aplicável';

        return `
*Memorial Descritivo do Projeto:*
- *Material:* ${materialDescription}
- *Acabamento Interno:* ${hardwareDescription}
- *Puxadores:* ${handleName}.
- *Itens Adicionais:* ${state.extras.join(', ') || 'Nenhum'}.
`;
    }

    function getServicesAndClosingAsText(total) {
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return `
*Serviços e Garantia:*
Sua proposta inclui nossa consultoria completa, visita técnica para medição de precisão, entrega, montagem por equipe própria e a limpeza do ambiente após a instalação. Oferecemos garantia total de 5 anos para móveis e ferragens.

---------------------------------
*Proposta de Investimento: ${formatCurrency(total)}*

Esta proposta foi elaborada para oferecer a melhor combinação de qualidade, design e durabilidade. Para garantir estas condições, basta me confirmar por aqui para formalizarmos o seu pedido. Fico à disposição!
`;
    }

    function getQuoteAsText(forEmail = false) {
        const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        let projectSummary = `*Resumo do Projeto:*\n`;
        projectSummary += `---------------------------------\n`;
        projectSummary += `*Ambiente e Medidas:*\n`;
        projectSummary += `- *Tipo:* ${state.furnitureType}\n`;

        if (state.furnitureType === 'Guarda-Roupa') {
            projectSummary += `- *Largura Total:* ${state.dimensions.walls.map(w => w.width).join('m + ')}m\n`;
            projectSummary += `- *Altura:* ${state.dimensions.height}m\n`;
            if (state.wardrobeFormat === 'closet') {
                projectSummary += `- *Formato:* Closet ${state.closetHasDoors ? 'Fechado' : 'Aberto'}\n`;
            }
        } else { // Cozinha
            state.dimensions.walls.forEach((wall, index) => {
                projectSummary += `- *Parede ${index + 1}:* ${wall.width}m (Largura) x ${wall.height}m (Altura)\n`;
            });
            if (state.kitchenHasSinkCabinet) {
                projectSummary += `- *Inclui Balcão de Pia:* Sim (${state.sinkStoneWidth}m)\n`;
            }
        }

        projectSummary += `\n*Materiais e Acabamentos:*\n`;
        projectSummary += `- *Material:* ${state.material}\n`;
        if (state.customColor) {
            projectSummary += `- *Cor Escolhida:* ${state.customColor}\n`;
        }
        projectSummary += `- *Ferragens:* ${state.hardwareType === 'softclose' ? 'Soft-close' : 'Padrão'}\n`;
        if (state.handleType) {
            projectSummary += `- *Puxador:* ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}\n`;
        }

        projectSummary += `\n*Detalhes Adicionais:*\n`;
        if (state.extras.length > 0) {
            projectSummary += `- *Extras:* ${state.extras.join(', ')}\n`;
        }
        projectSummary += `- *Projeto 3D:* ${state.projectOption === 'create' ? 'Solicitado' : (state.projectOption === 'upload' ? 'Cliente possui' : 'Não solicitado')}\n`;
        projectSummary += `---------------------------------`;

        if (forEmail) {
            return projectSummary.replace(/\*/g, ''); // Remove asteriscos para texto puro
        } else {
            return `Olá, Roni! Acabei de fazer uma simulação de orçamento no seu site e gostaria de conversar sobre o projeto.\n\nO valor estimado foi de *${formatCurrency(state.quote.total)}*.\n\n${projectSummary}\n\nAguardo seu contato! Meu nome é ${state.customer.name}.`;
        }
    }

    async function generatePDF() {
        const pdfBtn = document.getElementById('pdf-btn');
        const originalBtnHTML = pdfBtn.innerHTML;
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<div class="spinner mr-2"></div>Gerando...';
    
        try {
            const { jsPDF } = window.jspdf;
            const pdfTemplate = document.getElementById('pdf-template');
    
            const quoteId = Date.now().toString().slice(-6);
            document.getElementById('pdf-quote-id').textContent = quoteId;
            document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('pt-BR');
            
            document.getElementById('pdf-name').textContent = state.customer.name;
            document.getElementById('pdf-email').textContent = state.customer.email || 'Não informado';
            document.getElementById('pdf-phone').textContent = state.customer.phone;
    
            const specsContainer = document.getElementById('pdf-specs-table');
            specsContainer.innerHTML = '';
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
    
            const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            document.getElementById('pdf-total').textContent = formatCurrency(state.quote.total);
    
            const summaryContainer = document.getElementById('pdf-project-summary');
            let summaryHTML = '';
            summaryHTML += `<strong>Ambiente e Medidas:</strong>\n`;
            summaryHTML += `  - Tipo: ${state.furnitureType}\n`;

            if (state.furnitureType === 'Guarda-Roupa') {
                summaryHTML += `  - Largura Total: ${state.dimensions.walls.map(w => w.width).join('m + ')}m\n`;
                summaryHTML += `  - Altura: ${state.dimensions.height}m\n`;
                if (state.wardrobeFormat === 'closet') {
                    summaryHTML += `  - Formato: Closet ${state.closetHasDoors ? 'Fechado' : 'Aberto'}\n`;
                }
            } else { // Cozinha
                state.dimensions.walls.forEach((wall, index) => {
                    summaryHTML += `  - Parede ${index + 1}: ${wall.width}m (Largura) x ${wall.height}m (Altura)\n`;
                });
                if (state.kitchenHasSinkCabinet) {
                    summaryHTML += `  - Inclui Balcão de Pia: Sim (${state.sinkStoneWidth}m)\n`;
                }
            }

            summaryHTML += `\n<strong>Materiais e Acabamentos:</strong>\n`;
            summaryHTML += `  - Material: ${state.material}${state.customColor ? ` (Cor: ${state.customColor})` : ''}\n`;
            summaryHTML += `  - Ferragens: ${state.hardwareType === 'softclose' ? 'Soft-close' : 'Padrão'}\n`;
            if (state.handleType) {
                summaryHTML += `  - Puxador: ${state.handleType.charAt(0).toUpperCase() + state.handleType.slice(1)}\n`;
            }

            summaryContainer.innerHTML = summaryHTML.replace(/\n/g, '<br>');
    
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

    init();
}