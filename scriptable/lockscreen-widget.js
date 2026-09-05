//
// CONFIG
//

const TIMETABLE_URL = "http://your_ip_address:5000/timetable"

const KEYCHAIN_NAME = "timetable_api_key"

// How often the widget should try to fetch/update the timetable
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour


//
// Script/widget
//


if (!Keychain.contains(KEYCHAIN_NAME)) {
	throw new Error(
		"API key not configured in Scriptable Keychain.\n" +
		'Run a separate setup script with:\n\n' +
		'Keychain.set("KEYCHAIN_NAME", "YOUR_API_KEY")'
	)
}
const API_KEY = Keychain.get(KEYCHAIN_NAME)


let timetable
let cache_age

const fm = FileManager.local()

const cache_path = fm.joinPath(
	fm.documentsDirectory(),
	"timetable.json"
)

const updated_path = fm.joinPath(
	fm.documentsDirectory(),
	"timetable_updated.txt"
)

let should_fetch = true

if (
	fm.fileExists(cache_path) &&
	fm.fileExists(updated_path)
) {
	const last_updated = Number(fm.readString(updated_path))
	cache_age = Date.now() - last_updated

	if (cache_age < CACHE_DURATION) {
		should_fetch = false
	}
}

if (should_fetch) {
	try {
		const request = new Request(TIMETABLE_URL)
		request.timeoutInterval = 5

		request.headers = {
			"Authorization": `Bearer ${API_KEY}`
		}

		const response = await request.load()
		const status = request.response.statusCode

		if (status < 200 || status >= 300) {
			throw new Error(`HTTP ${status}`)
		}

		timetable = await request.loadJSON()

		// Save fresh timetable
		fm.writeString(
			cache_path,
			JSON.stringify(timetable)
		)

		// Save fetch time
		fm.writeString(
			updated_path,
			String(Date.now())
		)

		cache_age = 0

	} catch (error) {
		console.log("Request failed:", error)
	}
}

// Use cache if we didn't fetch, or if fetching failed
if (!timetable && fm.fileExists(cache_path)) {
	timetable = JSON.parse(fm.readString(cache_path))
}

let widget = new ListWidget()

if (timetable) {
	let lesson_data = get_relevant_lesson(timetable)
	if (lesson_data){
		build_widget(lesson_data, cache_age)
	} else {
		build_no_lessons_widget()
	}
} else {
	build_error_widget()
}

function format_minutes(minutes) {
	// Nothing to format
	if (minutes == 0) { return "" }

	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60

	if (hours > 0) {
		return ` | ${hours} h ${mins} min`
	}

	return ` | ${mins} min`
}

function get_relevant_lesson(data) {
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
			const [end_hour, end_minute] = lesson.end.split(":")

			const start_minutes =
				Number(start_hour) * 60 + Number(start_minute)

			const end_minutes =
				Number(end_hour) * 60 + Number(end_minute)

			// Lesson is currently in progress
			if (
				offset === 0 &&
				current_minutes >= start_minutes &&
				current_minutes < end_minutes
			) {
				if (lesson.name == "Lunch") { continue }
				const minutes_until = end_minutes - current_minutes

				return {
					lesson: lesson,
					day: "",
					minutes_until: minutes_until
				}
			}

			// If today, ignore lessons that have already started/ended
			if (offset === 0 && start_minutes <= current_minutes) {
				continue
			}

			// Minutes from now until the lesson starts
			const minutes_until =
				(offset * 24 * 60) +
				start_minutes -
				current_minutes

			return {
				lesson: lesson,
				day: offset === 0 ? "" : day_name.concat(" | "),
				minutes_until: offset !== 0 ? "" : minutes_until
			}
		}
	}

	return []
}

function arr_to_string(arr) {
	return arr.join(", ")
}

function build_widget(lesson_data, cache_age) {
	lesson = lesson_data.lesson
	let name = widget.addText(lesson.name)
	name.font = Font.boldSystemFont(14)

	let time = widget.addText(
		`${lesson_data.day}${lesson.start} - ${lesson.end}${format_minutes(lesson_data.minutes_until)}`
	)
	time.font = Font.systemFont(14)
	time.minimumScaleFactor = 0.8
	time.lineLimit = 2

	let teachers_and_rooms = widget.addText(
		`${lesson.teachers.join(", ")}		${lesson.rooms.join(", ")}`
	)
	teachers_and_rooms.font = Font.systemFont(14)
	teachers_and_rooms.minimumScaleFactor = 0.8
	teachers_and_rooms.lineLimit = 2

	if (cache_age > CACHE_DURATION) {
		let bottom = widget.addStack()
		bottom.layoutHorizontally()
		bottom.addSpacer()

		let cached = bottom.addImage(
			SFSymbol.named("exclamationmark.triangle.fill").image
		)

		cached.imageSize = new Size(8, 8)
		cached.tintColor = Color.gray()
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

function get_refresh_time(){
	let refresh_minutes = 60

	if (timetable) {
		let lesson_data = get_relevant_lesson(timetable)

		if (lesson_data && lesson_data.minutes_until !== "") {
			const minutes = lesson_data.minutes_until

			if (minutes <= 30) {
				refresh_minutes = 1
			} else if (minutes <= 120) {
				refresh_minutes = 5
			} else {
				refresh_minutes = 30
			}
		}
	}

	return refresh_minutes
}

Script.setWidget(widget)

widget.refreshAfterDate = new Date(Date.now() + get_refresh_time() * 60 * 1000)

Script.complete()
