// Lock Screen widget
let widget = new ListWidget()

let time = new Date().toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit"
})

let text = widget.addText(time)
text.font = Font.systemFont(18)
text.textColor = Color.white()

Script.setWidget(widget)
Script.complete()
