(function () {
	const menuBtn = document.getElementById('menu-btn');
	const mobileMenu = document.getElementById('mobile-menu');

	if (!menuBtn || !mobileMenu) return;

	function setMenu(open) {
		mobileMenu.classList.toggle('is-open', open);
		menuBtn.setAttribute('aria-expanded', String(open));
		menuBtn.querySelector('i').className = open
			? 'fa-solid fa-xmark'
			: 'fa-solid fa-bars';
	}

	menuBtn.addEventListener('click', function () {
		setMenu(!mobileMenu.classList.contains('is-open'));
	});

	mobileMenu.querySelectorAll('a').forEach(function (link) {
		link.addEventListener('click', function () {
			setMenu(false);
		});
	});
})();
