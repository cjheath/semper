(function() {

  $(function() {
    var isFixed, navTop, semper2html, update;
    semper2html = function(input, data) {
      var compiled;
      compiled = Semper.parse(input);
      return Semper.expand(compiled, null, data);
    };
    update = function($input) {
      var $data, $html, data, html, input, json;
      console.log("updating");
      $data = $input.siblings(".json");
      json = $data.val() || "{}";
      $html = $input.closest(".row").find("textarea.html");
      $input.closest(".row").find("textarea").removeClass("error");
      try {
        data = JSON.parse(json);
      } catch (error) {
        $data.addClass("error");
        $html.val("[json] " + error.message).addClass("error");
        return;
      }
      input = $input.val();
      try {
        console.log(input);
        html = semper2html(input, data);
      } catch (error) {
        $input.addClass("error");
        $html.val("[semper] " + error.message).addClass("error");
        return;
      }
      html = html.trim();
      return $html.val(html);
    };
    $("textarea.semper").each(function() {
      return update($(this).on("keyup", function() {
        return update($(this));
      }));
    });
    $("textarea.json").on("keyup", function() {
      return update($(this).siblings(".semper"));
    });
    $("#basics .row").addClass("annotate");
    $.fn.tabOverride.autoIndent = true;
    $.fn.tabOverride.tabSize(2);
    $("textarea").tabOverride();
    navTop = $('.subnav').length && $('.subnav').offset().top;
    isFixed = 0;
    return $(window).on("scroll", function() {
      var i, scrollTop;
      i = void 0;
      scrollTop = $(window).scrollTop();
      if (scrollTop >= navTop && !isFixed) {
        isFixed = 1;
        return $('.subnav').addClass("subnav-fixed");
      } else if (scrollTop <= navTop && isFixed) {
        isFixed = 0;
        return $('.subnav').removeClass("subnav-fixed");
      }
    });
  });

}).call(this);
