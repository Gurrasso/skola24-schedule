const req = new Request("http://192.168.1.50/status.json")
const data = await req.loadJSON()

lesson = {
	"name" : "Matte",
	"teachers" : ["AFo"],
	"rooms" : ["C32"],
	"start" : "10:00",
	"end" : "11:00"
}

build_widget(lesson)

function build_widget(lesson){
	let widget = new ListWidget()

	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(12)
	
	let time = widget.addText(lesson.start, "	", lesson.end)
	time.font = Font.systemFont(12)

	let teachers_rooms = widget.addText(lesson.teachers, "	", lesson.rooms)
	teachers_rooms.font = Font.systemFont(12)
}

Script.setWidget(widget)
Script.complete()
