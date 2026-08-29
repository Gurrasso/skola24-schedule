const lesson = {
	name: "Matte",
	teachers: ["AFo"],
	rooms: ["C32"],
	start: "10:00",
	end: "11:00"
}

let widget = new ListWidget()

build_widget(lesson)

function arr_to_string(arr) {
	return arr.join(", ")
}

function build_widget(lesson) {
	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(12)

	let time = widget.addText(`${lesson.start} - ${lesson.end}`)
	time.font = Font.systemFont(12)

	let teachers_rooms = widget.addText(
		`${arr_to_string(lesson.teachers)}		${arr_to_string(lesson.rooms)}`
	)
	teachers_rooms.font = Font.systemFont(12)
}

Script.setWidget(widget)
Script.complete()
