function handleSubmit(event) {
    event.preventDefault();
    alert('Thank you for your message! We will get back to you soon. (This is a demo site created by Niyi the Web Developer)');
    event.target.reset();
}

// Smooth scrolling for navigation links
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

// FAQ toggle functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isVisible = answer.style.display === 'block';
        
        // Close all answers
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.style.display = 'none';
        });
        document.querySelectorAll('.faq-question span').forEach(span => {
            span.textContent = '+';
        });
        
        // Toggle current answer
        if (!isVisible) {
            answer.style.display = 'block';
            question.querySelector('span').textContent = '-';
        }
    });
});

// Initially hide FAQ answers
document.querySelectorAll('.faq-answer').forEach(answer => {
    answer.style.display = 'none';
});