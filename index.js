$(document).ready(function() {
	$('#main-nav li a').click(function(event){
        var targetHref = $(this).attr('href');
	  
        $('html, body').animate({
            scrollTop: $(targetHref).offset().top
        }, 1000);
        
        e.preventDefault();
    });
});
