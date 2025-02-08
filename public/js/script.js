// Initialize AOS
AOS.init({
    duration: 800,
    once: true
});

// Counter Animation
const counters = document.querySelectorAll('.counter');
const speed = 200;

const animateCounter = () => {
    counters.forEach(counter => {
        const target = parseInt(counter.innerText.replace(/,/g, ''));
        const count = parseInt(counter.getAttribute('data-count')) || 0;
        const increment = target / speed;

        if (count < target) {
            counter.setAttribute('data-count', Math.ceil(count + increment));
            counter.innerText = numberWithCommas(Math.ceil(count + increment));
            setTimeout(animateCounter, 1);
        } else {
            counter.innerText = numberWithCommas(target);
        }
    });
}

// Utility function to format numbers with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize counters when they come into view
const counterSection = document.querySelector('.counter-section');
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter();
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

if (counterSection) {
    observer.observe(counterSection);
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        try {
            // Show loading state
            Swal.fire({
                title: 'กำลังส่งข้อความ...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'ส่งข้อความสำเร็จ',
                text: 'เราจะติดต่อกลับโดยเร็วที่สุด',
                confirmButtonColor: '#3498db'
            });
            
            // Reset form
            contactForm.reset();
            
        } catch (error) {
            // Show error message
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#3498db'
            });
        }
    });
}

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Initialize Tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});