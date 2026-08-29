const fm = FileManager.local()
const cache_path = fm.joinPath(
	fm.documentsDirectory(),
	"timetable.json"
)

let timetable
let from_cache = false

try {
	// Get fresh data
	const request = new Request("http://192.168.68.113:5000/timetable")
	request.timeoutInterval = 5

	timetable = await request.loadJSON()

	// Save the fresh data
	fm.writeString(cache_path, JSON.stringify(timetable))

} catch (error) {
	console.log("Request failed:", error)

	// Request failed → use saved data
	if (fm.fileExists(cache_path)) {
		timetable = JSON.parse(fm.readString(cache_path))
		from_cache = true
	}
}

let widget = new ListWidget()

if (timetable) {
	let lesson_data = get_next_lesson(timetable)
	if (lesson_data){
		build_widget(lesson_data.lesson, from_cache)
	} else {
		build_no_lessons_widget()
	}
} else {
	build_error_widget()
}

function get_next_lesson(data) {
  const days = ["Sö", "Må", "Ti", "On", "To", "Fr", "Lö"]
  const now = new Date()

  const current_day = now.getDay()
  const current_minutes = now.getHours() * 60 + now.getMinutes()

  // Search today, then the following 6 days
  for (let offset = 0; offset < 7; offset++) {
    const day_index = (current_day + offset) % 7
    const day_name = days[day_index]

    const day_data = data.find(day => day[day_name])

    if (!day_data) continue

    const lessons = day_data[day_name].lessons

    for (const lesson of lessons) {
      const [start_hour, start_minute] = lesson.start.split(":")
      const start_minutes =
        Number(start_hour) * 60 + Number(start_minute)

      // If today, ignore lessons that have already started
      if (offset === 0 && start_minutes <= current_minutes) {
        continue
      }

      // Minutes from now until the lesson
      const minutes_until =
        (offset * 24 * 60) +
        start_minutes -
        current_minutes

      return {
        lesson: lesson,
        day: offset === 0 ? "" : day_name.concat(" |"),
        minutes_until: minutes_until
      }
    }
  }

  return [] 
}


function arr_to_string(arr) {
	return arr.join(", ")
}

function build_widget(lesson_data, fromCache) {
	lesson = lesson_data.lesson
	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(15)

	let time = widget.addText(
		`${lesson_data.day}${lesson.start} - ${lesson.end}`
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
	let text = widget.addText("No classes found")
	text.font = Font.boldSystemFont(14)

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
