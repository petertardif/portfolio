(function () {
	const chips = document.querySelectorAll('.chip[data-filter]');
	const cards = document.querySelectorAll('.post-card[data-category]');

	if (!chips.length || !cards.length) return;

	chips.forEach(function (chip) {
		chip.addEventListener('click', function () {
			chips.forEach(function (c) { c.classList.remove('chip--active'); });
			chip.classList.add('chip--active');

			const filter = chip.getAttribute('data-filter');
			cards.forEach(function (card) {
				const show = filter === 'All' || card.getAttribute('data-category') === filter;
				card.style.display = show ? '' : 'none';
			});
		});
	});
})();
