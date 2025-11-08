// Gestion des filtres d'événements
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                button.classList.add('active');
                
                // TODO: Implémenter le filtrage des événements
                const filterValue = button.textContent.toLowerCase();
                // Cette fonctionnalité peut être étendue pour filtrer les événements
            });
        });
    }

    // Gestion du formulaire de contact
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Récupération des données du formulaire
            const formData = new FormData(contactForm);
            const formValues = Object.fromEntries(formData.entries());
            
            // TODO: Implémenter l'envoi du formulaire
            console.log('Données du formulaire :', formValues);
            // Cette partie peut être étendue pour envoyer les données à un serveur
            
            // Réinitialiser le formulaire
            contactForm.reset();
            alert('Merci pour votre message ! Nous vous contacterons bientôt.');
        });
    }
});