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

if (timetable) {
	let lesson = get_next_lesson(timetable).lesson
	if (lesson){
		build_widget(lesson, fromCache)
	} else {
		build_no_lessons_widget()
	}
} else {
	build_error_widget()
}

function get_next_lesson(data) {
  const days = ["Sö", "Må", "Ti", "On", "To", "Fr", "Lö"]
  const now = new Date()

  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Search today, then the following 6 days
  for (let offset = 0; offset < 1; offset++) {
    const dayIndex = (currentDay + offset) % 7
    const dayName = days[dayIndex]

    const dayData = data.find(day => day[dayName])

    if (!dayData) continue

    const lessons = dayData[dayName].lessons

    for (const lesson of lessons) {
      const [startHour, startMinute] = lesson.start.split(":")
      const startMinutes =
        Number(startHour) * 60 + Number(startMinute)

      // If today, ignore lessons that have already started
      if (offset === 0 && startMinutes <= currentMinutes) {
        continue
      }

      return {
        lesson: lesson,
        day: dayName,
        daysFromNow: offset
      }
    }
  }

  return null
}

function arr_to_string(arr) {
	return arr.join(", ")
}

function build_widget(lesson, fromCache) {
	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(16)

	let time = widget.addText(
		`${lesson.start} - ${lesson.end}`
	)
	time.font = Font.systemFont(14)

	let teachers_rooms = widget.addText(
		`${lesson.teachers.join(", ")}		${lesson.rooms.join(", ")}`
	)
	teachers_rooms.font = Font.systemFont(14)

	if (fromCache) {
		widget.addSpacer(4)

		let cached = widget.addText("⚠️ Cached")
		cached.font = Font.systemFont(8)
		cached.textColor = Color.gray()
	}
}

function build_no_lessons_widget(){
	let text = widget.addText("No classes tomorrow!")
	text.font = Font.boldSystemFont(18)

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
