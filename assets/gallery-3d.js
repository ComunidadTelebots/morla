document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card-3d');

  cards.forEach(card => {
    // Add glare element
    const glare = document.createElement('div');
    glare.classList.add('glare');
    card.appendChild(glare);

    card.addEventListener('mousemove', (e) => {
      card.classList.remove('returning');
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation based on mouse distance from center
      const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg tilt
      const rotateY = ((x - centerX) / centerX) * 15;  // Max 15 deg tilt
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // Move glare relative to mouse position
      glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 60%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.add('returning');
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      glare.style.background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 60%)`;
      
      // Remove returning class after transition ends
      setTimeout(() => {
        card.classList.remove('returning');
      }, 500);
    });
  });
});
