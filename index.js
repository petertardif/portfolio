function autoScrolling() {
	$('#main-nav li a, .responsive-menu li a').click(function(event){
        var targetHref = $(this).attr('href');
	  
        $('html, body').animate({
            scrollTop: $(targetHref).offset().top
        }, 1000);
        $('.hamburger').toggleClass('hamburger--collapse is-active')
    $('.responsive-menu').toggleClass('expand')
    $('button').attr('aria-expanded',function(index,TF) {
        return TF == 'true' ? 'false' : 'true';
    })
        event.preventDefault();
    });
};

function hamburgerMenu() {
  $( '.hamburger' ).click(function(){
    $('.hamburger').toggleClass('hamburger--collapse is-active')
    $('.responsive-menu').toggleClass('expand')
    $('button').attr('aria-expanded',function(index,TF) {
        return TF == 'true' ? 'false' : 'true';
    })
  })
}

function pageLoaded() {
    autoScrolling();
    hamburgerMenu();
}



$(pageLoaded);
