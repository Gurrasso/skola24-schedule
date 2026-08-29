const fm = FileManager.local()
const cachePath = fm.joinPath(
	fm.documentsDirectory(),
	"timetable.json"
)

let timetable
let fromCache = false

try {
	// Get fresh data
	const request = new Request("http://192.168.68.113:5000/timetable")
	request.timeoutInterval = 5

	timetable = await request.loadJSON()

	// Save the fresh data
	fm.writeString(cachePath, JSON.stringify(timetable))

} catch (error) {
	console.log("Request failed:", error)

	// Request failed → use saved data
	if (fm.fileExists(cachePath)) {
		timetable = JSON.parse(fm.readString(cachePath))
		fromCache = true
	}
}

let widget = new ListWidget()

if (timetable && !timetable.error) {
	build_widget(get_next_lesson(timetable), fromCache)
} else {
	build_error_widget()
}

main()

function get_next_lessons(data) {
	const days = ["Sö", "Må", "Ti", "On", "To", "Fr", "Lö"]

	const today = days[new Date().getDay()]

	const day_data = data.find(day => day[today])

	if (!day_data) {
		return []
	}

	return day_data[today].lessons
}


function get_next_lesson(data) {
	const lessons = get_next_lessons(data)

	const now = new Date()
	const current_minutes =
		now.getHours() * 60 + now.getMinutes()

	for (const lesson of lessons) {
		const [hours, minutes] = lesson.start.split(":")
		const start_minutes = Number(hours) * 60 + Number(minutes)

		if (start_minutes > current_minutes) {
			return lesson
		}
	}

	return null
}

function arr_to_string(arr) {
	return arr.join(", ")
}

function build_widget(lesson, fromCache) {
	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(12)

	let time = widget.addText(
		`${lesson.start} - ${lesson.end}`
	)
	time.font = Font.systemFont(12)

	let teachers_rooms = widget.addText(
		`${lesson.teachers.join(", ")}		${lesson.rooms.join(", ")}`
	)
	teachers_rooms.font = Font.systemFont(12)

	if (fromCache) {
		widget.addSpacer(4)

		let cached = widget.addText("⚠️ Cached")
		cached.font = Font.systemFont(8)
		cached.textColor = Color.gray()
	}
}


function build_error_widget() {
	let error = widget.addText("⚠️ No data")
	error.font = Font.boldSystemFont(12)

	widget.addSpacer(4)

	let message = widget.addText("Could not connect")
	message.font = Font.systemFont(10)
}

Script.setWidget(widget)
Script.complete()
