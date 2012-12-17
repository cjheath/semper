$ ->

  semper2html = (input, data) ->
    compiled = Semper.parse(input)
    Semper.expand(compiled, null, data)

  update = ($input) ->
    console.log("updating")
    $data = $input.siblings(".json")
    json = $data.val() || "{}"
    $html = $input.closest(".row").find("textarea.html")
    $input.closest(".row").find("textarea").removeClass("error")
    try
      data = JSON.parse json      
    catch error
      $data.addClass("error")
      $html.val("[json] " + error.message).addClass("error")
      return
    input = $input.val()
    try
      console.log input
      html = semper2html input, data
    catch error
      $input.addClass("error")
      $html.val("[semper] " + error.message).addClass("error")
      return
    html = html.trim()
    $html.val html

  $("textarea.semper")
    .each -> update $(@)
    .on "keyup", -> update $(@)

  $("textarea.json").on "keyup", ->
    update $(@).siblings(".semper")

  $("#basics .row").addClass "annotate"

  $.fn.tabOverride.autoIndent = true
  $.fn.tabOverride.tabSize(2)
  $("textarea").tabOverride()

  navTop = $('.subnav').length && $('.subnav').offset().top
  isFixed = 0
  $(window).on "scroll", ->
    i = undefined
    scrollTop = $(window).scrollTop()
    if scrollTop >= navTop and not isFixed
      isFixed = 1
      $('.subnav').addClass "subnav-fixed"
    else if scrollTop <= navTop and isFixed
      isFixed = 0
      $('.subnav').removeClass "subnav-fixed"
